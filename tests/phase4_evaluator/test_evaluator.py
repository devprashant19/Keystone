"""
tests/phase4_evaluator/test_evaluator.py - Acceptance tests for the Shared Evaluator (EV-01..EV-06).
"""

import pytest
from pathlib import Path
from jaal.graph.client import get_graph_client
from jaal.ingest.loader import load_world_graph
from jaal.evaluate.evaluator import SharedEvaluator, EvaluationResult
from jaal.branch.orchestrator import BranchOrchestrator

@pytest.fixture(scope="module")
def env():
    client = get_graph_client()
    base_graph = client.select_graph("keystone_world")
    try:
        base_graph.delete()
    except Exception:
        pass
    base_graph = client.select_graph("keystone_world")
    load_world_graph(base_graph, data_root=Path("data"))
    evaluator = SharedEvaluator()
    orchestrator = BranchOrchestrator(client)
    yield client, base_graph, evaluator, orchestrator
    orchestrator.sweep_orphan_branches()

def test_ev_01_hand_computed_case(env):
    """EV-01: Access distance equals hand arithmetic over the printed arc costs."""
    client, base_graph, evaluator, orchestrator = env

    # Inspect road between int_delhi_gate and hosp_lnjp
    # hosp_lnjp snaps to int_delhi_gate with offset 0.5 km.
    # depot_south is at int_delhi_gate with 3.0 min dispatch delay.
    # From depot_south to hosp_lnjp:
    # road distance = 0 km (same intersection)
    # road travel time = 0 min
    # offset distance = 0.5 km
    # offset time = (0.5 / 24.0) * 60 = 1.25 min
    # total response time from depot_south = 3.0 + 0.0 + 1.25 = 4.25 min.
    res = evaluator.evaluate_graph(base_graph, "baseline")
    lnjp_metric = res.facility_metrics.get("hosp_lnjp")
    assert lnjp_metric is not None

    # Check breakdown for depot_south
    south_breakdown = lnjp_metric.depot_breakdown.get("depot_south")
    assert south_breakdown is not None
    assert south_breakdown["road_time_min"] == 0.0
    assert south_breakdown["road_dist_km"] == 0.0
    assert pytest.approx(south_breakdown["offset_time_min"], 0.001) == 1.25
    assert pytest.approx(south_breakdown["total_time_min"], 0.001) == 4.25
    assert pytest.approx(lnjp_metric.total_response_time_min, 0.001) == 4.25

def test_ev_02_min_across_depots(env):
    """EV-02: Result equals minimum of the per-depot values, not the first depot's."""
    client, base_graph, evaluator, orchestrator = env
    res = evaluator.evaluate_graph(base_graph, "baseline")

    for fid, metric in res.facility_metrics.items():
        if metric.unreachable:
            continue
        # Collect total times across all depots that could reach it
        all_depot_totals = [
            b["total_time_min"] for b in metric.depot_breakdown.values()
            if not b.get("unreachable")
        ]
        assert len(all_depot_totals) > 0
        min_total = min(all_depot_totals)
        assert pytest.approx(metric.total_response_time_min, 0.001) == min_total
        # Verify best depot actually achieved that minimum
        best_d = metric.best_depot_id
        assert pytest.approx(metric.depot_breakdown[best_d]["total_time_min"], 0.001) == min_total

def test_ev_03_unreachable_handling(env):
    """EV-03: A disconnected facility yields unreachable=True, total_response_time_min=None, not a large finite number."""
    client, base_graph, evaluator, orchestrator = env

    with orchestrator.branch_context("ev03", "isolate_facility") as (bname, bgraph):
        # Sever all arcs entering int_civil_lines (where hosp_sushruta is attached)
        bgraph.query(
            "MATCH (a)-[r:ROAD_ARC]->(b:Intersection {id: 'int_civil_lines'}) DELETE r"
        )
        bgraph.query(
            "MATCH (b:Intersection {id: 'int_civil_lines'})-[r:ROAD_ARC]->(a) DELETE r"
        )
        # Also remove depot_north which is stationed at int_civil_lines
        bgraph.query("MATCH (d:Depot {id: 'depot_north'}) DETACH DELETE d")

        res = evaluator.evaluate_graph(bgraph, "disconnected_test")
        sushruta_metric = res.facility_metrics["hosp_sushruta"]

        assert sushruta_metric.unreachable is True
        assert sushruta_metric.total_response_time_min is None
        assert sushruta_metric.best_road_time_min is None
        assert sushruta_metric.is_breach is True
        assert "hosp_sushruta" in res.unreachable_facilities
        assert "hosp_sushruta" in res.access_breaches

def test_ev_04_breach_vs_degraded_exclusivity(env):
    """EV-04: Breach vs degraded exclusivity: no case is both; degraded requires strictly worse cost and no missed deadline."""
    client, base_graph, evaluator, orchestrator = env

    # Establish baseline
    base_res = evaluator.evaluate_graph(base_graph, "baseline")
    baselines = {fid: m.total_response_time_min for fid, m in base_res.facility_metrics.items()}

    # Evaluate a disrupted branch
    with orchestrator.branch_context("ev04", "disrupted") as (bname, bgraph):
        orchestrator.apply_cascade(bname, "road_ring_monastery_chandgiram", is_f1=True)
        res = evaluator.evaluate_graph(bgraph, "cascade_test", baseline_response_times=baselines)

        for fid, metric in res.facility_metrics.items():
            # Invariant: can never be both breach and degraded
            assert not (metric.is_breach and metric.is_degraded), f"{fid} is both breach and degraded!"
            if metric.is_degraded:
                assert not metric.is_breach
                assert metric.total_response_time_min <= evaluator.access_deadline_min
                assert metric.total_response_time_min > baselines[fid]

def test_ev_05_shared_evaluator_identical_call(env):
    """EV-05: All policies use the identical evaluator instance and return identical results on identical state."""
    client, base_graph, evaluator, orchestrator = env

    res1 = evaluator.evaluate_graph(base_graph, "run1")
    res2 = evaluator.evaluate_graph(base_graph, "run2")

    assert res1.access_breaches == res2.access_breaches
    assert res1.alert_breaches == res2.alert_breaches
    assert res1.total_breaches == res2.total_breaches
    for fid in res1.facility_metrics:
        m1 = res1.facility_metrics[fid]
        m2 = res2.facility_metrics[fid]
        assert m1.total_response_time_min == m2.total_response_time_min
        assert m1.is_breach == m2.is_breach

def test_ev_06_alert_latency_and_hops(env):
    """EV-06: Per-hop latency sum equals reported latency, and hop count <= config bound."""
    client, base_graph, evaluator, orchestrator = env
    res = evaluator.evaluate_graph(base_graph, "baseline_alert")

    for rid, metric in res.alert_metrics.items():
        if metric.unreachable:
            continue
        assert metric.hops <= evaluator.alert_hop_bound
        # Re-check path sum
        path = metric.path
        assert len(path) == metric.hops + 1
        
        # Calculate latency along edges in path
        path_latency = 0.0
        for i in range(len(path) - 1):
            src, dst = path[i], path[i+1]
            edge_res = base_graph.query(
                "MATCH (a {id: $s})-[r:ALERT_ARC]->(b {id: $d}) RETURN r.latency_min",
                {"s": src, "d": dst}
            )
            assert len(edge_res.result_set) > 0
            path_latency += float(edge_res.result_set[0][0])
            
        assert pytest.approx(metric.latency_min, 0.001) == path_latency
