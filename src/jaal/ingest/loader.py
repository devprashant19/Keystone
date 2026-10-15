"""
jaal.ingest.loader - Idempotent graph world loader for Delhi spatial data and synthetic fixtures.
"""

import json
import time
from pathlib import Path
from typing import Dict, Any, Tuple
from jaal.graph.client import ensure_constraints_and_indexes, compute_graph_digest
from jaal.ingest.validator import validate_road_features, validate_facility_features

FIXTURE_ID = "delhi_july2023"
SPEED_KMH = 24.0

def load_world_graph(graph, data_root: Path = None) -> Tuple[str, int, int]:
    """
    Ingests all spatial and synthetic fixtures idempotently into the target graph.
    Returns (digest, node_count, edge_count).
    """
    root = data_root or Path("data")
    delhi_dir = root / "delhi"
    synth_dir = root / "synthetic"
    
    # 0. Ensure schema constraints & indexes
    ensure_constraints_and_indexes(graph)
    
    now_ts = time.strftime('%Y-%m-%dT%H:%M:%SZ')

    # 1. Road Corridors -> Intersections & ROAD_ARC pairs
    with open(delhi_dir / "road_corridors.geojson", "r", encoding="utf-8") as f:
        road_data = json.load(f)
    
    features = road_data["features"]
    validate_road_features(features)
    
    intersections = {}
    corridors = []
    for feat in features:
        props = feat["properties"]
        cid = props["id"]
        cname = props["name"]
        dist_km = float(props["distance_km"])
        s_node = props["source"]
        t_node = props["target"]
        coords = feat["geometry"]["coordinates"]
        status = props.get("historical_status_peak", "normal")
        
        intersections[s_node] = coords[0]
        intersections[t_node] = coords[-1]
        corridors.append((cid, cname, dist_km, s_node, t_node, status))

    for iid, coords in intersections.items():
        graph.query(
            "MERGE (i:Intersection {id: $id}) "
            "ON CREATE SET i.name = $id, i.lon = $lon, i.lat = $lat, "
            "i.data_origin = 'reference_derived', i.source_ref = 'road_corridors.geojson', "
            "i.is_real_world_observation = false, i.fixture_id = $fid, i.ingested_at = $ts",
            {"id": iid, "lon": coords[0], "lat": coords[1], "fid": FIXTURE_ID, "ts": now_ts}
        )

    for cid, cname, dist_km, s_node, t_node, status in corridors:
        travel_cost = (dist_km / SPEED_KMH) * 60.0
        # Forward arc
        graph.query(
            "MATCH (a:Intersection {id: $s}), (b:Intersection {id: $t}) "
            "MERGE (a)-[r:ROAD_ARC {corridor_id: $cid, direction: 'forward'}]->(b) "
            "ON CREATE SET r.name = $name, r.length_km = $dist, r.travel_cost_min = $cost, "
            "r.status = $status, r.data_origin = 'reference_derived', r.source_ref = 'road_corridors.geojson', "
            "r.is_real_world_observation = false, r.fixture_id = $fid, r.ingested_at = $ts",
            {"s": s_node, "t": t_node, "cid": cid, "name": cname, "dist": dist_km, 
             "cost": travel_cost, "status": status, "fid": FIXTURE_ID, "ts": now_ts}
        )
        # Reverse arc
        graph.query(
            "MATCH (a:Intersection {id: $s}), (b:Intersection {id: $t}) "
            "MERGE (b)-[r:ROAD_ARC {corridor_id: $cid, direction: 'reverse'}]->(a) "
            "ON CREATE SET r.name = $name, r.length_km = $dist, r.travel_cost_min = $cost, "
            "r.status = $status, r.data_origin = 'reference_derived', r.source_ref = 'road_corridors.geojson', "
            "r.is_real_world_observation = false, r.fixture_id = $fid, r.ingested_at = $ts",
            {"s": s_node, "t": t_node, "cid": cid, "name": cname, "dist": dist_km, 
             "cost": travel_cost, "status": status, "fid": FIXTURE_ID, "ts": now_ts}
        )

    # 2. Critical Infrastructure -> Facility & ACCESS_VIA
    with open(delhi_dir / "infrastructure.geojson", "r", encoding="utf-8") as f:
        infra_data = json.load(f)
    
    infra_feats = infra_data["features"]
    validate_facility_features(infra_feats)
    
    for feat in infra_feats:
        props = feat["properties"]
        geom = feat["geometry"]
        fid = props["id"]
        fname = props["name"]
        ftype = props.get("type", "facility")
        crit = int(props.get("criticality", 5))
        beds = props.get("beds", None)
        coords = geom["coordinates"]
        
        # Snapping logic per Section 6.1:
        # LNJP -> int_delhi_gate, Trauma Center -> int_civil_lines
        snap_target = "int_delhi_gate" if "lnjp" in fid else "int_civil_lines"
        offset_km = 0.5
        is_assumed = False
        if fid == "wtp_wazirabad":
            snap_target = "int_civil_lines"
            offset_km = 3.53
            is_assumed = True
            
        graph.query(
            "MERGE (f:Facility {id: $id}) "
            "ON CREATE SET f.name = $name, f.facility_type = $ftype, f.criticality = $crit, "
            "f.beds = $beds, f.lon = $lon, f.lat = $lat, f.is_critical_endpoint = $is_crit, "
            "f.access_offset_km = $off, f.data_origin = 'reference_derived', "
            "f.source_ref = 'infrastructure.geojson', f.is_real_world_observation = false, "
            "f.fixture_id = $fixture_id, f.ingested_at = $ts",
            {"id": fid, "name": fname, "ftype": ftype, "crit": crit, "beds": beds,
             "lon": coords[0], "lat": coords[1], "is_crit": True, "off": offset_km,
             "fixture_id": FIXTURE_ID, "ts": now_ts}
        )
        graph.query(
            "MATCH (f:Facility {id: $fac_id}), (i:Intersection {id: $iid}) "
            "MERGE (f)-[r:ACCESS_VIA]->(i) "
            "ON CREATE SET r.offset_km = $off, r.is_assumed = $assumed, "
            "r.data_origin = 'reference_derived', r.source_ref = 'infrastructure.geojson', "
            "r.is_real_world_observation = false, r.fixture_id = $fixture_id, r.ingested_at = $ts",
            {"fac_id": fid, "iid": snap_target, "off": offset_km, "assumed": is_assumed,
             "fixture_id": FIXTURE_ID, "ts": now_ts}
        )

    # 3. Hazard Zones
    with open(delhi_dir / "flood_july2023.geojson", "r", encoding="utf-8") as f:
        flood_data = json.load(f)
    for feat in flood_data["features"]:
        props = feat.get("properties", {})
        zid = feat.get("id") or props.get("id") or props.get("zone_id")
        zname = props.get("name") or props.get("zone_name") or zid
        htype = props.get("hazard_type", "riverine_flood")
        wl = float(props.get("water_level_m", 208.0))
        depth_cat = props.get("depth_category", props.get("severity", "critical"))
        
        graph.query(
            "MERGE (h:HazardZone {id: $id}) "
            "ON CREATE SET h.name = $name, h.hazard_type = $htype, h.water_level_m = $wl, "
            "h.depth_category = $depth_cat, h.data_origin = 'reference_derived', "
            "h.source_ref = 'flood_july2023.geojson', h.is_real_world_observation = false, "
            "h.fixture_id = $fixture_id, h.ingested_at = $ts",
            {"id": zid, "name": zname, "htype": htype, "wl": wl, "depth_cat": depth_cat,
             "fixture_id": FIXTURE_ID, "ts": now_ts}
        )

    # 4. Synthetic Depots & Responders
    with open(synth_dir / "depots_and_responders.json", "r", encoding="utf-8") as f:
        depot_data = json.load(f)
    for d in depot_data["depots"]:
        graph.query(
            "MERGE (dep:Depot {id: $id}) "
            "ON CREATE SET dep.name = $name, dep.at_intersection = $at_int, "
            "dep.dispatch_delay_min = $delay, dep.data_origin = 'synthetic', "
            "dep.source_ref = 'depots_and_responders.json', dep.is_real_world_observation = false, "
            "dep.fixture_id = $fixture_id, dep.ingested_at = $ts "
            "WITH dep "
            "MATCH (i:Intersection {id: $at_int}) "
            "MERGE (dep)-[r:DEPOT_AT]->(i) "
            "ON CREATE SET r.data_origin = 'synthetic', r.source_ref = 'depots_and_responders.json'",
            {"id": d["id"], "name": d["name"], "at_int": d["at_intersection"],
             "delay": d["dispatch_delay_min"], "fixture_id": FIXTURE_ID, "ts": now_ts}
        )
    for r in depot_data["responders"]:
        graph.query(
            "MERGE (resp:Responder {id: $id}) "
            "ON CREATE SET resp.kind = $kind, resp.home_depot_id = $hdep, "
            "resp.data_origin = 'synthetic', resp.source_ref = 'depots_and_responders.json', "
            "resp.is_real_world_observation = false, resp.fixture_id = $fixture_id, resp.ingested_at = $ts "
            "WITH resp "
            "MATCH (d:Depot {id: $hdep}) "
            "MERGE (resp)-[e:STATIONED_AT]->(d) "
            "ON CREATE SET e.data_origin = 'synthetic', e.source_ref = 'depots_and_responders.json'",
            {"id": r["id"], "kind": r["kind"], "hdep": r["home_depot_id"],
             "fixture_id": FIXTURE_ID, "ts": now_ts}
        )

    # 5. Synthetic Power & Alert Layer
    with open(synth_dir / "power_and_alert.json", "r", encoding="utf-8") as f:
        pa_data = json.load(f)
        
    for pf in pa_data["power_feeders"]:
        graph.query(
            "MERGE (p:PowerFeeder {id: $id}) "
            "ON CREATE SET p.name = $name, p.carrier_corridor_id = $cid, "
            "p.data_origin = 'synthetic', p.source_ref = 'power_and_alert.json', "
            "p.is_real_world_observation = false, p.fixture_id = $fixture_id, p.ingested_at = $ts",
            {"id": pf["id"], "name": pf["name"], "cid": pf["carrier_corridor_id"],
             "fixture_id": FIXTURE_ID, "ts": now_ts}
        )

    for tow in pa_data["towers"]:
        graph.query(
            "MERGE (t:Tower {id: $id}) "
            "ON CREATE SET t.name = $name, t.is_command_source = $cmd, "
            "t.carrier_corridor_id = $cid, t.data_origin = 'synthetic', "
            "t.source_ref = 'power_and_alert.json', t.is_real_world_observation = false, "
            "t.fixture_id = $fixture_id, t.ingested_at = $ts",
            {"id": tow["id"], "name": tow["name"], "cmd": tow["is_command_source"],
             "cid": tow["carrier_corridor_id"], "fixture_id": FIXTURE_ID, "ts": now_ts}
        )
        for pf_id in tow.get("fed_by", []):
            graph.query(
                "MATCH (p:PowerFeeder {id: $pid}), (t:Tower {id: $tid}) "
                "MERGE (p)-[r:FEEDS_TOWER]->(t) "
                "ON CREATE SET r.carrier_corridor_id = $cid, r.data_origin = 'synthetic', "
                "r.source_ref = 'power_and_alert.json'",
                {"pid": pf_id, "tid": tow["id"], "cid": tow["carrier_corridor_id"]}
            )

    for rc in pa_data["relay_contacts"]:
        graph.query(
            "MERGE (r:RelayContact {id: $id}) "
            "ON CREATE SET r.name = $name, r.is_required_target = $req, "
            "r.data_origin = 'synthetic', r.source_ref = 'power_and_alert.json', "
            "r.is_real_world_observation = false, r.fixture_id = $fixture_id, r.ingested_at = $ts "
            "WITH r "
            "MATCH (f:Facility {id: $fac_id}) "
            "MERGE (r)-[c:COVERS]->(f) "
            "ON CREATE SET c.data_origin = 'synthetic', c.source_ref = 'power_and_alert.json'",
            {"id": rc["id"], "name": rc["name"], "req": rc["is_required_target"],
             "fac_id": rc["covers_facility"], "fixture_id": FIXTURE_ID, "ts": now_ts}
        )

    for arc in pa_data["alert_arcs"]:
        graph.query(
            "MATCH (s {id: $src}), (t {id: $dst}) "
            "MERGE (s)-[a:ALERT_ARC {link_id: $lid}]->(t) "
            "ON CREATE SET a.carrier_corridor_id = $cid, a.latency_min = $lat, "
            "a.data_origin = 'synthetic', a.source_ref = 'power_and_alert.json'",
            {"src": arc["source"], "dst": arc["target"], "lid": arc["link_id"],
             "cid": arc.get("carrier_corridor_id"), "lat": float(arc["latency_min"])}
        )

    return compute_graph_digest(graph)
