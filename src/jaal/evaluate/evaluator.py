"""
jaal.evaluate.evaluator - THE single shared evaluator for road access and alert delivery SLAs.
Used identically across Policy A (No-Action), Policy B (Static Heuristic), and Policy C (Pre-Mortem).
"""

import json
import heapq
from pathlib import Path
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple, Set

@dataclass
class FacilityMetric:
    facility_id: str
    facility_name: str
    best_depot_id: Optional[str]
    best_road_time_min: Optional[float]
    best_road_distance_km: Optional[float]
    access_offset_km: float
    total_response_time_min: Optional[float]
    route_nodes: List[str]
    is_breach: bool
    is_degraded: bool
    unreachable: bool
    depot_breakdown: Dict[str, Dict[str, Any]] = field(default_factory=dict)

@dataclass
class AlertMetric:
    relay_id: str
    source_tower_id: Optional[str]
    latency_min: Optional[float]
    hops: int
    path: List[str]
    is_breach: bool
    unreachable: bool

@dataclass
class EvaluationResult:
    case_id: str
    access_breaches: List[str]
    access_degraded: List[str]
    facility_metrics: Dict[str, FacilityMetric]
    alert_breaches: List[str]
    alert_metrics: Dict[str, AlertMetric]
    is_breached: bool
    total_breaches: int
    unreachable_facilities: List[str]
    config_hash: str
    # AB-02: when the evaluated graph carries no relationship context, the honest
    # answer is "cannot evaluate", NOT "everything is breached". An evaluator that
    # reports breaches here would be asserting a verdict it has no evidence for.
    abstained: bool = False
    abstain_reason: Optional[str] = None

class SharedEvaluator:
    """
    Authoritative evaluation engine.
    Ensures identical metrics and invariants across all policies.
    """
    def __init__(self, config_path: Optional[Path] = None):
        cfg_file = config_path or Path(__file__).resolve().parents[3] / "config" / "frozen_config.json"
        with open(cfg_file, "r", encoding="utf-8") as f:
            self.config = json.load(f)
            
        self.access_deadline_min = float(self.config["access_deadline_min"])
        self.dispatch_delay_no_action_min = float(self.config["dispatch_delay_no_action_min"])
        self.dispatch_delay_pre_positioned_min = float(self.config["dispatch_delay_pre_positioned_min"])
        self.speed_kmh = float(self.config["assumed_arterial_speed_kmh"])
        self.alert_deadline_min = float(self.config["alert_delivery_deadline_min"])
        self.alert_hop_bound = int(self.config["alert_hop_bound"])
        self.road_hop_bound = int(self.config["road_hop_bound"])
        self.config_hash = self.config["config_hash"]

    def _dijkstra(
        self,
        adj: Dict[str, List[Tuple[str, float, float]]],
        source: str,
        target: str
    ) -> Tuple[Optional[float], Optional[float], List[str]]:
        """
        Calculates shortest path by travel_cost_min from source to target.
        adj: u -> list of (v, travel_cost_min, length_km)
        Returns: (total_cost_min, total_distance_km, path_nodes) or (None, None, []) if unreachable.
        """
        if source == target:
            return 0.0, 0.0, [source]
            
        distances: Dict[str, float] = {source: 0.0}
        distances_km: Dict[str, float] = {source: 0.0}
        predecessors: Dict[str, Optional[Tuple[str, float]]] = {source: None}
        pq = [(0.0, source)]
        
        while pq:
            current_cost, u = heapq.heappop(pq)
            if current_cost > distances.get(u, float("inf")):
                continue
            if u == target:
                break
                
            for v, cost_min, dist_km in adj.get(u, []):
                new_cost = current_cost + cost_min
                if new_cost < distances.get(v, float("inf")):
                    distances[v] = new_cost
                    distances_km[v] = distances_km.get(u, 0.0) + dist_km
                    predecessors[v] = (u, dist_km)
                    heapq.heappush(pq, (new_cost, v))

        if target not in distances:
            return None, None, []

        # Reconstruct path
        path = []
        curr = target
        while curr is not None:
            path.append(curr)
            pred_tuple = predecessors.get(curr)
            curr = pred_tuple[0] if pred_tuple else None
        path.reverse()
        
        return distances[target], distances_km[target], path

    def _alert_shortest_path(
        self,
        adj: Dict[str, List[Tuple[str, float]]],
        sources: Set[str],
        target: str
    ) -> Tuple[Optional[float], int, List[str], Optional[str]]:
        """
        Calculates shortest directed path from any source tower to target relay contact.
        Enforces alert_hop_bound.
        Returns: (best_latency_min, hops, path, best_source_tower) or (None, 0, [], None).
        """
        best_latency: Optional[float] = None
        best_hops: int = 0
        best_path: List[str] = []
        best_src: Optional[str] = None

        for src in sources:
            # Dijkstra bounded by hops
            # pq entries: (latency, hops, current_node, path)
            pq = [(0.0, 0, src, [src])]
            visited_at_hops: Dict[str, int] = {}

            while pq:
                latency, hops, u, path = heapq.heappop(pq)
                if hops > self.alert_hop_bound:
                    continue
                if u == target:
                    if best_latency is None or latency < best_latency:
                        best_latency = latency
                        best_hops = hops
                        best_path = path
                        best_src = src
                    break

                if u in visited_at_hops and visited_at_hops[u] <= hops:
                    continue
                visited_at_hops[u] = hops

                for v, edge_latency in adj.get(u, []):
                    if hops + 1 <= self.alert_hop_bound:
                        heapq.heappush(pq, (latency + edge_latency, hops + 1, v, path + [v]))

        return best_latency, best_hops, best_path, best_src

    def evaluate_graph(
        self,
        graph,
        case_id: str = "case_evaluation",
        depot_delay_overrides: Optional[Dict[str, float]] = None,
        baseline_response_times: Optional[Dict[str, float]] = None
    ) -> EvaluationResult:
        """
        Executes complete evaluation against the provided FalkorDB graph instance.
        """
        # 1. Fetch road adjacency
        road_res = graph.query(
            "MATCH (a:Intersection)-[r:ROAD_ARC]->(b:Intersection) "
            "RETURN a.id, b.id, r.travel_cost_min, r.length_km"
        )
        road_adj: Dict[str, List[Tuple[str, float, float]]] = {}
        for row in road_res.result_set:
            u, v, cost, dist = row[0], row[1], float(row[2]), float(row[3])
            road_adj.setdefault(u, []).append((v, cost, dist))

        # AB-02 ABSTENTION GATE.
        # If the graph has no ROAD_ARC relationships at all, there is no topology to
        # reason over. Access time is undefined, not infinite. Return an explicit
        # abstention with empty verdict lists rather than labelling every facility a
        # breach -- "we cannot answer" and "the answer is bad" are different claims,
        # and conflating them would turn the relation-context ablation into a
        # fabricated result.
        if not road_adj:
            return EvaluationResult(
                case_id=case_id,
                access_breaches=[],
                access_degraded=[],
                facility_metrics={},
                alert_breaches=[],
                alert_metrics={},
                is_breached=False,
                total_breaches=0,
                unreachable_facilities=[],
                config_hash=self.config_hash,
                abstained=True,
                abstain_reason="NO_RELATION_CONTEXT_CANNOT_EVALUATE_ACCESS"
            )

        # 2. Fetch depots
        depot_res = graph.query("MATCH (d:Depot)-[:DEPOT_AT]->(i:Intersection) RETURN d.id, d.name, i.id, d.dispatch_delay_min")
        depots = []
        for row in depot_res.result_set:
            d_id, d_name, d_int, d_delay = row[0], row[1], row[2], float(row[3])
            # Apply any action-specific delay override (e.g. pre-positioning -> 1.0 min)
            if depot_delay_overrides and d_id in depot_delay_overrides:
                d_delay = depot_delay_overrides[d_id]
            depots.append({"id": d_id, "name": d_name, "int_id": d_int, "delay_min": d_delay})

        # 3. Fetch critical facilities
        # Section 10.3: wtp_wazirabad excluded from SLA metrics
        fac_res = graph.query(
            "MATCH (f:Facility {is_critical_endpoint: true}) "
            "WHERE f.id <> 'wtp_wazirabad' "
            "OPTIONAL MATCH (f)-[a:ACCESS_VIA]->(i:Intersection) "
            "RETURN f.id, f.name, f.access_offset_km, i.id"
        )
        critical_facilities = []
        for row in fac_res.result_set:
            f_id, f_name = row[0], row[1]
            offset_km = float(row[2]) if row[2] is not None else 0.0
            f_int = row[3]
            critical_facilities.append({"id": f_id, "name": f_name, "offset_km": offset_km, "int_id": f_int})

        # Evaluate Road Access
        facility_metrics: Dict[str, FacilityMetric] = {}
        access_breaches: List[str] = []
        access_degraded: List[str] = []
        unreachable_facilities: List[str] = []

        for fac in critical_facilities:
            fid = fac["id"]
            fname = fac["name"]
            offset_km = fac["offset_km"]
            f_int = fac["int_id"]
            offset_time_min = (offset_km / self.speed_kmh) * 60.0

            best_depot_id = None
            best_total_time: Optional[float] = None
            best_road_time: Optional[float] = None
            best_road_dist: Optional[float] = None
            best_route: List[str] = []
            depot_breakdown = {}

            if f_int is not None and depots:
                for d in depots:
                    d_id = d["id"]
                    d_int = d["int_id"]
                    d_delay = d["delay_min"]

                    road_time, road_dist, route = self._dijkstra(road_adj, d_int, f_int)
                    if road_time is not None:
                        total_time = d_delay + road_time + offset_time_min
                        depot_breakdown[d_id] = {
                            "road_time_min": road_time,
                            "road_dist_km": road_dist,
                            "dispatch_delay_min": d_delay,
                            "offset_time_min": offset_time_min,
                            "total_time_min": total_time,
                            "route": route
                        }
                        if best_total_time is None or total_time < best_total_time:
                            best_total_time = total_time
                            best_depot_id = d_id
                            best_road_time = road_time
                            best_road_dist = road_dist
                            best_route = route
                    else:
                        depot_breakdown[d_id] = {
                            "unreachable": True,
                            "dispatch_delay_min": d_delay
                        }

            is_unreachable = best_total_time is None
            if is_unreachable:
                is_breach = True
                is_deg = False
                unreachable_facilities.append(fid)
                access_breaches.append(fid)
            else:
                is_breach = best_total_time > self.access_deadline_min
                # EV-04: Breach vs degraded exclusivity
                if is_breach:
                    is_deg = False
                    access_breaches.append(fid)
                else:
                    baseline_time = baseline_response_times.get(fid) if baseline_response_times else None
                    if baseline_time is not None and best_total_time > baseline_time:
                        is_deg = True
                        access_degraded.append(fid)
                    else:
                        is_deg = False

            facility_metrics[fid] = FacilityMetric(
                facility_id=fid,
                facility_name=fname,
                best_depot_id=best_depot_id,
                best_road_time_min=best_road_time,
                best_road_distance_km=best_road_dist,
                access_offset_km=offset_km,
                total_response_time_min=best_total_time,
                route_nodes=best_route,
                is_breach=is_breach,
                is_degraded=is_deg,
                unreachable=is_unreachable,
                depot_breakdown=depot_breakdown
            )

        # 4. Evaluate Alert Reachability
        tower_res = graph.query("MATCH (t:Tower {is_command_source: true}) RETURN t.id")
        command_towers = {row[0] for row in tower_res.result_set}

        relay_res = graph.query("MATCH (r:RelayContact {is_required_target: true}) RETURN r.id")
        required_relays = [row[0] for row in relay_res.result_set]

        alert_res = graph.query("MATCH (s)-[a:ALERT_ARC]->(t) RETURN s.id, t.id, a.latency_min")
        alert_adj: Dict[str, List[Tuple[str, float]]] = {}
        for row in alert_res.result_set:
            u, v, lat = row[0], row[1], float(row[2])
            alert_adj.setdefault(u, []).append((v, lat))

        alert_metrics: Dict[str, AlertMetric] = {}
        alert_breaches: List[str] = []

        for r_id in required_relays:
            lat, hops, path, src_tow = self._alert_shortest_path(alert_adj, command_towers, r_id)
            unreach = lat is None
            if unreach:
                is_b = True
                alert_breaches.append(r_id)
            else:
                is_b = lat > self.alert_deadline_min
                if is_b:
                    alert_breaches.append(r_id)

            alert_metrics[r_id] = AlertMetric(
                relay_id=r_id,
                source_tower_id=src_tow,
                latency_min=lat,
                hops=hops,
                path=path,
                is_breach=is_b,
                unreachable=unreach
            )

        total_breaches = len(access_breaches) + len(alert_breaches)
        is_breached = total_breaches > 0

        return EvaluationResult(
            case_id=case_id,
            access_breaches=access_breaches,
            access_degraded=access_degraded,
            facility_metrics=facility_metrics,
            alert_breaches=alert_breaches,
            alert_metrics=alert_metrics,
            is_breached=is_breached,
            total_breaches=total_breaches,
            unreachable_facilities=unreachable_facilities,
            config_hash=self.config_hash
        )
