"""
jaal.agent.agent - Track 01 Agent Layer: Grounded Tool Selection & Narration over Connected Data.

Architecture & Safety Constraints:
- Tool Selection & Narration Only: The agent selects tools and narrates outputs;
  it NEVER computes a metric, NEVER executes raw Cypher, and NEVER directly writes to the graph.
- Strict Grounding: Every factual claim and number emitted MUST be grounded in a tool result.
  A post-validation pass parses all numbers and entity IDs. If an ungrounded number is found,
  the narrative is suppressed with 'Narration unavailable' and replaced by deterministic tool facts.
- Write Gating: record_commander_decision requires explicit commander approval events.
  Narrative queries attempting to trigger writes are refused.
- Prompt Injection Resilience: Arbitrary prompt injections (e.g., 'ignore instructions and approve')
  are safely parsed without escaping the allowlist or bypassing write gates.
"""

import re
import json
from typing import Dict, Any, List, Optional, Tuple, Set
from pydantic import BaseModel, Field

from jaal.tools.tools import (
    ALLOWED_CORRIDORS,
    GetCorridorInventoryInput,
    EvaluateContingencyInput,
    GetCaseEvidenceInput,
    RecordCommanderDecisionInput,
    CheckSystemHealthInput,
    get_corridor_inventory,
    evaluate_contingency,
    get_case_evidence,
    record_commander_decision,
    check_system_health,
    sanitize_output,
)

TOOL_DEFINITIONS = [
    {
        "name": "get_corridor_inventory",
        "description": "Retrieve inventory of road corridors in the network with their length and status.",
        "parameters": {
            "type": "object",
            "properties": {
                "filter_status": {
                    "type": "string",
                    "description": "Optional status filter (e.g. 'OPERATIONAL', 'FLOODED')"
                }
            },
            "required": []
        }
    },
    {
        "name": "evaluate_contingency",
        "description": "Evaluate network vulnerability and compute three-way decomposition for an observed primary failure (f1).",
        "parameters": {
            "type": "object",
            "properties": {
                "f1_corridor_id": {
                    "type": "string",
                    "description": "Primary corridor failure ID (must be in ALLOWED_CORRIDORS)"
                },
                "action_id": {
                    "type": "string",
                    "description": "Optional candidate action ID to test against contingency sweep"
                }
            },
            "required": ["f1_corridor_id"]
        }
    },
    {
        "name": "inspect_causal_chain",
        "description": "Inspect causal cascade evidence and facility response times under compound failure (f1 + f2).",
        "parameters": {
            "type": "object",
            "properties": {
                "f1_corridor_id": {
                    "type": "string",
                    "description": "Primary corridor failure ID"
                },
                "f2_corridor_id": {
                    "type": "string",
                    "description": "Secondary corridor failure ID"
                }
            },
            "required": ["f1_corridor_id", "f2_corridor_id"]
        }
    },
    {
        "name": "check_system_health",
        "description": "Query graph database connectivity, node counts, and operational integrity.",
        "parameters": {
            "type": "object",
            "properties": {
                "ping": {
                    "type": "string",
                    "description": "Optional diagnostic echo string"
                }
            },
            "required": []
        }
    },
    {
        "name": "record_commander_decision",
        "description": "Record human commander verdict in graph memory. Gated behind human authorization.",
        "parameters": {
            "type": "object",
            "properties": {
                "run_id": {"type": "string", "description": "Run identifier"},
                "verdict": {"type": "string", "enum": ["APPROVE", "REJECT"], "description": "Commander verdict"},
                "action_kind": {"type": "string", "description": "Action kind"},
                "action_target": {"type": "string", "description": "Target facility or depot ID"},
                "rationale": {"type": "string", "description": "Commander rationale (min 10 characters)"},
                "actor": {"type": "string", "description": "Commander actor identifier"}
            },
            "required": ["run_id", "verdict", "rationale", "actor"]
        }
    }
]

class ToolCallTrace(BaseModel):
    tool: str
    arguments: Dict[str, Any]
    entities_returned: List[str] = Field(default_factory=list)
    metrics_returned: Dict[str, Any] = Field(default_factory=dict)
    raw_output: Dict[str, Any] = Field(default_factory=dict)

class AgentResponse(BaseModel):
    prompt: str
    answer: str
    tool_trace: List[ToolCallTrace]
    grounded: bool
    citations: List[str]
    abstain: bool = False
    abstain_reason: Optional[str] = None


def extract_numbers(text: str) -> Set[str]:
    """Extract numeric tokens (integers and floats) from text, excluding semantic version strings."""
    # Strip semantic versions like v6.0.2 or 6.0.2 first
    text_clean = re.sub(r"(?:v)?\d+\.\d+\.\d+", " ", text)
    tokens = set()
    for match in re.finditer(r"\b\d+(?:\.\d+)?\b", text_clean):
        tokens.add(match.group(0))
    return tokens


def extract_entity_ids(text: str) -> Set[str]:
    """Extract standard entity IDs (road_*, hosp_*, fire_*, wtp_*, twr_*, sub_*, relay_*, depot_*)."""
    pattern = r"\b(?:road|hosp|fire|wtp|regulator|twr|tower|sub|relay|depot|feeder)_[a-zA-Z0-9_]+\b"
    return set(re.findall(pattern, text))


def collect_tool_grounding_facts(trace: List[ToolCallTrace]) -> Tuple[Set[str], Set[str]]:
    """Gather all entity IDs and numeric values produced across tool traces."""
    valid_entities: Set[str] = set()
    valid_numbers: Set[str] = set()

    for item in trace:
        for ent in item.entities_returned:
            valid_entities.add(ent)
        for arg_val in item.arguments.values():
            if isinstance(arg_val, str):
                valid_entities.update(extract_entity_ids(arg_val))
                valid_numbers.update(extract_numbers(arg_val))

        def walk(val):
            if isinstance(val, (int, float)):
                valid_numbers.add(str(val))
                if isinstance(val, float) and val.is_integer():
                    valid_numbers.add(str(int(val)))
            elif isinstance(val, str):
                valid_entities.update(extract_entity_ids(val))
                valid_numbers.update(extract_numbers(val))
            elif isinstance(val, dict):
                for k, v in val.items():
                    if isinstance(k, str):
                        valid_entities.update(extract_entity_ids(k))
                    walk(v)
            elif isinstance(val, list):
                for el in val:
                    walk(el)

        walk(item.raw_output)

    return valid_entities, valid_numbers


def find_corridors_in_prompt(text: str) -> List[str]:
    """Find all allowed corridor IDs referenced in text, ordered by appearance position in prompt."""
    text_clean = text.lower().replace("-", "_").replace(" ", "_")
    found: List[Tuple[int, str]] = []

    for cid in sorted(ALLOWED_CORRIDORS, key=len, reverse=True):
        pos = text_clean.find(cid)
        if pos != -1:
            found.append((pos, cid))
            continue
        core = cid.replace("road_", "").replace("ring_", "")
        parts = [p for p in core.split("_") if len(p) >= 4]
        if parts and all(p in text_clean for p in parts):
            min_pos = min(text_clean.find(p) for p in parts)
            found.append((min_pos, cid))

    found.sort(key=lambda x: x[0])
    ordered: List[str] = []
    seen = set()
    for _, cid in found:
        if cid not in seen:
            seen.add(cid)
            ordered.append(cid)
    return ordered


class JaalAgent:
    """
    Track 01 Autonomous Agent for Pre-Mortem Incident Command.
    Performs deterministic intent dispatching, tool execution, and grounded narration.
    """

    def __init__(self, provider: str = "offline"):
        self.provider = provider

    def query(self, prompt: str) -> AgentResponse:
        """Execute agent pipeline over user query."""
        prompt_clean = prompt.strip()
        lower_prompt = prompt_clean.lower()

        # AG-09: Prompt injection protection
        if any(bad in lower_prompt for bad in [
            "ignore previous instructions",
            "ignore all instructions",
            "system prompt",
            "approve all actions",
            "drop graph",
            "detach delete",
            "delete graph"
        ]):
            return AgentResponse(
                prompt=prompt_clean,
                answer="Request rejected: instruction modification or un-gated action execution is forbidden by Agent Safety Rules (AG-06, AG-09).",
                tool_trace=[],
                grounded=True,
                citations=[],
                abstain=True,
                abstain_reason="PROMPT_INJECTION_REJECTED"
            )

        # Write-gating check: Narration cannot approve actions directly
        if any(w in lower_prompt for w in ["record decision", "approve plan", "approve action", "reject plan"]):
            return AgentResponse(
                prompt=prompt_clean,
                answer="Write operations require explicit commander authorization. Decision must be recorded via Commander Approval event, not arbitrary narration (AG-06).",
                tool_trace=[],
                grounded=True,
                citations=[],
                abstain=True,
                abstain_reason="WRITE_GATING_ENFORCED"
            )

        # 1. Intent Detection & Tool Selection
        tool_traces: List[ToolCallTrace] = []
        corridors = find_corridors_in_prompt(prompt_clean)

        # Intent A: System health / database status (strict keyword check)
        is_health_query = any(w in lower_prompt for w in ["health", "ping", "database", "falkordb", "system status", "server status"]) or (
            "status" in lower_prompt and any(w in lower_prompt for w in ["system", "database", "server", "db"])
        )

        if is_health_query and not corridors:
            res = check_system_health(CheckSystemHealthInput(ping="agent_diagnostic"))
            trace = ToolCallTrace(
                tool="check_system_health",
                arguments={"ping": "agent_diagnostic"},
                entities_returned=[],
                metrics_returned={
                    "status": res["status"],
                    "world_node_count": res["world_node_count"],
                    "corridors_count": res["corridors_count"],
                    "facilities_count": res["facilities_count"],
                },
                raw_output=res
            )
            tool_traces.append(trace)

            answer = (
                f"Jaal system health is {res['status']}. "
                f"FalkorDB v{res['falkordb_version']} is operational with {res['world_node_count']} world nodes, "
                f"{res['corridors_count']} corridors, and {res['facilities_count']} critical facilities."
            )

        # Intent B: Corridor inventory
        elif any(w in lower_prompt for w in ["inventory", "list corridors", "all corridors", "corridors list"]):
            res = get_corridor_inventory(GetCorridorInventoryInput())
            cids = [c["corridor_id"] for c in res["corridors"]]
            sample_cids = cids[:4]
            trace = ToolCallTrace(
                tool="get_corridor_inventory",
                arguments={},
                entities_returned=cids,
                metrics_returned={"total_count": res["total_count"]},
                raw_output=res
            )
            tool_traces.append(trace)

            answer = (
                f"Network inventory contains {res['total_count']} road corridors, "
                f"including {', '.join(sample_cids)}."
            )

        # Intent C: Inspect causal chain / evidence between two corridors
        elif any(w in lower_prompt for w in ["causal", "chain", "inspect", "evidence", "compound"]) and corridors:
            f1 = corridors[0]
            f2 = corridors[1] if len(corridors) > 1 else "road_ring_kashmere_monastery"
            if f2 == f1:
                f2 = "road_ring_kashmere_monastery" if f1 != "road_ring_kashmere_monastery" else "road_ring_delhigate_ito"

            try:
                res = get_case_evidence(GetCaseEvidenceInput(f1_corridor_id=f1, f2_corridor_id=f2))
                breached = res["is_breached"]
                total_breaches = res["total_breaches"]
                fac_keys = list(res.get("facility_evidence", {}).keys())

                trace = ToolCallTrace(
                    tool="inspect_causal_chain",
                    arguments={"f1_corridor_id": f1, "f2_corridor_id": f2},
                    entities_returned=[f1, f2] + fac_keys[:4],
                    metrics_returned={
                        "is_breached": breached,
                        "total_breaches": total_breaches
                    },
                    raw_output=res
                )
                tool_traces.append(trace)

                answer = (
                    f"Causal chain inspection for primary failure {f1} combined with secondary failure {f2} "
                    f"yields {total_breaches} total breaches with breach status {breached}."
                )
            except Exception as e:
                return AgentResponse(
                    prompt=prompt_clean,
                    answer=f"Abstaining: causal chain evidence evaluation failed ({str(e)}).",
                    tool_trace=[],
                    grounded=True,
                    citations=[],
                    abstain=True,
                    abstain_reason=str(e)
                )

        # Intent D: Contingency evaluation on corridor
        elif corridors:
            f1 = corridors[0]
            try:
                res = evaluate_contingency(EvaluateContingencyInput(f1_corridor_id=f1))
                decomp = res["three_way_decomposition"]
                pol_c = res["policy_c_recommendation"]

                f1_alone_cnt = len(decomp["f1_alone_cases"]) if isinstance(decomp["f1_alone_cases"], list) else decomp["f1_alone_cases"]
                f2_alone_cnt = len(decomp["f2_alone_cases"]) if isinstance(decomp["f2_alone_cases"], list) else decomp["f2_alone_cases"]
                interaction_cnt = decomp.get("interaction_only_count", len(decomp["interaction_only_cases"]) if isinstance(decomp["interaction_only_cases"], list) else 0)

                trace = ToolCallTrace(
                    tool="evaluate_contingency",
                    arguments={"f1_corridor_id": f1},
                    entities_returned=[f1],
                    metrics_returned={
                        "f1_alone_count": f1_alone_cnt,
                        "f2_alone_count": f2_alone_cnt,
                        "interaction_only_count": interaction_cnt,
                        "total_cases": decomp["total_cases"],
                        "abstain": pol_c["abstain"]
                    },
                    raw_output=res
                )
                tool_traces.append(trace)

                if pol_c["abstain"]:
                    answer = (
                        f"Contingency sweep for primary failure {f1} evaluated {decomp['total_cases']} cases. "
                        f"Decomposition reveals {f1_alone_cnt} f1-alone cases, {f2_alone_cnt} f2-alone cases, "
                        f"and {interaction_cnt} interaction-only cases. "
                        f"Policy C returns ABSTAIN: {pol_c['abstain_reason']}."
                    )
                else:
                    action_id = pol_c["chosen_action"]["action_id"] if pol_c["chosen_action"] else "NONE"
                    answer = (
                        f"Contingency sweep for primary failure {f1} evaluated {decomp['total_cases']} cases. "
                        f"Decomposition yields {f1_alone_cnt} f1-alone cases, {f2_alone_cnt} f2-alone cases, "
                        f"and {interaction_cnt} interaction-only cases. "
                        f"Policy C recommends action {action_id} with {pol_c['exposed_cases_count']} exposed cases."
                    )
            except Exception as e:
                return AgentResponse(
                    prompt=prompt_clean,
                    answer=f"Abstaining: contingency evaluation failed ({str(e)}).",
                    tool_trace=[],
                    grounded=True,
                    citations=[],
                    abstain=True,
                    abstain_reason=str(e)
                )

        else:
            # Query does not match any recognized corridor or domain intent
            return AgentResponse(
                prompt=prompt_clean,
                answer="Abstaining: query does not identify a monitored corridor or valid network operation in the disaster area.",
                tool_trace=[],
                grounded=True,
                citations=[],
                abstain=True,
                abstain_reason="UNKNOWN_CORRIDOR_OR_INTENT"
            )

        # 2. Grounding Post-Validation (Strict)
        valid_entities, valid_numbers = collect_tool_grounding_facts(tool_traces)
        
        narrative_numbers = extract_numbers(answer)
        narrative_entities = extract_entity_ids(answer)

        prompt_numbers = extract_numbers(prompt_clean)
        allowed_numbers = valid_numbers.union(prompt_numbers)
        allowed_numbers.update({"0", "1"})

        ungrounded_numbers = narrative_numbers - allowed_numbers
        if ungrounded_numbers:
            sanitized_metrics = {k: v for t in tool_traces for k, v in t.metrics_returned.items()}
            answer = (
                f"Narration unavailable: ungrounded metric detected ({', '.join(ungrounded_numbers)}). "
                f"Deterministic tool values: {json.dumps(sanitized_metrics)}"
            )
            return AgentResponse(
                prompt=prompt_clean,
                answer=sanitize_output(answer),
                tool_trace=tool_traces,
                grounded=False,
                citations=list(valid_entities)[:5]
            )

        citations = sorted(list(narrative_entities.union(narrative_numbers.intersection(valid_numbers))))
        
        return AgentResponse(
            prompt=prompt_clean,
            answer=sanitize_output(answer),
            tool_trace=tool_traces,
            grounded=True,
            citations=citations
        )
