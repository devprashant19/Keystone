"""
tests/phase1_smoke/test_smoke.py
Automated validation of Phase 1 smoke battery (SM-01 to SM-10).
"""

import pytest
from falkordb import FalkorDB
import redis
import time

@pytest.fixture(scope="module")
def db():
    return FalkorDB(host="localhost", port=6379)

def test_sm01_server_running(db):
    info = db.connection.info()
    assert "redis_version" in info

def test_sm02_client_heartbeat(db):
    g = db.select_graph("probe_test_hb")
    res = g.query("RETURN 1 AS ping")
    assert res.result_set[0][0] == 1
    g.delete()

def test_sm03_parameterized_query(db):
    g = db.select_graph("probe_test_param")
    g.query("CREATE (n:Probe {id: $id, val: $val})", {"id": "p1", "val": 99})
    res = g.query("MATCH (n:Probe {id: $id}) RETURN n.val", {"id": "p1"})
    assert res.result_set[0][0] == 99
    g.delete()

def test_sm04_procedure_availability(db):
    g = db.select_graph("probe_test_proc")
    g.query("CREATE (a:Node {id: 'A'}), (b:Node {id: 'B'}), (a)-[:ROAD_ARC {weight: 2.5}]->(b)")
    # Test native algo.SPpaths
    res = g.query("MATCH (a:Node {id: 'A'}), (b:Node {id: 'B'}) CALL algo.SPpaths({sourceNode: a, targetNode: b, relTypes: ['ROAD_ARC'], weightProp: 'weight'}) YIELD path, pathWeight RETURN pathWeight")
    assert len(res.result_set) == 1
    assert res.result_set[0][0] == 2.5
    # Test algo.betweenness
    res_b = g.query("CALL algo.betweenness() YIELD node, score RETURN node, score")
    assert len(res_b.result_set) >= 1
    g.delete()

def test_sm05_graph_copy_and_collision(db):
    g = db.select_graph("probe_base")
    g.query("CREATE (:N {id: 1})")
    
    # 1. Happy path copy
    db.connection.execute_command("GRAPH.COPY", "probe_base", "probe_copy")
    g_copy = db.select_graph("probe_copy")
    cnt = g_copy.query("MATCH (n) RETURN count(n)").result_set[0][0]
    assert cnt == 1
    
    # 2. Duplicate destination collision
    with pytest.raises(redis.exceptions.ResponseError) as exc_info:
        db.connection.execute_command("GRAPH.COPY", "probe_base", "probe_copy")
    assert "destination key already exists" in str(exc_info.value).lower()
    
    # Clean up
    g_copy.delete()
    g.delete()

def test_sm06_variable_length_literal_vs_param(db):
    g = db.select_graph("probe_varlen")
    g.query("CREATE (a:Node {id: 'A'}), (b:Node {id: 'B'}), (a)-[:ALERT_ARC]->(b)")
    
    # Literal bound works
    res = g.query("MATCH (a:Node {id: 'A'})-[:ALERT_ARC*1..3]->(b) RETURN b.id")
    assert res.result_set[0][0] == "B"
    
    # Parameter bound fails
    with pytest.raises(redis.exceptions.ResponseError):
        g.query("MATCH (a:Node {id: 'A'})-[:ALERT_ARC*1..$depth]->(b) RETURN b.id", {"depth": 3})
    
    g.delete()

def test_sm07_latency_gate_measurement(db):
    g = db.select_graph("jaal_world")
    # Quick 5-cycle validation of latency gate
    times = []
    for i in range(5):
        t0 = time.perf_counter()
        db.connection.execute_command("GRAPH.COPY", "jaal_world", f"probe_lat_{i}")
        db.select_graph(f"probe_lat_{i}").delete()
        times.append((time.perf_counter() - t0) * 1000.0)
    median_ms = sorted(times)[len(times) // 2]
    # Assert copy+delete takes < 1000ms per cycle (well under the 6590ms / 20min gate)
    assert median_ms < 1000.0

def test_sm08_world_immutability(db):
    g_world = db.select_graph("jaal_world")
    pre_nodes = g_world.query("MATCH (n) RETURN count(n)").result_set[0][0]
    pre_edges = g_world.query("MATCH ()-[r]->() RETURN count(r)").result_set[0][0]
    
    # Branch and mutate
    db.connection.execute_command("GRAPH.COPY", "jaal_world", "probe_mutation_branch")
    g_b = db.select_graph("probe_mutation_branch")
    g_b.query("MATCH ()-[r:ROAD_ARC]->() DELETE r")
    g_b.delete()
    
    post_nodes = g_world.query("MATCH (n) RETURN count(n)").result_set[0][0]
    post_edges = g_world.query("MATCH ()-[r]->() RETURN count(r)").result_set[0][0]
    
    assert pre_nodes == post_nodes
    assert pre_edges == post_edges
