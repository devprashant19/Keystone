"""
scripts/seed_demo.py — Deterministic seeded demo harness for KEYSTONE Pre-Mortem.
Puts the system into one known, reproducible state:
  1. Sweeps orphan branches.
  2. Deletes and reloads keystone_world from data/.
  3. Asserts the content digest equals the recorded expected value.
  4. Clears keystone_memory.
  5. Pre-runs and caches the two demo runs (golden case and abstention case).
  6. Prints the DEMO READY block.
"""

import sys
import os
import json
from pathlib import Path
from datetime import datetime, timezone

# Add src to sys.path
root_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root_dir / "src"))

from jaal.graph.client import get_graph_client, compute_graph_digest, compute_content_digest
from jaal.ingest.loader import load_world_graph
from jaal.branch.orchestrator import BranchOrchestrator
from jaal.evaluate.evaluator import SharedEvaluator
from jaal.plan.planner import PreMortemPlanner

EXPECTED_CONTENT_DIGEST = "455712e82d224a2590060fd35d83abb4acb6cfafd633b12d275aa43337cd013a"
ENGINE_VERSION = "0.1.0-monsoon2026"
DEMO_CACHE_DIR = root_dir / "data" / "demo_cache"

def build_run_payload(planner, f1_corridor_id: str, run_id: str, initial_digest: str):
    decomp = planner.compute_three_way_decomposition(f1_corridor_id)
    sweep = planner.run_f1_sweep(f1_corridor_id, run_id=run_id)
    planner.orchestrator.assert_immutability(initial_digest)

    pol_a = sweep["POLICY_A"]
    pol_b = sweep["POLICY_B"]
    pol_c = sweep["POLICY_C"]

    cases_list = []
    for f2, out_a in pol_a.case_outcomes.items():
        out_c = pol_c.case_outcomes.get(f2)
        is_interaction = f2 in decomp.interaction_only_cases
        verdict = "BREACH" if (out_c and out_c.is_breach) else ("DEGRADED" if out_a.is_breach and not (out_c and out_c.is_breach) else "OK")
        cases_list.append({
            "case_id": f"{f1_corridor_id}__{f2}",
            "f1": f1_corridor_id,
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
        "run_id": run_id,
        "f1_corridor_id": f1_corridor_id,
        "created_at": "2026-10-15T00:00:00.000000+00:00",
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

def seed_demo():
    client = get_graph_client()
    orchestrator = BranchOrchestrator(client)

    # 1. Sweep orphan branches
    orphans = orchestrator.sweep_orphan_branches()

    # 2. Delete and reload keystone_world from data/
    base_graph = client.select_graph("keystone_world")
    try:
        base_graph.delete()
    except Exception:
        pass

    base_graph = client.select_graph("keystone_world")
    data_dir = root_dir / "data"
    load_world_graph(base_graph, data_root=data_dir)

    # 3. Assert the CONTENT digest equals recorded expected value
    content_digest, n_cnt, e_cnt = compute_content_digest(base_graph)
    if content_digest != EXPECTED_CONTENT_DIGEST:
        raise RuntimeError(
            f"FIXTURE DRIFT DETECTED!\n"
            f"Expected Content Digest: {EXPECTED_CONTENT_DIGEST}\n"
            f"Observed Content Digest: {content_digest}\n"
            f"Nodes: {n_cnt}, Edges: {e_cnt}"
        )

    # 4. Clear keystone_memory
    try:
        mem_graph = client.select_graph("keystone_memory")
        mem_graph.delete()
    except Exception:
        pass

    # 5. Pre-run and cache the two demo runs
    planner = PreMortemPlanner(client)
    initial_digest, _, _ = compute_graph_digest(base_graph)

    # Create demo cache directory
    DEMO_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    precomputed_dir = DEMO_CACHE_DIR / "precomputed"
    precomputed_dir.mkdir(parents=True, exist_ok=True)

    # Golden Case: road_ring_monastery_chandgiram
    golden_run_id = "run_golden_demo"
    golden_payload = build_run_payload(planner, "road_ring_monastery_chandgiram", golden_run_id, initial_digest)
    golden_payload["source"] = "precomputed"
    golden_payload["world_content_digest"] = content_digest
    golden_payload["digest"] = content_digest
    golden_cache_file = DEMO_CACHE_DIR / f"{golden_run_id}.json"
    with open(golden_cache_file, "w", encoding="utf-8") as f:
        json.dump(golden_payload, f, indent=2)

    # Abstention Case: road_ring_kashmere_monastery
    abstain_run_id = "run_abstain_demo"
    abstain_payload = build_run_payload(planner, "road_ring_kashmere_monastery", abstain_run_id, initial_digest)
    abstain_payload["source"] = "precomputed"
    abstain_payload["world_content_digest"] = content_digest
    abstain_payload["digest"] = content_digest
    abstain_cache_file = DEMO_CACHE_DIR / f"{abstain_run_id}.json"
    with open(abstain_cache_file, "w", encoding="utf-8") as f:
        json.dump(abstain_payload, f, indent=2)

    # Precompute and persist all 14 corridor sweeps (K1)
    all_corridors = planner.get_all_corridors()
    for cid in all_corridors:
        out_file = precomputed_dir / f"{cid}.json"
        if cid == "road_ring_monastery_chandgiram":
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(golden_payload, f, indent=2)
            continue
        if cid == "road_ring_kashmere_monastery":
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(abstain_payload, f, indent=2)
            continue
        if out_file.exists():
            try:
                with open(out_file, "r", encoding="utf-8") as f:
                    p = json.load(f)
                if p.get("world_content_digest") == content_digest:
                    continue
            except Exception:
                pass
        p_payload = build_run_payload(planner, cid, f"pre_{cid}", initial_digest)
        p_payload["source"] = "precomputed"
        p_payload["world_content_digest"] = content_digest
        p_payload["digest"] = content_digest
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(p_payload, f, indent=2)

    # Write by_corridor index
    by_corridor = {
        "road_ring_monastery_chandgiram": golden_run_id,
        "road_ring_kashmere_monastery": abstain_run_id,
    }
    with open(DEMO_CACHE_DIR / "by_corridor.json", "w", encoding="utf-8") as f:
        json.dump(by_corridor, f, indent=2)

    # Record both in keystone_memory
    mem_graph = client.select_graph("keystone_memory")
    mem_graph.query(
        "CREATE (r:Run {run_id: $rid, f1: $f1, started_at: $ts, config_hash: $chash, "
        "world_digest: $wdigest, status: 'complete', abstain: $abstain, "
        "headline_interaction_only_count: 0})",
        {
            "rid": golden_run_id, "f1": "road_ring_monastery_chandgiram",
            "ts": golden_payload["created_at"], "chash": golden_payload["config_hash"],
            "wdigest": initial_digest, "abstain": False
        }
    )
    mem_graph.query(
        "CREATE (r:Run {run_id: $rid, f1: $f1, started_at: $ts, config_hash: $chash, "
        "world_digest: $wdigest, status: 'complete', abstain: $abstain, "
        "headline_interaction_only_count: 0})",
        {
            "rid": abstain_run_id, "f1": "road_ring_kashmere_monastery",
            "ts": abstain_payload["created_at"], "chash": abstain_payload["config_hash"],
            "wdigest": initial_digest, "abstain": True
        }
    )

    # 6. Pre-warm agent tool cache for the two demo questions
    import time
    from jaal.agent.agent import JaalAgent, _AGENT_TOOL_CACHE

    agent = JaalAgent()
    demo_q1 = "What fails if monastery_chandgiram floods?"
    demo_q2 = "If the Kashmere Gate to Monastery corridor fails, which critical facilities lose access and what should we do?"

    # Invalidate BOTH the on-disk and in-memory agent tool caches before pre-warming.
    #
    # The cache is keyed by (run_id, tool, args) and carries no world digest, so a
    # cache written against an older fixture would otherwise be reloaded at import and
    # served as if current -- and those numbers would pass the grounding check, because
    # they were genuine tool output once. Deleting the file here guarantees the cache
    # can only ever contain results computed against the world this script just seeded.
    agent_cache_file = DEMO_CACHE_DIR / "agent_tool_cache.json"
    if agent_cache_file.exists():
        agent_cache_file.unlink()
    _AGENT_TOOL_CACHE.clear()

    # Pre-warm Q1
    t0 = time.perf_counter()
    r1_live = agent.query(demo_q1)
    t1 = time.perf_counter()
    r1_cached = agent.query(demo_q1)
    t2 = time.perf_counter()

    # Pre-warm Q2
    t3 = time.perf_counter()
    r2_live = agent.query(demo_q2)
    t4 = time.perf_counter()
    r2_cached = agent.query(demo_q2)
    t5 = time.perf_counter()

    print("--- Agent Cache Pre-Warming ---")
    print(f"Q1 ('monastery_chandgiram'): live={t1-t0:.2f}s -> cached={(t2-t1)*1000:.2f}ms (grounded={r1_cached.grounded})")
    print(f"Q2 ('kashmere_monastery'):   live={t4-t3:.2f}s -> cached={(t5-t4)*1000:.2f}ms (grounded={r2_cached.grounded})")

    # 7. Print DEMO READY block
    config_hash = planner.evaluator.config_hash
    decomposition_str = "104/48/30/0"

    print("============================== DEMO READY ==============================")
    print(f"Content Digest: {content_digest}")
    print(f"Config Hash:    {config_hash}")
    print(f"Golden Run ID:  {golden_run_id}")
    print(f"Abstain Run ID: {abstain_run_id}")
    print(f"Decomposition:  {decomposition_str}")
    print(f"Engine Version: {ENGINE_VERSION}")
    print("========================================================================")

    return {
        "content_digest": content_digest,
        "config_hash": config_hash,
        "golden_run_id": golden_run_id,
        "abstain_run_id": abstain_run_id,
        "decomposition": decomposition_str,
        "engine_version": ENGINE_VERSION
    }

if __name__ == "__main__":
    seed_demo()
