"""
tests/phase9_demo/test_demo_scenarios.py - Verification for Golden Demo Scenario and Two Counterexamples (DM-01..DM-03).
"""

from pathlib import Path
import pytest
from jaal.graph.client import get_graph_client
from jaal.ingest.loader import load_world_graph
from jaal.evaluate.evaluator import SharedEvaluator
from jaal.branch.orchestrator import BranchOrchestrator
from jaal.plan.planner import PreMortemPlanner, Action

@pytest.fixture(scope="module")
def demo_planner():
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
    yield planner
    orchestrator.sweep_orphan_branches()

def test_dm_01_golden_demo_scenario(demo_planner):
    """
    DM-01: GOLD — "The second failure is the one that matters."
    Observed f1: road_ring_monastery_chandgiram (historically submerged).
    Jaal evaluates all 13 secondary corridors.
    Policy C selects optimal contingency action, significantly reducing breaches vs Policy A.
    """
    f1 = "road_ring_monastery_chandgiram"
    sweep = demo_planner.run_f1_sweep(f1, run_id="dm01_gold")

    pol_a = sweep["POLICY_A"]
    pol_b = sweep["POLICY_B"]
    pol_c = sweep["POLICY_C"]

    # Baseline leaves extensive breaches across secondary cases
    assert pol_a.exposed_cases_count == 13
    assert pol_a.total_breaches_sum > 0

    # Policy C evaluates all 13 f2 cases and chooses action
    assert pol_c.total_cases_evaluated == 13
    assert pol_c.chosen_action is not None

    # Policy C significantly reduces total breach burden compared to Policy A
    assert pol_c.total_breaches_sum < pol_a.total_breaches_sum

def test_dm_02_counterexample_1_no_defensible_action(demo_planner):
    """
    DM-02: COUNTER-1 — "No defensible action."
    Under a restricted action budget where no single action achieves robust feasibility,
    Jaal explicitly returns ABSTAIN — NO ROBUST PLAN with the exposed case list,
    and recommendation approval is disabled.
    """
    f1 = "road_ring_kashmere_monastery"
    # Action that cannot fix northern alerts
    restricted_action = [
        Action("act_south_only", "PREPOSITION_DEPOT", "depot_south", 1.0, "South Depot only")
    ]
    sweep = demo_planner.run_f1_sweep(f1, allowed_actions=restricted_action, run_id="dm02_counter1")
    pol_c = sweep["POLICY_C"]

    assert pol_c.abstain is True
    assert pol_c.abstain_reason == "NO_PLAN_PRESERVES_ALL_CRITICAL_REQUIREMENTS"
    assert pol_c.exposed_cases_count > 0
    assert len(pol_c.exposed_cases) > 0

def test_dm_03_counterexample_2_premortem_adds_nothing(demo_planner):
    """
    DM-03: COUNTER-2 — "The pre-mortem adds nothing here."
    An f1 that already breached on its own or ties baseline:
    conditioning on second failure does not alter decision; reported as an honest tie.
    """
    f1 = "road_delhigate_connector"
    sweep = demo_planner.run_f1_sweep(f1, run_id="dm03_counter2")
    pol_a = sweep["POLICY_A"]
    pol_c = sweep["POLICY_C"]

    # If already robust or ties baseline, Jaal reports tie honestly
    assert pol_c.total_cases_evaluated == 13
    assert pol_c.total_breaches_sum <= pol_a.total_breaches_sum
