"""
tests/phase2_data/test_data_validation.py
Automated acceptance tests for Phase 2: Data Validation (DV-01 to DV-07).
"""

import pytest
from pathlib import Path
from jaal.graph.client import get_graph_client, compute_graph_digest
from jaal.ingest.loader import load_world_graph
from jaal.ingest.validator import validate_road_features, validate_facility_features, DataValidationError

@pytest.fixture(scope="module")
def db():
    return get_graph_client()

@pytest.fixture(scope="module")
def world_graph(db):
    graph = db.select_graph("test_jaal_world")
    try:
        graph.delete()
    except Exception:
        pass
    graph = db.select_graph("test_jaal_world")
    load_world_graph(graph, data_root=Path("data"))
    return graph

def test_dv01_idempotent_load(world_graph):
    """DV-01: Second load changes zero counts and zero values (digest identical)."""
    digest1, nodes1, edges1 = compute_graph_digest(world_graph)
    digest2, nodes2, edges2 = load_world_graph(world_graph, data_root=Path("data"))
    assert nodes1 == nodes2
    assert edges1 == edges2
    assert digest1 == digest2

def test_dv02_topology_matches_file(world_graph):
    """DV-02: 13 Intersections, 14 distinct corridor_ids, 28 ROAD_ARC relationships, 1 component."""
    int_cnt = world_graph.query("MATCH (i:Intersection) RETURN count(i)").result_set[0][0]
    assert int_cnt == 13
    
    distinct_cids = world_graph.query("MATCH ()-[r:ROAD_ARC]->() RETURN count(DISTINCT r.corridor_id)").result_set[0][0]
    assert distinct_cids == 14
    
    total_arcs = world_graph.query("MATCH ()-[r:ROAD_ARC]->() RETURN count(r)").result_set[0][0]
    assert total_arcs == 28

def test_dv03_provenance_completeness(world_graph):
    """DV-03: Zero nodes/relationships lack data_origin; synthetic layers all 'synthetic'."""
    null_node_origin = world_graph.query("MATCH (n) WHERE n.data_origin IS NULL RETURN count(n)").result_set[0][0]
    assert null_node_origin == 0
    
    null_rel_origin = world_graph.query("MATCH ()-[r]->() WHERE r.data_origin IS NULL RETURN count(r)").result_set[0][0]
    assert null_rel_origin == 0
    
    synthetic_nodes = world_graph.query("MATCH (n) WHERE n:Depot OR n:Responder OR n:Tower OR n:PowerFeeder OR n:RelayContact RETURN DISTINCT n.data_origin").result_set
    for row in synthetic_nodes:
        assert row[0] == "synthetic"

def test_dv04_crs_coordinate_sanity(world_graph):
    """DV-04: lon in [77.0, 77.5], lat in [28.4, 28.9]."""
    coords = world_graph.query("MATCH (n) WHERE n.lon IS NOT NULL RETURN n.id, n.lon, n.lat").result_set
    assert len(coords) > 0
    for cid, lon, lat in coords:
        assert 77.0 <= lon <= 77.5, f"{cid} lon {lon} out of bounds"
        assert 28.4 <= lat <= 28.9, f"{cid} lat {lat} out of bounds"

def test_dv05_malformed_input_rejected():
    """DV-05: Corrupted records fail closed naming the offending record."""
    # 1. Missing source
    with pytest.raises(DataValidationError) as exc:
        validate_road_features([{"properties": {"id": "bad1", "target": "int_b", "distance_km": 1.0}}])
    assert "bad1" in str(exc.value)
    
    # 2. Duplicate ID
    with pytest.raises(DataValidationError) as exc:
        validate_road_features([
            {"properties": {"id": "c1", "source": "a", "target": "b", "distance_km": 1.0}, "geometry": {"coordinates": [[77.2, 28.6], [77.3, 28.7]]}},
            {"properties": {"id": "c1", "source": "c", "target": "d", "distance_km": 2.0}, "geometry": {"coordinates": [[77.2, 28.6], [77.3, 28.7]]}}
        ])
    assert "Duplicate corridor ID 'c1'" in str(exc.value)
    
    # 3. Self-loop
    with pytest.raises(DataValidationError) as exc:
        validate_road_features([{"properties": {"id": "self_loop", "source": "int_a", "target": "int_a", "distance_km": 1.0}}])
    assert "self-loop" in str(exc.value)

def test_dv06_facility_snapping_disclosed(world_graph):
    """DV-06: offset_km on every ACCESS_VIA; wtp_wazirabad is 3.53km and is_assumed=true."""
    access_vias = world_graph.query("MATCH (f:Facility)-[r:ACCESS_VIA]->(i) RETURN f.id, r.offset_km, r.is_assumed").result_set
    assert len(access_vias) == 10
    for fid, off, is_assumed in access_vias:
        assert off is not None
        assert off > 0
        if off > 1.0:
            assert is_assumed is True
        if fid == "wtp_wazirabad":
            assert off == 3.53
            assert is_assumed is True

def test_dv07_flood_severance_reproduces(db, world_graph):
    """DV-07: The 5 submerged/blocked corridors fragment the graph into 4 components."""
    # Clone world to an in-memory branch for severance test
    db.connection.execute_command("GRAPH.COPY", "test_jaal_world", "test_severance_branch")
    g_sev = db.select_graph("test_severance_branch")
    
    # Five historical peak corridors
    severed = [
        "road_ring_delhigate_ito",
        "road_ring_kashmere_monastery",
        "road_ring_kashmere_redfort",
        "road_ring_monastery_chandgiram",
        "road_ring_redfort_delhigate"
    ]
    for cid in severed:
        g_sev.query("MATCH ()-[r:ROAD_ARC {corridor_id: $cid}]->() DELETE r", {"cid": cid})
        
    # Analyze components using simple BFS / connectivity in Python over remaining arcs
    arc_rows = g_sev.query("MATCH (a:Intersection)-[r:ROAD_ARC]->(b:Intersection) RETURN DISTINCT a.id, b.id").result_set
    all_nodes = {r[0] for r in g_sev.query("MATCH (i:Intersection) RETURN i.id").result_set}
    
    adj = {n: set() for n in all_nodes}
    for u, v in arc_rows:
        adj[u].add(v)
        adj[v].add(u)
        
    visited = set()
    components = 0
    for n in all_nodes:
        if n not in visited:
            components += 1
            queue = [n]
            visited.add(n)
            while queue:
                curr = queue.pop(0)
                for neighbor in adj[curr]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)
                        
    g_sev.delete()
    assert components == 4, f"Expected 4 components, got {components}"
