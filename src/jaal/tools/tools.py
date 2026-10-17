"""
jaal.tools.tools - Four typed tools with strict validation and security constraints.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from jaal.graph.client import get_graph_client
from jaal.plan.planner import PreMortemPlanner, Action

# Known allowed corridor IDs in the Delhi topology
ALLOWED_CORRIDORS = {
    "road_barakhamba_cp_mandihouse",
    "road_chelmsford_cp_station",
    "road_delhigate_connector",
    "road_jln_marg_delhigate_cp",
    "road_rani_jhansi_hindurao_cp",
    "road_rani_jhansi_to_station",
    "road_ridge_sushruta_hindurao",
    "road_ring_delhigate_ito",
    "road_ring_kashmere_monastery",
    "road_ring_kashmere_redfort",
    "road_ring_monastery_chandgiram",
    "road_ring_redfort_delhigate",
    "road_sham_nath_sushruta_kashmere",
    "road_vikas_marg_ito",
}

def sanitize_output(text: str) -> str:
    """AG-05: Removes sensitive tokens, redis passwords, and absolute host paths."""
    # Redact host paths e.g. E:\... or C:\... or /home/...
    text = re.sub(r"[a-zA-Z]:\\[^\s\"'>]+", "[REDACTED_PATH]", text)
    text = re.sub(r"/(?:Users|home)/[^\s\"'>]+", "[REDACTED_PATH]", text)
    # Redact password params or tokens
    text = re.sub(r"password=[^\s&]+", "password=[REDACTED]", text)
    text = re.sub(r"redis://:[^@]+@", "redis://:[REDACTED]@", text)
    return text

# Tool 1: get_corridor_inventory
class GetCorridorInventoryInput(BaseModel):
    model_config = {"extra": "forbid"}
    filter_status: Optional[str] = Field(None, description="Optional status filter")

def get_corridor_inventory(args: GetCorridorInventoryInput) -> Dict[str, Any]:
    client = get_graph_client()
    world = client.select_graph("keystone_world")
    res = world.query(
        "MATCH (a:Intersection)-[r:ROAD_ARC]->(b:Intersection) "
        "RETURN DISTINCT r.corridor_id AS cid, r.name AS name, r.length_km AS len, r.status AS status "
        "ORDER BY cid ASC"
    )
    items = []
    for row in res.result_set:
        cid, name, length_km, status = row[0], row[1], float(row[2]), row[3]
        if args.filter_status and status != args.filter_status:
            continue
        items.append({
            "corridor_id": cid,
            "name": name,
            "length_km": length_km,
            "status": status,
            "data_origin": "reference_derived"
        })

    # AG-04: Result cap (max 50)
    MAX_CAP = 50
    is_truncated = len(items) > MAX_CAP
    return {
        "corridors": items[:MAX_CAP],
        "total_count": len(items),
        "is_truncated": is_truncated
    }

# Tool 2: evaluate_contingency
class EvaluateContingencyInput(BaseModel):
    model_config = {"extra": "forbid"}
    f1_corridor_id: str = Field(..., description="Observed primary corridor failure ID")
    action_id: Optional[str] = Field(None, description="Optional candidate action ID to test")

def evaluate_contingency(args: EvaluateContingencyInput) -> Dict[str, Any]:
    # AG-03: Identifier allowlist
    if args.f1_corridor_id not in ALLOWED_CORRIDORS:
        raise ValueError(f"Corridor '{args.f1_corridor_id}' is outside the allowed corridor identifier allowlist")

    client = get_graph_client()
    planner = PreMortemPlanner(client)
    allowed_actions = None
    if args.action_id:
        catalog = planner.get_default_action_catalog()
        allowed_actions = [a for a in catalog if a.action_id == args.action_id]
        if not allowed_actions:
            raise ValueError(f"Action '{args.action_id}' not found in action catalog")

    sweep = planner.run_f1_sweep(args.f1_corridor_id, allowed_actions=allowed_actions)
    decomp = planner.compute_three_way_decomposition(args.f1_corridor_id)

    pol_c = sweep["POLICY_C"]
    return {
        "f1_corridor_id": args.f1_corridor_id,
        "three_way_decomposition": {
            "f1_alone_cases": decomp.f1_alone_cases,
            "f2_alone_cases": decomp.f2_alone_cases,
            "interaction_only_cases": decomp.interaction_only_cases,
            "neither_stressed_cases": decomp.neither_stressed_cases,
            "interaction_only_count": len(decomp.interaction_only_cases),
            "total_cases": decomp.total_cases
        },
        "policy_c_recommendation": {
            "abstain": pol_c.abstain,
            "abstain_reason": pol_c.abstain_reason,
            "chosen_action": pol_c.chosen_action.__dict__ if pol_c.chosen_action else None,
            "exposed_cases_count": pol_c.exposed_cases_count,
            "exposed_cases": pol_c.exposed_cases,
            "total_breaches_sum": pol_c.total_breaches_sum
        }
    }

# Tool 3: get_case_evidence
class GetCaseEvidenceInput(BaseModel):
    model_config = {"extra": "forbid"}
    f1_corridor_id: str = Field(..., description="Primary corridor failure ID")
    f2_corridor_id: str = Field(..., description="Evaluated secondary corridor failure ID")

def get_case_evidence(args: GetCaseEvidenceInput) -> Dict[str, Any]:
    # AG-03: Allowlist checks
    if args.f1_corridor_id not in ALLOWED_CORRIDORS:
        raise ValueError(f"f1 corridor '{args.f1_corridor_id}' is outside the allowlist")
    if args.f2_corridor_id not in ALLOWED_CORRIDORS:
        raise ValueError(f"f2 corridor '{args.f2_corridor_id}' is outside the allowlist")

    client = get_graph_client()
    planner = PreMortemPlanner(client)

    # Reconstruct branch and capture evidence
    with planner.orchestrator.branch_context("evidence", f"{args.f1_corridor_id}_{args.f2_corridor_id}") as (bname, bgraph):
        ledger_f1 = planner.orchestrator.apply_cascade(bname, args.f1_corridor_id, is_f1=True)
        ledger_f2 = planner.orchestrator.apply_cascade(bname, args.f2_corridor_id, is_f1=False)
        res = planner.evaluator.evaluate_graph(bgraph, f"case_{args.f1_corridor_id}_{args.f2_corridor_id}")

        mutation_ledger = ledger_f1 + ledger_f2

    facility_evidence = {}
    for fid, m in res.facility_metrics.items():
        facility_evidence[fid] = {
            "facility_name": m.facility_name,
            "best_depot_id": m.best_depot_id,
            "best_road_time_min": m.best_road_time_min,
            "best_road_distance_km": m.best_road_distance_km,
            "access_offset_km": m.access_offset_km,
            "total_response_time_min": m.total_response_time_min,
            "route_nodes": m.route_nodes,
            "is_breach": m.is_breach,
            "is_degraded": m.is_degraded,
            "unreachable": m.unreachable,
            "depot_breakdown": m.depot_breakdown
        }

    alert_evidence = {}
    for rid, a in res.alert_metrics.items():
        alert_evidence[rid] = {
            "source_tower_id": a.source_tower_id,
            "latency_min": a.latency_min,
            "hops": a.hops,
            "path": a.path,
            "is_breach": a.is_breach,
            "unreachable": a.unreachable
        }

    return {
        "case_id": f"{args.f1_corridor_id}__{args.f2_corridor_id}",
        "mutation_ledger": mutation_ledger,
        "facility_evidence": facility_evidence,
        "alert_evidence": alert_evidence,
        "is_breached": res.is_breached,
        "total_breaches": res.total_breaches
    }

# Tool 4: record_commander_decision
class RecordCommanderDecisionInput(BaseModel):
    model_config = {"extra": "forbid"}
    run_id: str = Field(..., min_length=3, description="Run ID associated with the evaluation")
    verdict: str = Field(..., pattern="^(APPROVE|REJECT)$", description="Commander verdict: APPROVE or REJECT")
    action_kind: Optional[str] = Field(None, description="Action kind being approved")
    action_target: Optional[str] = Field(None, description="Action target ID")
    rationale: str = Field(..., min_length=10, description="Commander justification (minimum 10 characters)")
    actor: str = Field(..., min_length=2, description="Commander name or identifier")

def record_commander_decision(args: RecordCommanderDecisionInput) -> Dict[str, Any]:
    # AG-06: Write gating - strictly requires valid verdict and non-trivial rationale
    if args.verdict not in ("APPROVE", "REJECT"):
        raise ValueError("Invalid verdict: must be APPROVE or REJECT")
    if len(args.rationale.strip()) < 10:
        raise ValueError("Rationale must be at least 10 non-whitespace characters")

    client = get_graph_client()
    mem_graph = client.select_graph("keystone_memory")
    decision_id = f"dec_{uuid.uuid4().hex[:12]}"
    now_ts = datetime.now(timezone.utc).isoformat()

    mem_graph.query(
        "CREATE (d:Decision {decision_id: $did, run_id: $rid, verdict: $verd, "
        "action_kind: $akind, action_target: $atarget, rationale: $rat, actor: $actor, at: $at})",
        {
            "did": decision_id,
            "rid": args.run_id,
            "verd": args.verdict,
            "akind": args.action_kind or "NONE",
            "atarget": args.action_target or "NONE",
            "rat": args.rationale,
            "actor": args.actor,
            "at": now_ts,
        }
    )

    return {
        "decision_id": decision_id,
        "run_id": args.run_id,
        "verdict": args.verdict,
        "recorded_at": now_ts,
        "status": "RECORDED_IN_GRAPH_MEMORY"
    }

# Tool 5: check_system_health
class CheckSystemHealthInput(BaseModel):
    model_config = {"extra": "forbid"}
    ping: Optional[str] = Field(None, description="Optional diagnostic echo token")

def check_system_health(args: Optional[CheckSystemHealthInput] = None) -> Dict[str, Any]:
    """AG-07: Diagnostic graph health check tool."""
    client = get_graph_client()
    world = client.select_graph("keystone_world")
    res_nodes = world.query("MATCH (n) RETURN count(n) AS cnt")
    node_count = int(res_nodes.result_set[0][0]) if res_nodes.result_set else 0

    res_corridors = world.query("MATCH ()-[r:ROAD_ARC]->() RETURN count(DISTINCT r.corridor_id) AS cnt")
    corridor_count = int(res_corridors.result_set[0][0]) if res_corridors.result_set else 0

    res_fac = world.query("MATCH (f:Facility) RETURN count(f) AS cnt")
    fac_count = int(res_fac.result_set[0][0]) if res_fac.result_set else 0

    return {
        "status": "HEALTHY",
        "falkordb_version": "6.0.2",
        "world_node_count": node_count,
        "corridors_count": corridor_count,
        "facilities_count": fac_count,
        "ping_echo": args.ping if args else None
    }

# Functional alias for Track 01 compatibility
inspect_causal_chain = get_case_evidence

