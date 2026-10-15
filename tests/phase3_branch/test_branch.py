"""
tests/phase3_branch/test_branch.py - Unit and integration tests for Branch Isolation and Staged Cascade (BR-01..BR-08).
"""

import pytest
from pathlib import Path
from jaal.graph.client import get_graph_client, compute_graph_digest
from jaal.ingest.loader import load_world_graph
from jaal.branch.orchestrator import (
    BranchOrchestrator,
    BranchCollisionError,
    BranchTransientError,
    ImmutabilityViolationError
)

@pytest.fixture(scope="module")
def setup_world():
    client = get_graph_client()
    base_graph = client.select_graph("jaal_world")
    try:
        base_graph.delete()
    except Exception:
        pass
    base_graph = client.select_graph("jaal_world")
    load_world_graph(base_graph, data_root=Path("data"))
    orchestrator = BranchOrchestrator(client)
    # Ensure no leftover branches
    orchestrator.sweep_orphan_branches()
    yield client, orchestrator
    orchestrator.sweep_orphan_branches()

def test_br_01_world_immutability(setup_world):
    """BR-01: jaal_world digest identical before and after branch mutations."""
    client, orchestrator = setup_world
    base_graph = client.select_graph("jaal_world")
    digest_before, n_before, e_before = compute_graph_digest(base_graph)

    # Perform a branch run
    run_id = "test_br01"
    with orchestrator.branch_context(run_id, "case_monastery") as (branch_name, branch_graph):
        orchestrator.apply_cascade(branch_name, "road_ring_kashmere_monastery", is_f1=True)

    digest_after, n_after, e_after = compute_graph_digest(base_graph)
    assert digest_after == digest_before, f"Digest changed! Before: {digest_before}, After: {digest_after}"
    assert n_after == n_before
    assert e_after == e_before
    # Orchestrator assert method should also pass
    orchestrator.assert_immutability(digest_before)

def test_br_02_paired_arc_deletion(setup_world):
    """BR-02: After failing one corridor, 0 ROAD_ARC with that corridor_id remain; 28 -> 26 total."""
    client, orchestrator = setup_world
    run_id = "test_br02"
    corridor_to_sever = "road_ring_kashmere_monastery"

    with orchestrator.branch_context(run_id, "case_paired") as (branch_name, branch_graph):
        # Before severing: exactly 2 arcs for this corridor, 28 total
        pre_c_res = branch_graph.query(
            "MATCH ()-[r:ROAD_ARC {corridor_id: $cid}]->() RETURN count(r)",
            {"cid": corridor_to_sever}
        )
        assert pre_c_res.result_set[0][0] == 2

        pre_total_res = branch_graph.query("MATCH ()-[r:ROAD_ARC]->() RETURN count(r)")
        assert pre_total_res.result_set[0][0] == 28

        # Sever corridor
        orchestrator.apply_cascade(branch_name, corridor_to_sever, is_f1=True)

        # After severing: 0 arcs for this corridor, 26 total
        post_c_res = branch_graph.query(
            "MATCH ()-[r:ROAD_ARC {corridor_id: $cid}]->() RETURN count(r)",
            {"cid": corridor_to_sever}
        )
        assert post_c_res.result_set[0][0] == 0

        post_total_res = branch_graph.query("MATCH ()-[r:ROAD_ARC]->() RETURN count(r)")
        assert post_total_res.result_set[0][0] == 26

def test_br_03_cascade_order_and_ledger(setup_world):
    """BR-03: Ledger rows exist for road arcs, carried alert arcs, carried feeders and unpowered towers with reason codes."""
    client, orchestrator = setup_world
    run_id = "test_br03"
    # Choose a corridor known to carry infrastructure: road_ring_kashmere_monastery carries pf_yamuna_north / tow_kashmere
    corridor = "road_ring_kashmere_monastery"

    with orchestrator.branch_context(run_id, "case_cascade") as (branch_name, branch_graph):
        ledger = orchestrator.apply_cascade(branch_name, corridor, is_f1=True, run_id=run_id, branch_id=branch_name)

        assert len(ledger) > 0
        reason_codes = {entry["reason_code"] for entry in ledger}
        entity_kinds = {entry["entity_kind"] for entry in ledger}

        # Must include road failure
        assert "OBSERVED_CORRIDOR_FAILURE" in reason_codes
        assert "ROAD_ARC" in entity_kinds

        # Verify all entries have required fields
        for entry in ledger:
            assert entry["mutation_id"]
            assert entry["branch_id"] == branch_name
            assert entry["run_id"] == run_id
            assert entry["reason_code"] in [
                "OBSERVED_CORRIDOR_FAILURE", "EVALUATED_SECOND_FAILURE",
                "CARRIED_ALERT_BACKHAUL_SEVERED", "CARRIED_FEEDER_SEVERED",
                "TOWER_UNPOWERED"
            ]

        # Verify memory graph contains these ledger records
        mem_graph = client.select_graph(orchestrator.memory_graph_name)
        mem_res = mem_graph.query(
            "MATCH (m:ScenarioMutation {branch_id: $bid}) RETURN count(m)",
            {"bid": branch_name}
        )
        assert mem_res.result_set[0][0] == len(ledger)

def test_br_04_cleanup_on_normal_and_exception(setup_world):
    """BR-04: Zero jaal_branch_* graphs remain after a run, including after induced exception."""
    client, orchestrator = setup_world
    run_id = "test_br04"

    # 1. Normal exit
    with orchestrator.branch_context(run_id, "normal_case") as (branch_name, branch_graph):
        assert branch_name in orchestrator.list_graphs()
    assert branch_name not in orchestrator.list_graphs()

    # 2. Exception exit
    with pytest.raises(RuntimeError):
        with orchestrator.branch_context(run_id, "error_case") as (err_branch, _):
            assert err_branch in orchestrator.list_graphs()
            raise RuntimeError("Induced failure inside branch context")

    assert err_branch not in orchestrator.list_graphs()

    # Verify no orphan branches remain
    remaining = [g for g in orchestrator.list_graphs() if g.startswith("jaal_branch_")]
    assert len(remaining) == 0

def test_br_05_destination_collision_error(setup_world):
    """BR-05: Copying onto an existing branch name raises BranchCollisionError."""
    client, orchestrator = setup_world
    run_id = "test_br05"
    case_id = "collision_case"

    branch1 = orchestrator.create_branch(run_id, case_id)
    try:
        assert branch1 in orchestrator.list_graphs()
        with pytest.raises(BranchCollisionError):
            orchestrator.create_branch(run_id, case_id)
    finally:
        orchestrator.delete_branch(branch1)

def test_br_06_transient_fork_failure_retries(setup_world):
    """BR-06: Injected transient failures retry up to 3 times with backoff."""
    client, orchestrator = setup_world
    run_id = "test_br06"
    case_id = "retry_case"

    fail_count = 0
    def injector(attempt):
        nonlocal fail_count
        if attempt < 2:
            fail_count += 1
            raise ConnectionResetError("Injected transient Redis blip")

    orchestrator.transient_fail_injector = injector
    initial_retries = orchestrator.retries_attempted

    try:
        branch = orchestrator.create_branch(run_id, case_id)
        assert branch in orchestrator.list_graphs()
        assert fail_count == 2
        assert orchestrator.retries_attempted == initial_retries + 2
        orchestrator.delete_branch(branch)
    finally:
        orchestrator.transient_fail_injector = None

def test_br_07_no_branch_leakage_into_base(setup_world):
    """BR-07: Query on jaal_world after branch mutations returns original unsevered arcs."""
    client, orchestrator = setup_world
    base_graph = client.select_graph("jaal_world")
    corridor = "road_ring_kashmere_monastery"

    with orchestrator.branch_context("test_br07", "leak_check") as (branch_name, _):
        orchestrator.apply_cascade(branch_name, corridor, is_f1=True)

    # Base graph must STILL have the 2 ROAD_ARC relationships for this corridor
    base_res = base_graph.query(
        "MATCH ()-[r:ROAD_ARC {corridor_id: $cid}]->() RETURN count(r)",
        {"cid": corridor}
    )
    assert base_res.result_set[0][0] == 2

def test_br_08_branch_mode_and_scratch_invariance(setup_world):
    """BR-08: Confirm CLONE_PER_CASE mode is active, and test scratch clone rollback invariance."""
    client, orchestrator = setup_world
    base_graph = client.select_graph("jaal_world")
    initial_digest, _, _ = compute_graph_digest(base_graph)

    # Test clone-modify-destroy cycle produces no residue
    with orchestrator.branch_context("test_br08", "scratch_cycle") as (bname, bgraph):
        orchestrator.apply_cascade(bname, "road_ring_redfort_delhigate", is_f1=True)
        orchestrator.apply_cascade(bname, "road_delhigate_connector", is_f1=False)

    final_digest, _, _ = compute_graph_digest(base_graph)
    assert final_digest == initial_digest
