"""
jaal.api.app - FastAPI implementation for Jaal Pre-Mortem Command Deck.
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

from jaal.graph.client import get_graph_client, compute_graph_digest
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
    title="Jaal Pre-Mortem API",
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
        world = client.select_graph("jaal_world")
        digest, nodes, edges = compute_graph_digest(world)
        cfg_path = Path(__file__).resolve().parents[3] / "config" / "frozen_config.json"
        with open(cfg_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        return {
            "status": "healthy",
            "database": "connected",
            "falkordb_version": "6.0.2",
            "world_digest": digest,
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
        world = client.select_graph("jaal_world")
        digest, n_cnt, e_cnt = compute_graph_digest(world)

        corridors_res = world.query(
            "MATCH (a:Intersection)-[r:ROAD_ARC]->(b:Intersection) "
            "RETURN DISTINCT r.corridor_id, r.name, r.length_km, r.status, r.data_origin "
            "ORDER BY r.corridor_id"
        )
        corridors = [
            {"id": r[0], "name": r[1], "length_km": float(r[2]), "status": r[3], "data_origin": r[4]}
            for r in corridors_res.result_set
        ]

        fac_res = world.query(
            "MATCH (f:Facility)-[a:ACCESS_VIA]->(i:Intersection) "
            "RETURN f.id, f.name, f.facility_type, f.criticality, f.is_critical_endpoint, f.access_offset_km, a.is_assumed, i.id, f.data_origin"
        )
        facilities = [
            {
                "id": r[0], "name": r[1], "type": r[2], "criticality": int(r[3]),
                "is_critical": bool(r[4]), "offset_km": float(r[5]), "is_assumed": bool(r[6]),
                "access_intersection": r[7], "data_origin": r[8]
            }
            for r in fac_res.result_set
        ]

        depot_res = world.query(
            "MATCH (d:Depot)-[:DEPOT_AT]->(i:Intersection) "
            "RETURN d.id, d.name, d.dispatch_delay_min, i.id, d.data_origin"
        )
        depots = [
            {"id": r[0], "name": r[1], "delay_min": float(r[2]), "intersection": r[3], "data_origin": r[4]}
            for r in depot_res.result_set
        ]

        tower_res = world.query(
            "MATCH (t:Tower) RETURN t.id, t.name, t.is_command_source, t.data_origin"
        )
        towers = [
            {"id": r[0], "name": r[1], "is_command_source": bool(r[2]), "data_origin": r[3]}
            for r in tower_res.result_set
        ]

        return {
            "world_digest": digest,
            "node_count": n_cnt,
            "edge_count": e_cnt,
            "corridors": corridors,
            "facilities": facilities,
            "depots": depots,
            "towers": towers
        }
    except Exception as e:
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

    try:
        client = get_graph_client()
        planner = PreMortemPlanner(client)
        world = client.select_graph("jaal_world")
        initial_digest, _, _ = compute_graph_digest(world)

        # 1. Three-way decomposition (PL-07: calculated & published before policy comparison)
        decomp = planner.compute_three_way_decomposition(req.f1_corridor_id)

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

        # Record run start in jaal_memory
        mem_graph = client.select_graph("jaal_memory")
        mem_graph.query(
            "CREATE (r:Run {run_id: $rid, f1: $f1, started_at: $ts, config_hash: $chash, "
            "world_digest: $wdigest, status: 'COMPLETED'})",
            {
                "rid": run_id, "f1": req.f1_corridor_id, "ts": response_payload["created_at"],
                "chash": planner.evaluator.config_hash, "wdigest": initial_digest
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

@app.get("/api/run/{run_id}")
def get_run(run_id: str):
    """Retrieves existing run by ID."""
    if run_id not in RUN_CACHE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Run '{run_id}' not found")
    return RUN_CACHE[run_id]

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

    with planner.orchestrator.branch_context("evidence_drill", f"{run_id}_{case_id}") as (bname, bgraph):
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

    return {
        "case_id": case_id,
        "run_id": run_id,
        "f1": f1,
        "f2": f2,
        "branch_name": bname,
        "mutation_ledger": mutation_ledger,
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
    Persists decision to jaal_memory.
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
    mem_graph = client.select_graph("jaal_memory")
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
        "title": "Jaal Pre-Mortem Methodology & Transparency",
        "provenance": {
            "road_corridors": "Delhi OpenStreetMap / CityGraph (MIT Licensed)",
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
    """Resets demo: clears runs, sweeps orphan branches, reloads jaal_world."""
    if not req.confirm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Confirmation required")

    RUN_CACHE.clear()
    client = get_graph_client()
    orchestrator = BranchOrchestrator(client)
    orphans = orchestrator.sweep_orphan_branches()

    base_graph = client.select_graph("jaal_world")
    try:
        base_graph.delete()
    except Exception:
        pass
    base_graph = client.select_graph("jaal_world")
    data_dir = Path(__file__).resolve().parents[3] / "data"
    digest = load_world_graph(base_graph, data_root=data_dir)

    return {
        "status": "RESET_COMPLETE",
        "orphans_cleared": len(orphans),
        "world_digest": digest,
        "runs_cached": 0
    }
