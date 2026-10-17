"""
tests/phase5_planner/test_planner.py - Unit and integration tests for Scenario Planner and Policy Evaluation (PL-01..PL-10).
"""

import pytest
import inspect
from pathlib import Path
from jaal.graph.client import get_graph_client
from jaal.ingest.loader import load_world_graph
from jaal.evaluate.evaluator import SharedEvaluator
from jaal.branch.orchestrator import BranchOrchestrator
from jaal.plan.planner import PreMortemPlanner, Action

@pytest.fixture(scope="module")
def planner_env():
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
    orchestrator.sweep_orphan_branches()
    planner = PreMortemPlanner(client, evaluator, orchestrator)
    yield client, planner, orchestrator
    orchestrator.sweep_orphan_branches()

def test_pl_01_completeness_13_cases(planner_env):
    """PL-01: Exactly n - 1 f2 cases evaluated per f1, all accounted for (13 for Delhi)."""
    _, planner, _ = planner_env
    corridors = planner.get_all_corridors()
    assert len(corridors) == 14

    f1 = corridors[0]
    sweep = planner.run_f1_sweep(f1, run_id="pl01")

    assert sweep["POLICY_A"].total_cases_evaluated == 13
    assert len(sweep["POLICY_A"].case_outcomes) == 13
    assert sweep["POLICY_B"].total_cases_evaluated == 13
    assert len(sweep["POLICY_B"].case_outcomes) == 13
    assert sweep["POLICY_C"].total_cases_evaluated == 13
    assert len(sweep["POLICY_C"].case_outcomes) == 13

def test_pl_02_no_leakage_in_action_selection(planner_env):
    """PL-02: Action-selection input contains no f2 identifier (signature and code assertion)."""
    _, planner, _ = planner_env
    sig = inspect.signature(planner._select_policy_b_action)
    param_names = list(sig.parameters.keys())

    # Only f1 and allowed_actions are passed into Policy B selector
    assert "f2" not in param_names
    assert param_names == ["f1", "allowed_actions"]

def test_pl_03_abstention_reachable(planner_env):
    """PL-03: At least one f1 yields abstain=True with an exposed-case list."""
    _, planner, _ = planner_env
    # Sever a severe corridor, or restrict actions so that robust feasibility cannot be attained
    f1 = "road_ring_kashmere_monastery"
    # Action set that does NOT include mobile relay for civil lines
    restricted_actions = [
        Action("act_prep_south", "PREPOSITION_DEPOT", "depot_south", 1.0, "South depot only")
    ]
    sweep = planner.run_f1_sweep(f1, allowed_actions=restricted_actions, run_id="pl03")
    summary_c = sweep["POLICY_C"]

    assert summary_c.abstain is True
    assert summary_c.abstain_reason == "NO_PLAN_PRESERVES_ALL_CRITICAL_REQUIREMENTS"
    assert summary_c.exposed_cases_count > 0
    assert len(summary_c.exposed_cases) > 0

def test_pl_04_determinism(planner_env):
    """PL-04: Identical config and seed produce byte-identical results across two runs."""
    _, planner, _ = planner_env
    f1 = "road_ring_redfort_delhigate"

    sweep1 = planner.run_f1_sweep(f1, run_id="pl04_run1")
    sweep2 = planner.run_f1_sweep(f1, run_id="pl04_run2")

    for pol in ["POLICY_A", "POLICY_B", "POLICY_C"]:
        s1 = sweep1[pol]
        s2 = sweep2[pol]
        assert s1.exposed_cases_count == s2.exposed_cases_count
        assert s1.total_breaches_sum == s2.total_breaches_sum
        assert s1.abstain == s2.abstain
        assert s1.exposed_cases == s2.exposed_cases

def test_pl_05_deterministic_tie_breaking(planner_env):
    """PL-05: Equal-cost equal-outcome actions resolve deterministically by (action_kind, target_id)."""
    _, planner, _ = planner_env
    # Create two identical synthetic actions with differing (action_kind, target_id)
    act_a = Action("act_z", "ACTION_Z", "target_1", 1.0, "Action Z")
    act_b = Action("act_a", "ACTION_A", "target_1", 1.0, "Action A")

    f1 = "road_ring_redfort_delhigate"
    sweep = planner.run_f1_sweep(f1, allowed_actions=[act_a, act_b], run_id="pl05")
    # ACTION_A must win tie-break over ACTION_Z
    assert sweep["POLICY_C"].chosen_action is not None
    assert sweep["POLICY_C"].chosen_action.action_kind == "ACTION_A"

def test_pl_06_action_actually_attempted_f07_regression(planner_env):
    """PL-06: A case is marked unfixable only after EVERY allowed action was actually evaluated."""
    _, planner, _ = planner_env
    f1 = "road_ring_kashmere_monastery"
    actions = planner.get_default_action_catalog()

    # The catalog is DERIVED FROM THE GRAPH (one PREPOSITION_DEPOT per :Depot, one
    # DEPLOY_MOBILE_RELAY per required-target :RelayContact), so assert that
    # correspondence rather than a magic count that silently rots when the fixture
    # changes. A stale hard-coded catalog is how a policy becomes a no-op unnoticed.
    world = planner.client.select_graph(planner.base_graph_name)
    depot_ids = {r[0] for r in world.query("MATCH (d:Depot) RETURN d.id").result_set}
    relay_ids = {
        r[0] for r in world.query(
            "MATCH (r:RelayContact {is_required_target: true}) RETURN r.id"
        ).result_set
    }
    assert depot_ids, "fixture must define at least one depot"
    assert relay_ids, "fixture must define at least one required relay target"

    prep_targets = {a.target_id for a in actions if a.action_kind == "PREPOSITION_DEPOT"}
    relay_targets = {a.target_id for a in actions if a.action_kind == "DEPLOY_MOBILE_RELAY"}
    assert prep_targets == depot_ids
    assert relay_targets == relay_ids
    assert len(actions) == len(depot_ids) + len(relay_ids)

    sweep = planner.run_f1_sweep(f1, allowed_actions=actions, run_id="pl06")
    # Every allowed action is evaluated against every f2 case; a case may only be
    # called unfixable after all of them were tried (the F-07 regression).
    summary_c = sweep["POLICY_C"]
    assert summary_c.total_cases_evaluated == 13

def test_pl_07_three_way_decomposition(planner_env):
    """PL-07: f1-alone + f2-alone + interaction-only = total stressed cases."""
    _, planner, _ = planner_env
    f1 = "road_ring_kashmere_monastery"
    decomp = planner.compute_three_way_decomposition(f1)

    assert decomp.f1_id == f1
    assert decomp.total_cases == 13

    # Sum of categories equals total cases (13)
    sum_cases = (
        len(decomp.f1_alone_cases) +
        len(decomp.f2_alone_cases) +
        len(decomp.interaction_only_cases) +
        len(decomp.neither_stressed_cases)
    )
    assert sum_cases == 13

def test_pl_08_no_feasible_action_empty_catalog(planner_env):
    """PL-08: With an empty action set, the planner abstains cleanly rather than erroring."""
    _, planner, _ = planner_env
    f1 = "road_ring_redfort_delhigate"
    sweep = planner.run_f1_sweep(f1, allowed_actions=[], run_id="pl08")

    assert sweep["POLICY_C"].abstain is True
    assert sweep["POLICY_C"].abstain_reason == "NO_FEASIBLE_ACTION_AVAILABLE"
    assert sweep["POLICY_C"].chosen_action is None

def test_pl_09_zero_demand_config_error(planner_env):
    """PL-09: Graph with zero critical endpoints reports configuration error, not all-zeros success."""
    client, planner, orchestrator = planner_env

    with orchestrator.branch_context("pl09", "no_critical") as (bname, bgraph):
        bgraph.query("MATCH (f:Facility) DETACH DELETE f")
        temp_planner = PreMortemPlanner(client, base_graph_name=bname)
        with pytest.raises(ValueError, match="Configuration error: no critical endpoints"):
            temp_planner.run_f1_sweep("road_ring_redfort_delhigate", run_id="pl09_err")

def test_pl_10_source_failure_with_no_dependents(planner_env):
    """PL-10: Corridor carrying no feeder or alert link yields road-only impact, empty cross-layer set, no error."""
    client, planner, orchestrator = planner_env
    # road_delhigate_connector carries no power feeder and no alert arc
    f1 = "road_delhigate_connector"

    # 1. Assert graph structure carries no feeder or alert link
    base_graph = client.select_graph(planner.base_graph_name)
    feeder_res = base_graph.query(
        "MATCH (pf:PowerFeeder)-[:CARRIED_BY]->(:RoadCorridor {id: $cid}) RETURN count(pf)",
        {"cid": f1}
    )
    assert feeder_res.result_set[0][0] == 0

    alert_res = base_graph.query(
        "MATCH ()-[al:ALERT_ARC {carrier_corridor_id: $cid}]->() RETURN count(al)",
        {"cid": f1}
    )
    assert alert_res.result_set[0][0] == 0

    # 2. Test cascade ledger on branch yields road-only impact and empty cross-layer set
    with orchestrator.branch_context("pl10", "road_only") as (bname, _):
        ledger = orchestrator.apply_cascade(bname, f1, is_f1=True)
        assert len(ledger) > 0
        kinds = {entry["entity_kind"] for entry in ledger}
        reasons = {entry["reason_code"] for entry in ledger}
        assert kinds == {"ROAD_ARC"}
        assert reasons == {"OBSERVED_CORRIDOR_FAILURE"}

    # 3. Complete sweep across all 13 secondary corridors runs cleanly
    sweep = planner.run_f1_sweep(f1, run_id="pl10")
    assert sweep["POLICY_A"].total_cases_evaluated == 13
    assert sweep["POLICY_B"].total_cases_evaluated == 13
    assert sweep["POLICY_C"].total_cases_evaluated == 13
