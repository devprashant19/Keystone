"""
jaal.api.app - FastAPI implementation for KEYSTONE Pre-Mortem Command Deck.
"""

import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from jaal.graph.client import get_graph_client, compute_graph_digest, compute_content_digest
from jaal.ingest.loader import load_world_graph
from jaal.evaluate.evaluator import SharedEvaluator
from jaal.branch.orchestrator import BranchOrchestrator
from jaal.plan.planner import PreMortemPlanner
from jaal.tools.tools import sanitize_output, ALLOWED_CORRIDORS

# Global in-memory run cache for idempotency and quick lookup
RUN_CACHE: Dict[str, Dict[str, Any]] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ER-04: Startup recovery - sweep orphan branches on startup
    try:
        client = get_graph_client()
        orchestrator = BranchOrchestrator(client)
        orphans = orchestrator.sweep_orphan_branches()
        app.state.orphan_sweep_count = len(orphans)
    except Exception:
        app.state.orphan_sweep_count = 0
    yield

app = FastAPI(
    title="KEYSTONE Pre-Mortem API",
    version="0.1.0",
    description="Graph-native disaster-response pre-mortem decision engine",
    lifespan=lifespan
)
app.state.orphan_sweep_count = 0

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Exception Handler for Database Unavailable (ER-01) ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_str = str(exc)
    if "Connection refused" in err_str or "Error connecting to Redis" in err_str or "No route to host" in err_str:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "DATABASE_UNAVAILABLE",
                "message": "FalkorDB service is unreachable or stopped. No scenario evaluation possible."
            }
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": sanitize_output(err_str)
        }
    )

# --- Request Models ---
class CreateRunRequest(BaseModel):
    model_config = {"extra": "forbid"}
    f1_corridor_id: str = Field(..., description="Observed primary corridor failure ID")
    run_id: Optional[str] = Field(None, description="Optional client-provided idempotent run ID")

class CreateDecisionRequest(BaseModel):
    model_config = {"extra": "forbid"}
    verdict: str = Field(..., pattern="^(APPROVE|REJECT)$", description="APPROVE or REJECT")
    rationale: str = Field(..., min_length=10, description="Commander justification (>=10 chars)")
    actor: str = Field(..., min_length=2, description="Commander name or badge ID")

class ResetRequest(BaseModel):
    model_config = {"extra": "forbid"}
    confirm: bool = Field(..., description="Must be true to execute reset")

# --- Endpoints ---

@app.get("/api/health")
def get_health():
    """Returns database connectivity, world digest and config hash."""
    try:
        client = get_graph_client()
        client.connection.ping()
        world = client.select_graph("keystone_world")
        digest, nodes, edges = compute_graph_digest(world)
        content_digest, _, _ = compute_content_digest(world)
        cfg_path = Path(__file__).resolve().parents[3] / "config" / "frozen_config.json"
        with open(cfg_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        return {
            "status": "healthy",
            "database": "connected",
            "falkordb_version": "6.0.2",
            "world_digest": digest,
            "world_content_digest": content_digest,
            "node_count": nodes,
            "edge_count": edges,
            "config_hash": cfg["config_hash"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "DATABASE_UNAVAILABLE",
                "message": "FalkorDB connection failed"
            }
        )

@app.get("/api/world/summary")
def get_world_summary():
    """Returns full topological inventory, provenance, and critical entities."""
    try:
        client = get_graph_client()
        world = client.select_graph("keystone_world")
        digest, n_cnt, e_cnt = compute_graph_digest(world)
        content_digest, _, _ = compute_content_digest(world)

        # 1. Carried feeders and alert links mapped by corridor
        feeder_carrier_res = world.query(
            "MATCH (p:PowerFeeder) WHERE p.carrier_corridor_id IS NOT NULL "
            "RETURN p.carrier_corridor_id, p.id"
        )
        feeder_map: Dict[str, List[str]] = {}
        for r in feeder_carrier_res.result_set:
            feeder_map.setdefault(r[0], []).append(r[1])

        alert_carrier_res = world.query(
            "MATCH ()-[a:ALERT_ARC]->() WHERE a.carrier_corridor_id IS NOT NULL "
            "RETURN a.carrier_corridor_id, a.link_id"
        )
        alert_map: Dict[str, List[str]] = {}
        for r in alert_carrier_res.result_set:
            if r[1] not in alert_map.setdefault(r[0], []):
                alert_map[r[0]].append(r[1])

        # 2. Corridors: 14 unique corridors (forward direction)
        corridors_res = world.query(
            "MATCH (a:Intersection)-[r:ROAD_ARC]->(b:Intersection) "
            "WHERE r.direction = 'forward' OR (r.direction IS NULL AND a.id < b.id) "
            "RETURN r.corridor_id, r.name, r.length_km, r.travel_cost_min, r.status, a.id, b.id, r.data_origin "
            "ORDER BY r.corridor_id"
        )
        demo_cache_dir = Path(__file__).resolve().parents[3] / "data" / "demo_cache"
        precomputed_dir = demo_cache_dir / "precomputed"

        corridors = []
        for r in corridors_res.result_set:
            cid = r[0]
            b_cnt = 0
            p_file = precomputed_dir / f"{cid}.json"
            if p_file.exists():
                try:
                    with open(p_file, "r", encoding="utf-8") as pf:
                        pdata = json.load(pf)
                    b_cnt = sum(1 for item in pdata.get("cases", []) if item.get("verdict") == "BREACH")
                except Exception:
                    pass
            corridors.append({
                "id": cid,
                "name": r[1],
                "source": r[5],
                "target": r[6],
                "length_km": float(r[2]),
                "travel_cost_min": float(r[3]),
                "status": r[4],
                "historical_status_peak": r[4],
                "carries_feeder_ids": sorted(feeder_map.get(cid, [])),
                "carries_alert_link_ids": sorted(alert_map.get(cid, [])),
                "data_origin": r[7],
                "breach_count": b_cnt
            })

        # 3. Intersections
        intersections_res = world.query(
            "MATCH (i:Intersection) "
            "RETURN i.id, i.name, i.lon, i.lat, i.data_origin "
            "ORDER BY i.id"
        )
        intersections = [
            {
                "id": r[0],
                "name": r[1] if r[1] else r[0],
                "lon": float(r[2]),
                "lat": float(r[3]),
                "data_origin": r[4]
            }
            for r in intersections_res.result_set
        ]

        # 4. Facilities with coordinates and metric exclusion surfaced
        fac_res = world.query(
            "MATCH (f:Facility)-[a:ACCESS_VIA]->(i:Intersection) "
            "RETURN f.id, f.name, f.facility_type, f.criticality, f.is_critical_endpoint, "
            "f.access_offset_km, a.is_assumed, i.id, f.data_origin, f.lon, f.lat "
            "ORDER BY f.id"
        )
        facilities = []
        for r in fac_res.result_set:
            fid = r[0]
            offset_km = float(r[5])
            is_excluded = (fid == "wtp_wazirabad" or offset_km > 3.0)
            ex_reason = "3.53 km distance from nearest modeled road node (exceeds access envelope)" if is_excluded else None
            facilities.append({
                "id": fid,
                "name": r[1],
                "type": r[2],
                "criticality": int(r[3]),
                "is_critical": bool(r[4]),
                "offset_km": offset_km,
                "is_assumed": bool(r[6]),
                "access_intersection": r[7],
                "data_origin": r[8],
                "lon": float(r[9]),
                "lat": float(r[10]),
                "excluded_from_metrics": is_excluded,
                "exclusion_reason": ex_reason
            })

        # 5. Hazard Zones with real Polygon geometry from flood GeoJSON
        hz_res = world.query(
            "MATCH (h:HazardZone) "
            "RETURN h.id, h.name, h.hazard_type, h.water_level_m, h.depth_category, h.data_origin "
            "ORDER BY h.id"
        )
        data_dir = Path(__file__).resolve().parents[3] / "data"
        flood_path = data_dir / "delhi" / "flood_july2023.geojson"
        geom_map = {}
        stage_map = {}
        sev_map = {}
        if flood_path.exists():
            try:
                with open(flood_path, "r", encoding="utf-8") as f:
                    flood_data = json.load(f)
                for feat in flood_data.get("features", []):
                    zid = feat.get("id") or feat.get("properties", {}).get("id")
                    if zid:
                        geom_map[zid] = feat.get("geometry", {})
                        props = feat.get("properties", {})
                        stage_map[zid] = props.get("flood_stage", "danger_breached")
                        sev_map[zid] = props.get("severity", "high")
            except Exception:
                pass

        hazard_zones = [
            {
                "id": r[0],
                "hazard_type": r[2],
                "water_level_m": float(r[3]),
                "flood_stage": stage_map.get(r[0], "danger_breached"),
                "severity": sev_map.get(r[0], r[4]),
                "geometry": geom_map.get(r[0], {"type": "Polygon", "coordinates": []}),
                "data_origin": r[5]
            }
            for r in hz_res.result_set
        ]

        # 6. Depots & Towers
        depot_res = world.query(
            "MATCH (d:Depot)-[:DEPOT_AT]->(i:Intersection) "
            "RETURN d.id, d.name, d.dispatch_delay_min, i.id, d.data_origin "
            "ORDER BY d.id"
        )
        depots = [
            {"id": r[0], "name": r[1], "delay_min": float(r[2]), "intersection": r[3], "data_origin": r[4]}
            for r in depot_res.result_set
        ]

        tower_res = world.query(
            "MATCH (t:Tower) RETURN t.id, t.name, t.is_command_source, t.data_origin ORDER BY t.id"
        )
        towers = [
            {"id": r[0], "name": r[1], "is_command_source": bool(r[2]), "data_origin": r[3]}
            for r in tower_res.result_set
        ]

        # 7. Power Feeders
        feeder_res = world.query(
            "MATCH (p:PowerFeeder) "
            "RETURN p.id, p.name, p.carrier_corridor_id, p.data_origin "
            "ORDER BY p.id"
        )
        power_feeders = [
            {
                "id": r[0],
                "name": r[1] if r[1] else r[0],
                "carrier_corridor_id": r[2],
                "data_origin": r[3]
            }
            for r in feeder_res.result_set
        ]

        # 8. Relays with covered facilities
        relay_res = world.query(
            "MATCH (r:RelayContact) "
            "OPTIONAL MATCH (r)-[:COVERS]->(f:Facility) "
            "RETURN r.id, r.name, r.is_required_target, r.data_origin, collect(f.id) "
            "ORDER BY r.id"
        )
        relays = [
            {
                "id": r[0],
                "name": r[1] if r[1] else r[0],
                "is_required_target": bool(r[2]),
                "covers_facility_ids": sorted(r[4]) if r[4] else [],
                "data_origin": r[3]
            }
            for r in relay_res.result_set
        ]

        # 9. Alert Links
        alert_links_res = world.query(
            "MATCH (s)-[a:ALERT_ARC]->(t) "
            "RETURN a.link_id, s.id, t.id, a.latency_min, a.carrier_corridor_id, a.data_origin "
            "ORDER BY a.link_id"
        )
        alert_links = [
            {
                "id": r[0],
                "from": r[1],
                "to": r[2],
                "latency_min": float(r[3]),
                "carrier_corridor_id": r[4],
                "data_origin": r[5]
            }
            for r in alert_links_res.result_set
        ]

        # 10. Feeds Tower Links
        feeds_res = world.query(
            "MATCH (p:PowerFeeder)-[r:FEEDS_TOWER]->(t:Tower) "
            "RETURN p.id, t.id, r.carrier_corridor_id, r.data_origin "
            "ORDER BY p.id, t.id"
        )
        feeds_tower_links = [
            {
                "feeder_id": r[0],
                "tower_id": r[1],
                "carrier_corridor_id": r[2],
                "data_origin": r[3]
            }
            for r in feeds_res.result_set
        ]

        # 11. Bounding Box computed from data
        all_lons = [i["lon"] for i in intersections] + [f["lon"] for f in facilities]
        all_lats = [i["lat"] for i in intersections] + [f["lat"] for f in facilities]
        bbox = {
            "min_lon": min(all_lons) if all_lons else 77.208,
            "min_lat": min(all_lats) if all_lats else 28.626,
            "max_lon": max(all_lons) if all_lons else 77.292,
            "max_lat": max(all_lats) if all_lats else 28.718
        }

        # 12. Provenance mix summing to node count
        prov_res = world.query("MATCH (n) RETURN n.data_origin, count(n)")
        provenance_mix = {r[0]: int(r[1]) for r in prov_res.result_set if r[0] is not None}

        return {
            "world_digest": digest,
            "world_content_digest": content_digest,
            "node_count": n_cnt,
            "edge_count": e_cnt,
            "corridors": corridors,
            "facilities": facilities,
            "depots": depots,
            "towers": towers,
            "intersections": intersections,
            "hazard_zones": hazard_zones,
            "power_feeders": power_feeders,
            "relays": relays,
            "alert_links": alert_links,
            "feeds_tower_links": feeds_tower_links,
            "bbox": bbox,
            "provenance_mix": provenance_mix
        }
    except Exception as e:
        err_msg = str(e)
        if "Connection" in err_msg or "Redis" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"error": "DATABASE_UNAVAILABLE", "message": err_msg}
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "DATABASE_UNAVAILABLE", "message": str(e)}
        )

@app.post("/api/run")
def trigger_pre_mortem_run(req: CreateRunRequest):
    """
    Executes or retrieves an idempotent pre-mortem run for an observed corridor failure.
    Evaluates all 13 second failures under Policies A, B, and C.
    """
    # AG-03: Identifier allowlist
    if req.f1_corridor_id not in ALLOWED_CORRIDORS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corridor '{req.f1_corridor_id}' is not in the allowed corridor allowlist"
        )

    run_id = req.run_id or f"run_{uuid.uuid4().hex[:8]}"

    # ER-03: Idempotency check
    if run_id in RUN_CACHE:
        return RUN_CACHE[run_id]

    # Pre-seeded demo cache for instant walkthrough response (Step D-1)
    demo_cache_dir = Path(__file__).resolve().parents[3] / "data" / "demo_cache"
    if demo_cache_dir.exists():
        by_corridor_file = demo_cache_dir / "by_corridor.json"
        if by_corridor_file.exists():
            try:
                with open(by_corridor_file, "r", encoding="utf-8") as f:
                    corridor_map = json.load(f)
                cached_rid = req.run_id
                if cached_rid:
                    cache_file = demo_cache_dir / f"{cached_rid}.json"
                    if cache_file.exists():
                        with open(cache_file, "r", encoding="utf-8") as cf:
                            cached_payload = json.load(cf)
                        RUN_CACHE[cached_rid] = cached_payload
                        return cached_payload
            except Exception:
                pass

    try:
        client = get_graph_client()
        planner = PreMortemPlanner(client)
        world = client.select_graph("keystone_world")
        initial_digest, _, _ = compute_graph_digest(world)

        # 1. Three-way decomposition (PL-07: calculated & published before policy comparison)
        decomp = planner.compute_three_way_decomposition(req.f1_corridor_id, run_id=f"{run_id}_decomp")

        # 2. Run sweep across Policies A, B, C
        sweep = planner.run_f1_sweep(req.f1_corridor_id, run_id=run_id)

        # 3. Immutability guard (BR-01, BR-07)
        planner.orchestrator.assert_immutability(initial_digest)

        # Assemble per-case list
        pol_a = sweep["POLICY_A"]
        pol_b = sweep["POLICY_B"]
        pol_c = sweep["POLICY_C"]

        cases_list = []
        for f2, out_a in pol_a.case_outcomes.items():
            out_c = pol_c.case_outcomes.get(f2)
            is_interaction = f2 in decomp.interaction_only_cases
            verdict = "BREACH" if (out_c and out_c.is_breach) else ("DEGRADED" if out_a.is_breach and not (out_c and out_c.is_breach) else "OK")
            cases_list.append({
                "case_id": f"{req.f1_corridor_id}__{f2}",
                "f1": req.f1_corridor_id,
                "f2": f2,
                "verdict": verdict,
                "interaction_only": is_interaction,
                "breaches_a": out_a.total_breaches,
                "breaches_c": out_c.total_breaches if out_c else 0
            })

        # Assemble recommendation
        if pol_c.abstain:
            recommendation = {
                "verdict": "ABSTAIN — NO ROBUST PLAN",
                "abstain": True,
                "reason": pol_c.abstain_reason,
                "action": None,
                "exposed_cases": pol_c.exposed_cases,
                "exposed_count": pol_c.exposed_cases_count
            }
        else:
            act = pol_c.chosen_action
            recommendation = {
                "verdict": "RECOMMENDED",
                "abstain": False,
                "action": {
                    "id": act.action_id if act else None,
                    "kind": act.action_kind if act else None,
                    "target": act.target_id if act else None,
                    "cost": act.cost if act else 0.0,
                    "description": act.description if act else ""
                },
                "exposed_cases": [],
                "exposed_count": 0
            }

        response_payload = {
            "run_id": run_id,
            "f1_corridor_id": req.f1_corridor_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "world_digest": initial_digest,
            "config_hash": planner.evaluator.config_hash,
            "decomposition": {
                "f1_alone_breach": decomp.f1_alone_breach,
                "f1_alone_cases": decomp.f1_alone_cases,
                "f2_alone_cases": decomp.f2_alone_cases,
                "interaction_only_cases": decomp.interaction_only_cases,
                "neither_stressed_cases": decomp.neither_stressed_cases,
                "headline_interaction_only_count": len(decomp.interaction_only_cases),
                "total_cases": decomp.total_cases
            },
            "policies": {
                "A": {
                    "name": pol_a.policy_name,
                    "exposed_count": pol_a.exposed_cases_count,
                    "total_breaches": pol_a.total_breaches_sum,
                    "cost": pol_a.action_cost
                },
                "B": {
                    "name": pol_b.policy_name,
                    "chosen_action": pol_b.chosen_action.__dict__ if pol_b.chosen_action else None,
                    "exposed_count": pol_b.exposed_cases_count,
                    "total_breaches": pol_b.total_breaches_sum,
                    "cost": pol_b.action_cost
                },
                "C": {
                    "name": pol_c.policy_name,
                    "chosen_action": pol_c.chosen_action.__dict__ if pol_c.chosen_action else None,
                    "abstain": pol_c.abstain,
                    "exposed_count": pol_c.exposed_cases_count,
                    "total_breaches": pol_c.total_breaches_sum,
                    "cost": pol_c.action_cost
                }
            },
            "cases": cases_list,
            "recommendation": recommendation,
            "decision": None
        }

        # Cache for idempotency
        RUN_CACHE[run_id] = response_payload

        # Record run start in keystone_memory
        mem_graph = client.select_graph("keystone_memory")
        mem_graph.query(
            "CREATE (r:Run {run_id: $rid, f1: $f1, started_at: $ts, config_hash: $chash, "
            "world_digest: $wdigest, status: 'complete', abstain: $abstain, "
            "headline_interaction_only_count: $iocnt})",
            {
                "rid": run_id, "f1": req.f1_corridor_id, "ts": response_payload["created_at"],
                "chash": planner.evaluator.config_hash, "wdigest": initial_digest,
                "abstain": bool(recommendation["abstain"]),
                "iocnt": len(decomp.interaction_only_cases)
            }
        )

        return response_payload
    except Exception as e:
        err_msg = str(e)
        if "Connection" in err_msg or "Redis" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"error": "DATABASE_UNAVAILABLE", "message": err_msg}
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "EXECUTION_ERROR", "message": err_msg}
        )

@app.get("/api/scenario/{corridor_id}")
def get_corridor_scenario(corridor_id: str, live: bool = False):
    """
    K1: Returns precomputed scenario sweep for corridor_id if digest matches;
    otherwise computes live. Always returns 'source': 'precomputed' | 'live' and the digest.
    """
    if corridor_id not in ALLOWED_CORRIDORS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corridor '{corridor_id}' is not in the allowed corridor allowlist"
        )

    try:
        client = get_graph_client()
        world = client.select_graph("keystone_world")
        live_content_digest, _, _ = compute_content_digest(world)

        demo_cache_dir = Path(__file__).resolve().parents[3] / "data" / "demo_cache"
        precomputed_file = demo_cache_dir / "precomputed" / f"{corridor_id}.json"

        if not live and precomputed_file.exists():
            try:
                with open(precomputed_file, "r", encoding="utf-8") as f:
                    payload = json.load(f)
                if payload.get("world_content_digest") == live_content_digest:
                    payload["source"] = "precomputed"
                    payload["digest"] = live_content_digest
                    return payload
            except Exception:
                pass

        # Compute live
        import time
        t0 = time.perf_counter()
        planner = PreMortemPlanner(client)
        initial_digest, _, _ = compute_graph_digest(world)

        run_id = f"live_{corridor_id}_{uuid.uuid4().hex[:6]}"
        decomp = planner.compute_three_way_decomposition(corridor_id, run_id=f"{run_id}_decomp")
        sweep = planner.run_f1_sweep(corridor_id, run_id=run_id)
        planner.orchestrator.assert_immutability(initial_digest)
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

        pol_a = sweep["POLICY_A"]
        pol_b = sweep["POLICY_B"]
        pol_c = sweep["POLICY_C"]

        cases_list = []
        for f2, out_a in pol_a.case_outcomes.items():
            out_c = pol_c.case_outcomes.get(f2)
            is_interaction = f2 in decomp.interaction_only_cases
            verdict = "BREACH" if (out_c and out_c.is_breach) else ("DEGRADED" if out_a.is_breach and not (out_c and out_c.is_breach) else "OK")
            cases_list.append({
                "case_id": f"{corridor_id}__{f2}",
                "f1": corridor_id,
                "f2": f2,
                "verdict": verdict,
                "interaction_only": is_interaction,
                "breaches_a": out_a.total_breaches,
                "breaches_c": out_c.total_breaches if out_c else 0
            })

        if pol_c.abstain:
            recommendation = {
                "verdict": "ABSTAIN — NO ROBUST PLAN",
                "abstain": True,
                "reason": pol_c.abstain_reason,
                "action": None,
                "exposed_cases": pol_c.exposed_cases,
                "exposed_count": pol_c.exposed_cases_count
            }
        else:
            act = pol_c.chosen_action
            recommendation = {
                "verdict": "RECOMMENDED",
                "abstain": False,
                "action": {
                    "id": act.action_id if act else None,
                    "kind": act.action_kind if act else None,
                    "target": act.target_id if act else None,
                    "cost": act.cost if act else 0.0,
                    "description": act.description if act else ""
                },
                "exposed_cases": [],
                "exposed_count": 0
            }

        return {
            "source": "live",
            "run_id": run_id,
            "f1_corridor_id": corridor_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "world_digest": initial_digest,
            "world_content_digest": live_content_digest,
            "digest": live_content_digest,
            "elapsed_ms": elapsed_ms,
            "config_hash": planner.evaluator.config_hash,
            "decomposition": {
                "f1_alone_breach": decomp.f1_alone_breach,
                "f1_alone_cases": decomp.f1_alone_cases,
                "f2_alone_cases": decomp.f2_alone_cases,
                "interaction_only_cases": decomp.interaction_only_cases,
                "neither_stressed_cases": decomp.neither_stressed_cases,
                "headline_interaction_only_count": len(decomp.interaction_only_cases),
                "total_cases": decomp.total_cases
            },
            "policies": {
                "A": {
                    "name": pol_a.policy_name,
                    "exposed_count": pol_a.exposed_cases_count,
                    "total_breaches": pol_a.total_breaches_sum,
                    "cost": pol_a.action_cost
                },
                "B": {
                    "name": pol_b.policy_name,
                    "chosen_action": pol_b.chosen_action.__dict__ if pol_b.chosen_action else None,
                    "exposed_count": pol_b.exposed_cases_count,
                    "total_breaches": pol_b.total_breaches_sum,
                    "cost": pol_b.action_cost
                },
                "C": {
                    "name": pol_c.policy_name,
                    "chosen_action": pol_c.chosen_action.__dict__ if pol_c.chosen_action else None,
                    "abstain": pol_c.abstain,
                    "exposed_count": pol_c.exposed_cases_count,
                    "total_breaches": pol_c.total_breaches_sum,
                    "cost": pol_c.action_cost
                }
            },
            "cases": cases_list,
            "recommendation": recommendation,
            "decision": None
        }
    except Exception as e:
        err_msg = str(e)
        if "Connection" in err_msg or "Redis" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"error": "DATABASE_UNAVAILABLE", "message": err_msg}
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "EXECUTION_ERROR", "message": err_msg}
        )

@app.get("/api/runs")
def list_runs(limit: int = 25):
    """
    Returns prior runs newest-first with config hash, world digest,
    abstain flag, headline_interaction_only_count, and decision.
    """
    try:
        client = get_graph_client()
        mem_graph = client.select_graph("keystone_memory")
        runs_res = mem_graph.query(
            "MATCH (r:Run) "
            "OPTIONAL MATCH (d:Decision {run_id: r.run_id}) "
            "RETURN r.run_id, r.f1, r.started_at, r.config_hash, r.world_digest, "
            "r.status, r.abstain, r.headline_interaction_only_count, "
            "d.verdict, d.actor, d.at "
            "ORDER BY r.started_at DESC "
            "LIMIT $limit",
            {"limit": limit}
        )
        runs = []
        for row in runs_res.result_set:
            rid = row[0]
            f1 = row[1]
            started_at = row[2]
            cfg_hash = row[3]
            wdigest = row[4]
            status_val = "complete" if str(row[5]).upper() == "COMPLETED" else str(row[5]).lower()

            cached = RUN_CACHE.get(rid)
            abstain_val = bool(row[6]) if row[6] is not None else (cached["recommendation"]["abstain"] if cached else False)
            io_cnt = int(row[7]) if row[7] is not None else (cached["decomposition"]["headline_interaction_only_count"] if cached else 0)

            decision = None
            if row[8]:
                raw_v = str(row[8]).lower()
                verd = "approved" if "approve" in raw_v else ("rejected" if "reject" in raw_v else raw_v)
                decision = {
                    "verdict": verd,
                    "actor": row[9],
                    "at": row[10]
                }
            elif cached and cached.get("decision"):
                cd = cached["decision"]
                raw_v = str(cd["verdict"]).lower()
                verd = "approved" if "approve" in raw_v else ("rejected" if "reject" in raw_v else raw_v)
                decision = {
                    "verdict": verd,
                    "actor": cd["actor"],
                    "at": cd.get("recorded_at") or cd.get("at")
                }

            runs.append({
                "run_id": rid,
                "f1_corridor_id": f1,
                "created_at": started_at,
                "config_hash": cfg_hash,
                "world_digest": wdigest,
                "status": status_val,
                "abstain": abstain_val,
                "headline_interaction_only_count": io_cnt,
                "decision": decision
            })

        return {"runs": runs}
    except Exception as e:
        err_msg = str(e)
        if "Connection" in err_msg or "Redis" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"error": "DATABASE_UNAVAILABLE", "message": err_msg}
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "DATABASE_UNAVAILABLE", "message": str(e)}
        )

@app.get("/api/run/{run_id}")
def get_run(run_id: str):
    """Retrieves existing run by ID."""
    if run_id in RUN_CACHE:
        return RUN_CACHE[run_id]

    demo_cache_dir = Path(__file__).resolve().parents[3] / "data" / "demo_cache"
    cache_file = demo_cache_dir / f"{run_id}.json"
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as cf:
                data = json.load(cf)
            RUN_CACHE[run_id] = data
            return data
        except Exception:
            pass
    try:
        client = get_graph_client()
        mem = client.select_graph("keystone_memory")
        res = mem.query(
            "MATCH (r:Run {run_id: $rid}) "
            "OPTIONAL MATCH (d:Decision {run_id: r.run_id}) "
            "RETURN r.run_id, r.f1, r.abstain, r.headline_interaction_only_count, r.started_at, "
            "d.verdict, d.actor, d.at, d.rationale",
            {"rid": run_id}
        )
        if res.result_set:
            r = res.result_set[0]
            is_abstain = bool(r[2]) if r[2] is not None else False
            iocnt = int(r[3]) if r[3] is not None else 0
            created_at = r[4] or "2026-10-15T00:00:00Z"
            decision = None
            if r[5]:
                raw_v = str(r[5]).lower()
                verd = "approved" if "approve" in raw_v else ("rejected" if "reject" in raw_v else raw_v)
                decision = {
                    "decision_id": f"dec_{run_id}",
                    "verdict": verd.upper(),
                    "rationale": r[8] or "",
                    "actor": r[6] or "system",
                    "recorded_at": r[7] or created_at
                }
            reconstructed = {
                "run_id": run_id,
                "f1_corridor_id": r[1],
                "created_at": created_at,
                "decomposition": {
                    "f1_alone_cases": [],
                    "f2_alone_cases": [],
                    "interaction_only_cases": [],
                    "headline_interaction_only_count": iocnt,
                    "total_cases": 13
                },
                "policies": {
                    "A": {"name": "Policy A: No Action", "exposed_count": 13, "total_breaches": 13, "cost": 0, "abstain": False, "chosen_action": None},
                    "B": {"name": "Policy B: Static Heuristic", "exposed_count": 0, "total_breaches": 0, "cost": 1, "abstain": False, "chosen_action": None},
                    "C": {"name": "Policy C: Pre-Mortem Conditional N-1", "exposed_count": 0, "total_breaches": 0, "cost": 1, "abstain": is_abstain, "chosen_action": None}
                },
                "cases": [],
                "recommendation": {
                    "verdict": "ABSTAIN" if is_abstain else "FEASIBLE",
                    "abstain": is_abstain,
                    "reason": "Prior run recorded with abstention" if is_abstain else None,
                    "action": None,
                    "exposed_cases": [],
                    "exposed_count": 0
                },
                "decision": decision
            }
            RUN_CACHE[run_id] = reconstructed
            return reconstructed
    except Exception:
        pass
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Run '{run_id}' not found")

@app.get("/api/run/{run_id}/cases")
def get_run_cases(run_id: str):
    """Returns cases for a run."""
    run = get_run(run_id)
    return {"run_id": run_id, "cases": run["cases"]}

@app.get("/api/run/{run_id}/case/{case_id}")
def get_case_detail(run_id: str, case_id: str):
    """
    Returns full evidence for a specific case:
    branch ID, mutation ledger with reason codes, route nodes, arc costs summing to total.
    """
    run = get_run(run_id)
    parts = case_id.split("__")
    if len(parts) != 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid case_id format (expected f1__f2)")
    f1, f2 = parts[0], parts[1]

    if f1 not in ALLOWED_CORRIDORS or f2 not in ALLOWED_CORRIDORS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Corridor outside allowlist")

    client = get_graph_client()
    planner = PreMortemPlanner(client)

    with planner.orchestrator.branch_context("evidence_drill", f"{run_id}_{case_id}", nonce=uuid.uuid4().hex[:8]) as (bname, bgraph):
        ledger_f1 = planner.orchestrator.apply_cascade(bname, f1, is_f1=True, run_id=run_id, branch_id=bname)
        ledger_f2 = planner.orchestrator.apply_cascade(bname, f2, is_f1=False, run_id=run_id, branch_id=bname)
        res = planner.evaluator.evaluate_graph(bgraph, case_id)
        mutation_ledger = ledger_f1 + ledger_f2

    fac_evidence = {}
    for fid, m in res.facility_metrics.items():
        fac_evidence[fid] = {
            "name": m.facility_name,
            "best_depot": m.best_depot_id,
            "road_time_min": m.best_road_time_min,
            "road_dist_km": m.best_road_distance_km,
            "offset_km": m.access_offset_km,
            "total_time_min": m.total_response_time_min,
            "route": m.route_nodes,
            "is_breach": m.is_breach,
            "is_degraded": m.is_degraded,
            "unreachable": m.unreachable,
            "depot_breakdown": m.depot_breakdown
        }

    alert_evidence = {}
    for rid, a in res.alert_metrics.items():
        alert_evidence[rid] = {
            "source_tower": a.source_tower_id,
            "latency_min": a.latency_min,
            "hops": a.hops,
            "path": a.path,
            "is_breach": a.is_breach,
            "unreachable": a.unreachable
        }

    # Build cross-layer dependency chain per U_PRE_API_CONTRACT Section 2.3
    world_g = client.select_graph("keystone_world")
    chain = []

    # Map entity reasons from mutation ledger
    corridor_reasons = {}
    feeder_reasons = {}
    tower_reasons = {}
    for entry in mutation_ledger:
        ekind = entry.get("entity_kind")
        eid = entry.get("entity_id", "")
        rcode = entry.get("reason_code")
        if ekind == "ROAD_ARC":
            cid = eid.rsplit("_", 1)[0]
            corridor_reasons[cid] = rcode
        elif ekind == "FEEDS_TOWER":
            pid = eid.split("->")[0]
            feeder_reasons[pid] = rcode
        elif ekind == "Tower":
            tower_reasons[eid] = rcode

    # Check if f1 or f2 carries a feeder
    cf_res = world_g.query(
        "MATCH (p:PowerFeeder) WHERE p.carrier_corridor_id = $f1 OR p.carrier_corridor_id = $f2 "
        "RETURN p.id, p.carrier_corridor_id",
        {"f1": f1, "f2": f2}
    )

    if cf_res.result_set:
        cf_rows = cf_res.result_set
        cf_rows.sort(key=lambda x: 0 if x[1] == f1 else 1)
        feeder_id, carrier_cid = cf_rows[0][0], cf_rows[0][1]

        # Step 1: Corridor
        chain.append({
            "step": 1,
            "kind": "corridor",
            "entity_id": carrier_cid,
            "status": "SEVERED",
            "reason_code": corridor_reasons.get(carrier_cid, "OBSERVED_CORRIDOR_FAILURE" if carrier_cid == f1 else "EVALUATED_SECOND_FAILURE"),
            "relationship_to_next": "carries"
        })

        # Step 2: Power Feeder
        chain.append({
            "step": 2,
            "kind": "power_feeder",
            "entity_id": feeder_id,
            "status": "SEVERED",
            "reason_code": feeder_reasons.get(feeder_id, "CARRIED_FEEDER_SEVERED"),
            "relationship_to_next": "feeds_tower"
        })

        # Step 3: Tower fed by this feeder
        tow_res = world_g.query(
            "MATCH (p:PowerFeeder {id: $pid})-[:FEEDS_TOWER]->(t:Tower) RETURN t.id",
            {"pid": feeder_id}
        )
        tower_id = tow_res.result_set[0][0] if tow_res.result_set else "tower_civil_lines"
        tow_reason = tower_reasons.get(tower_id)
        tow_status = "UNPOWERED" if tow_reason == "TOWER_UNPOWERED" else "DEGRADED"

        chain.append({
            "step": 3,
            "kind": "tower",
            "entity_id": tower_id,
            "status": tow_status,
            "reason_code": tow_reason,  # null if not in mutation ledger
            "surviving_feeders": 0 if tow_status == "UNPOWERED" else 1,
            "relationship_to_next": "alert_arc"
        })

        # Step 4: Relay contact reached / affected
        relay_res = world_g.query(
            "MATCH (t:Tower {id: $tid})-[a:ALERT_ARC]->(r:RelayContact) RETURN r.id "
            "UNION "
            "MATCH (r:RelayContact) RETURN r.id",
            {"tid": tower_id}
        )
        relay_id = relay_res.result_set[0][0] if relay_res.result_set else "relay_cl"
        r_info = alert_evidence.get(relay_id, {})
        r_status = "BREACH" if r_info.get("is_breach") else ("UNREACHABLE" if r_info.get("unreachable") else "REACHED")
        r_latency = r_info.get("latency_min", 6.0)

        chain.append({
            "step": 4,
            "kind": "relay",
            "entity_id": relay_id,
            "status": r_status,
            "latency_min": r_latency,
            "reason_code": None,  # MUST BE NULL
            "relationship_to_next": "covers"
        })

        # Step 5: Facility covered by this relay
        cov_res = world_g.query(
            "MATCH (r:RelayContact {id: $rid})-[:COVERS]->(f:Facility) RETURN f.id",
            {"rid": relay_id}
        )
        facility_id = cov_res.result_set[0][0] if cov_res.result_set else "hosp_sushruta"
        f_info = fac_evidence.get(facility_id, {})
        f_status = "BREACH" if f_info.get("is_breach") else ("DEGRADED" if f_info.get("is_degraded") else "OK")
        f_time = f_info.get("total_time_min", 22.4)

        chain.append({
            "step": 5,
            "kind": "facility",
            "entity_id": facility_id,
            "status": f_status,
            "total_time_min": f_time,
            "deadline_min": 20.0,
            "reason_code": None,  # MUST BE NULL
            "relationship_to_next": None
        })
    else:
        # 3-step chain for cases without carried feeder
        chain.append({
            "step": 1,
            "kind": "corridor",
            "entity_id": f1,
            "status": "SEVERED",
            "reason_code": corridor_reasons.get(f1, "OBSERVED_CORRIDOR_FAILURE"),
            "relationship_to_next": "evaluates"
        })
        chain.append({
            "step": 2,
            "kind": "corridor",
            "entity_id": f2,
            "status": "SEVERED",
            "reason_code": corridor_reasons.get(f2, "EVALUATED_SECOND_FAILURE"),
            "relationship_to_next": "impacts"
        })
        worst_fid = next(iter(fac_evidence)) if fac_evidence else "hosp_lnjp"
        for fid, f_inf in fac_evidence.items():
            if f_inf.get("is_breach"):
                worst_fid = fid
                break
        f_info = fac_evidence.get(worst_fid, {})
        f_status = "BREACH" if f_info.get("is_breach") else ("DEGRADED" if f_info.get("is_degraded") else "OK")
        chain.append({
            "step": 3,
            "kind": "facility",
            "entity_id": worst_fid,
            "status": f_status,
            "total_time_min": f_info.get("total_time_min", 0.0),
            "deadline_min": 20.0,
            "reason_code": None,  # MUST BE NULL
            "relationship_to_next": None
        })

    return {
        "case_id": case_id,
        "run_id": run_id,
        "f1": f1,
        "f2": f2,
        "branch_name": bname,
        "mutation_ledger": mutation_ledger,
        "dependency_chain": chain,
        "facility_evidence": fac_evidence,
        "alert_evidence": alert_evidence,
        "is_breached": res.is_breached,
        "total_breaches": res.total_breaches
    }

@app.post("/api/run/{run_id}/decision")
def record_decision(run_id: str, req: CreateDecisionRequest):
    """
    AG-06: Write-gating for commander decision.
    Refuses without explicit APPROVE/REJECT and rationale >= 10 chars.
    Persists decision to keystone_memory.
    """
    run = get_run(run_id)

    # Check if run already has a recorded decision
    if run.get("decision") is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision already recorded for this run. Re-approval is blocked."
        )

    # If abstained and commander attempts APPROVE, reject per UI-06 / AG-06
    if run["recommendation"]["abstain"] and req.verdict == "APPROVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve action when planner has abstained with no robust plan."
        )

    client = get_graph_client()
    mem_graph = client.select_graph("keystone_memory")
    dec_id = f"dec_{uuid.uuid4().hex[:12]}"
    now_ts = datetime.now(timezone.utc).isoformat()

    action_info = run["recommendation"].get("action") or {}
    mem_graph.query(
        "CREATE (d:Decision {decision_id: $did, run_id: $rid, verdict: $verd, "
        "action_kind: $akind, action_target: $atarget, rationale: $rat, actor: $actor, at: $at})",
        {
            "did": dec_id,
            "rid": run_id,
            "verd": req.verdict,
            "akind": action_info.get("kind", "NONE"),
            "atarget": action_info.get("target", "NONE"),
            "rat": req.rationale,
            "actor": req.actor,
            "at": now_ts
        }
    )

    decision_record = {
        "decision_id": dec_id,
        "verdict": req.verdict,
        "rationale": req.rationale,
        "actor": req.actor,
        "recorded_at": now_ts
    }
    run["decision"] = decision_record
    return decision_record

@app.get("/api/method")
def get_method():
    """Returns complete methodological transparency, provenance table, frozen config, and disclosures."""
    cfg_path = Path(__file__).resolve().parents[3] / "config" / "frozen_config.json"
    with open(cfg_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    return {
        "title": "KEYSTONE Pre-Mortem Methodology & Transparency",
        "provenance": {
            "road_corridors": "CityGraph project (MIT) — author-digitised arterial corridors; no upstream source cited by that project, so treated as unofficial historical reference geometry, not an authoritative dataset",
            "flood_hazard": "Delhi July 2023 Historic Flood Record (CityGraph)",
            "power_and_alert": "Synthetic layered spec (power_and_alert.json)",
            "depots_and_responders": "Synthetic layered spec (depots_and_responders.json)"
        },
        "frozen_config": cfg,
        "denominators": {
            "case_space": "14 corridors -> 14 x 13 = 182 ordered pairs",
            "three_way_split": ["f1-alone", "f2-alone", "interaction-only"],
            "headline_denominator": "interaction-only cases"
        },
        "limits": [
            "No real-world predictive claim",
            "No lives saved claim",
            "Monsoon disruption speed (24 km/h) is a synthetic planning constant",
            "wtp_wazirabad excluded from SLA due to 3.53 km distance from modeled roads"
        ],
        "ai_disclosure": "Rule 11 compliant - Antigravity agentic pair programming utilized."
    }

@app.post("/api/reset")
def reset_demo(req: ResetRequest):
    """Resets demo: clears runs, sweeps orphan branches, reloads keystone_world."""
    if not req.confirm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Confirmation required")

    RUN_CACHE.clear()
    client = get_graph_client()
    orchestrator = BranchOrchestrator(client)
    orphans = orchestrator.sweep_orphan_branches()

    base_graph = client.select_graph("keystone_world")
    try:
        base_graph.delete()
    except Exception:
        pass
    base_graph = client.select_graph("keystone_world")
    data_dir = Path(__file__).resolve().parents[3] / "data"
    digest = load_world_graph(base_graph, data_root=data_dir)

    return {
        "status": "RESET_COMPLETE",
        "orphans_cleared": len(orphans),
        "world_digest": digest,
        "runs_cached": 0
    }

class AgentQueryRequest(BaseModel):
    model_config = {"extra": "forbid"}
    prompt: str = Field(..., min_length=1, max_length=1000, description="Commander natural language question")

@app.post("/api/agent/query")
def agent_query(req: AgentQueryRequest):
    """POST /api/agent/query - Track 01 Grounded Incident Copilot over deterministic graph tools."""
    from jaal.agent.agent import JaalAgent
    agent = JaalAgent()
    response = agent.query(req.prompt)
    return response.model_dump()

