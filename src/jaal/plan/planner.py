"""
jaal.plan.planner - Pre-mortem scenario planner, three-way decomposition, and policy comparison engine.
"""

import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple, Set
from falkordb import FalkorDB

from jaal.evaluate.evaluator import SharedEvaluator, EvaluationResult
from jaal.branch.orchestrator import BranchOrchestrator

@dataclass
class Action:
    action_id: str
    action_kind: str
    target_id: str
    cost: float
    description: str

@dataclass
class CaseOutcome:
    f1: str
    f2: str
    action_id: Optional[str]
    is_breach: bool
    breached_facilities: List[str]
    breached_relays: List[str]
    total_breaches: int

@dataclass
class PolicyEvaluationSummary:
    policy_name: str
    chosen_action: Optional[Action]
    abstain: bool
    abstain_reason: Optional[str]
    total_cases_evaluated: int
    exposed_cases_count: int
    exposed_cases: List[str]
    total_breaches_sum: int
    action_cost: float
    case_outcomes: Dict[str, CaseOutcome] = field(default_factory=dict)

@dataclass
class ThreeWayDecomposition:
    f1_id: str
    f1_alone_breach: bool
    f1_alone_cases: List[str]
    f2_alone_cases: List[str]
    interaction_only_cases: List[str]
    neither_stressed_cases: List[str]
    total_cases: int

class PreMortemPlanner:
    def __init__(
        self,
        client: FalkorDB,
        evaluator: Optional[SharedEvaluator] = None,
        orchestrator: Optional[BranchOrchestrator] = None,
        config_path: Optional[Path] = None,
        base_graph_name: str = "jaal_world"
    ):
        self.client = client
        self.base_graph_name = base_graph_name
        self.evaluator = evaluator or SharedEvaluator(config_path)
        self.orchestrator = orchestrator or BranchOrchestrator(client, base_graph_name=base_graph_name)
        
        cfg_file = config_path or Path(__file__).resolve().parents[3] / "config" / "frozen_config.json"
        with open(cfg_file, "r", encoding="utf-8") as f:
            self.config = json.load(f)

    def get_all_corridors(self) -> List[str]:
        """Returns sorted list of distinct corridor IDs from jaal_world."""
        world = self.client.select_graph(self.base_graph_name)
        res = world.query("MATCH ()-[r:ROAD_ARC]->() RETURN DISTINCT r.corridor_id AS cid ORDER BY cid ASC")
        return [row[0] for row in res.result_set]

    def get_default_action_catalog(self) -> List[Action]:
        """
        Builds the allowed-action catalog FROM THE GRAPH, not from hard-coded ids.

        One PREPOSITION_DEPOT action per :Depot and one DEPLOY_MOBILE_RELAY action per
        required-target :RelayContact. Deriving the catalog means a fixture change
        (adding a depot, renaming a relay) cannot leave a stale action pointing at a
        node that no longer exists, which would silently make a policy a no-op.
        Ordering is deterministic (by id) so action selection and tie-breaking are
        reproducible.
        """
        world = self.client.select_graph(self.base_graph_name)

        depot_res = world.query(
            "MATCH (d:Depot) RETURN d.id, d.name ORDER BY d.id ASC"
        )
        relay_res = world.query(
            "MATCH (r:RelayContact {is_required_target: true}) "
            "RETURN r.id, r.name ORDER BY r.id ASC"
        )

        catalog: List[Action] = []
        for row in depot_res.result_set:
            did, dname = row[0], row[1]
            catalog.append(Action(
                action_id=f"act_prep_{did}",
                action_kind="PREPOSITION_DEPOT",
                target_id=did,
                cost=1.0,
                description=(
                    f"Pre-position responder at {dname} "
                    f"(dispatch delay {self.evaluator.dispatch_delay_pre_positioned_min} min)"
                )
            ))
        for row in relay_res.result_set:
            rid, rname = row[0], row[1]
            catalog.append(Action(
                action_id=f"act_relay_{rid}",
                action_kind="DEPLOY_MOBILE_RELAY",
                target_id=rid,
                cost=1.5,
                description=f"Deploy mobile mesh relay to {rname}"
            ))
        return catalog

    def _apply_action_to_branch(self, branch_graph, action: Optional[Action]) -> Optional[Dict[str, float]]:
        """Applies action modifications to branch graph. Returns depot delay overrides if applicable."""
        if action is None:
            return None

        if action.action_kind == "PREPOSITION_DEPOT":
            return {action.target_id: self.evaluator.dispatch_delay_pre_positioned_min}

        if action.action_kind == "DEPLOY_MOBILE_RELAY":
            branch_graph.query(
                "MATCH (t:Tower {is_command_source: true}), (r:RelayContact {id: $rid}) "
                "MERGE (t)-[a:ALERT_ARC {link_id: $lid}]->(r) "
                "ON CREATE SET a.latency_min = 2.0, a.data_origin = 'synthetic', a.carrier_corridor_id = null",
                {"rid": action.target_id, "lid": f"mobile_link_{action.target_id}"}
            )
            return None

        return None

    def _check_critical_endpoints_exist(self) -> None:
        """PL-09: Verifies that critical endpoints exist in graph; raises ValueError if zero."""
        world = self.client.select_graph(self.base_graph_name)
        res = world.query("MATCH (f:Facility {is_critical_endpoint: true}) RETURN count(f)")
        cnt = res.result_set[0][0] if res.result_set else 0
        if cnt == 0:
            raise ValueError("Configuration error: no critical endpoints found in graph (zero demand)")

    def compute_three_way_decomposition(self, f1: str) -> ThreeWayDecomposition:
        """
        PL-07: Three-way case decomposition for a given f1:
        - f1-alone
        - f2-alone
        - interaction-only (neither alone, but joint breaches)
        Published before policy comparison.
        """
        self._check_critical_endpoints_exist()
        all_corridors = self.get_all_corridors()
        if f1 not in all_corridors:
            raise ValueError(f"Unknown corridor f1: {f1}")

        f2_candidates = [c for c in all_corridors if c != f1]

        # 1. Evaluate f1 alone
        with self.orchestrator.branch_context("decomp", f"f1_{f1}") as (bname, bgraph):
            self.orchestrator.apply_cascade(bname, f1, is_f1=True)
            res_f1 = self.evaluator.evaluate_graph(bgraph, f"f1_alone_{f1}")
            f1_alone_breach = res_f1.is_breached

        # 2. Evaluate each f2 alone
        f2_alone_results: Dict[str, bool] = {}
        for f2 in f2_candidates:
            with self.orchestrator.branch_context("decomp", f"f2_{f2}") as (bname, bgraph):
                self.orchestrator.apply_cascade(bname, f2, is_f1=False)
                res_f2 = self.evaluator.evaluate_graph(bgraph, f"f2_alone_{f2}")
                f2_alone_results[f2] = res_f2.is_breached

        # 3. Evaluate joint (f1, f2) under no action
        f1_alone_cases: List[str] = []
        f2_alone_cases: List[str] = []
        interaction_only_cases: List[str] = []
        neither_stressed_cases: List[str] = []

        for f2 in f2_candidates:
            with self.orchestrator.branch_context("decomp", f"joint_{f1}_{f2}") as (bname, bgraph):
                self.orchestrator.apply_cascade(bname, f1, is_f1=True)
                self.orchestrator.apply_cascade(bname, f2, is_f1=False)
                res_joint = self.evaluator.evaluate_graph(bgraph, f"joint_{f1}_{f2}")
                joint_breach = res_joint.is_breached

            f2_alone_b = f2_alone_results[f2]

            if f1_alone_breach:
                f1_alone_cases.append(f2)
            elif f2_alone_b:
                f2_alone_cases.append(f2)
            elif joint_breach:
                interaction_only_cases.append(f2)
            else:
                neither_stressed_cases.append(f2)

        return ThreeWayDecomposition(
            f1_id=f1,
            f1_alone_breach=f1_alone_breach,
            f1_alone_cases=f1_alone_cases,
            f2_alone_cases=f2_alone_cases,
            interaction_only_cases=interaction_only_cases,
            neither_stressed_cases=neither_stressed_cases,
            total_cases=len(f2_candidates)
        )

    def _select_policy_b_action(self, f1: str, allowed_actions: List[Action]) -> Optional[Action]:
        """
        PL-02: Policy B selects an action using static graph structure + f1 ONLY.
        Contains NO f2 identifier in input or evaluation.
        Uses degree centrality of depot intersections.
        """
        if not allowed_actions:
            return None

        # Filter to actions relevant to static degree
        world = self.client.select_graph(self.base_graph_name)
        # Degree of depot intersections
        deg_res = world.query(
            "MATCH (d:Depot)-[:DEPOT_AT]->(i:Intersection)-[:ROAD_ARC]-() "
            "RETURN d.id, count(*) AS deg ORDER BY deg DESC, d.id ASC"
        )
        if deg_res.result_set:
            highest_deg_depot = deg_res.result_set[0][0]
            for act in allowed_actions:
                if act.action_kind == "PREPOSITION_DEPOT" and act.target_id == highest_deg_depot:
                    return act

        return allowed_actions[0]

    def run_f1_sweep(
        self,
        f1: str,
        allowed_actions: Optional[List[Action]] = None,
        run_id: str = "run_planner"
    ) -> Dict[str, PolicyEvaluationSummary]:
        """
        Runs comprehensive evaluation across all 13 f2 cases for Policies A, B, and C.
        Returns: Dict mapping 'POLICY_A', 'POLICY_B', 'POLICY_C' to PolicyEvaluationSummary.
        """
        self._check_critical_endpoints_exist()
        all_corridors = self.get_all_corridors()
        if f1 not in all_corridors:
            raise ValueError(f"Unknown corridor f1: {f1}")

        f2_candidates = [c for c in all_corridors if c != f1]
        actions = self.get_default_action_catalog() if allowed_actions is None else allowed_actions

        # -------------------------------------------------------------
        # POLICY A: NO ACTION
        # -------------------------------------------------------------
        pol_a_outcomes: Dict[str, CaseOutcome] = {}
        pol_a_exposed: List[str] = []
        pol_a_breaches_sum = 0

        for f2 in f2_candidates:
            with self.orchestrator.branch_context(run_id, f"A_{f1}_{f2}") as (bname, bgraph):
                self.orchestrator.apply_cascade(bname, f1, is_f1=True)
                self.orchestrator.apply_cascade(bname, f2, is_f1=False)
                res = self.evaluator.evaluate_graph(bgraph, f"case_{f1}_{f2}")

                outcome = CaseOutcome(
                    f1=f1,
                    f2=f2,
                    action_id=None,
                    is_breach=res.is_breached,
                    breached_facilities=res.access_breaches,
                    breached_relays=res.alert_breaches,
                    total_breaches=res.total_breaches
                )
                pol_a_outcomes[f2] = outcome
                if res.is_breached:
                    pol_a_exposed.append(f2)
                pol_a_breaches_sum += res.total_breaches

        summary_a = PolicyEvaluationSummary(
            policy_name="POLICY_A_NO_ACTION",
            chosen_action=None,
            abstain=False,
            abstain_reason=None,
            total_cases_evaluated=len(f2_candidates),
            exposed_cases_count=len(pol_a_exposed),
            exposed_cases=pol_a_exposed,
            total_breaches_sum=pol_a_breaches_sum,
            action_cost=0.0,
            case_outcomes=pol_a_outcomes
        )

        # -------------------------------------------------------------
        # POLICY B: STATIC HEURISTIC (Degree Centrality, non-forking)
        # -------------------------------------------------------------
        chosen_b_action = self._select_policy_b_action(f1, actions)
        pol_b_outcomes: Dict[str, CaseOutcome] = {}
        pol_b_exposed: List[str] = []
        pol_b_breaches_sum = 0

        for f2 in f2_candidates:
            with self.orchestrator.branch_context(run_id, f"B_{f1}_{f2}") as (bname, bgraph):
                self.orchestrator.apply_cascade(bname, f1, is_f1=True)
                self.orchestrator.apply_cascade(bname, f2, is_f1=False)
                overrides = self._apply_action_to_branch(bgraph, chosen_b_action)
                res = self.evaluator.evaluate_graph(bgraph, f"case_{f1}_{f2}", depot_delay_overrides=overrides)

                outcome = CaseOutcome(
                    f1=f1,
                    f2=f2,
                    action_id=chosen_b_action.action_id if chosen_b_action else None,
                    is_breach=res.is_breached,
                    breached_facilities=res.access_breaches,
                    breached_relays=res.alert_breaches,
                    total_breaches=res.total_breaches
                )
                pol_b_outcomes[f2] = outcome
                if res.is_breached:
                    pol_b_exposed.append(f2)
                pol_b_breaches_sum += res.total_breaches

        summary_b = PolicyEvaluationSummary(
            policy_name="POLICY_B_STATIC_HEURISTIC",
            chosen_action=chosen_b_action,
            abstain=False,
            abstain_reason=None,
            total_cases_evaluated=len(f2_candidates),
            exposed_cases_count=len(pol_b_exposed),
            exposed_cases=pol_b_exposed,
            total_breaches_sum=pol_b_breaches_sum,
            action_cost=chosen_b_action.cost if chosen_b_action else 0.0,
            case_outcomes=pol_b_outcomes
        )

        # -------------------------------------------------------------
        # POLICY C: PRE-MORTEM CONDITIONAL N-1
        # -------------------------------------------------------------
        # Handle empty actions catalog cleanly (PL-08)
        if not actions:
            summary_c = PolicyEvaluationSummary(
                policy_name="POLICY_C_PREMORTEM",
                chosen_action=None,
                abstain=True,
                abstain_reason="NO_FEASIBLE_ACTION_AVAILABLE",
                total_cases_evaluated=len(f2_candidates),
                exposed_cases_count=len(f2_candidates),
                exposed_cases=f2_candidates,
                total_breaches_sum=pol_a_breaches_sum,
                action_cost=0.0,
                case_outcomes=pol_a_outcomes
            )
            return {"POLICY_A": summary_a, "POLICY_B": summary_b, "POLICY_C": summary_c}

        # Evaluate EVERY candidate action across ALL 13 f2 branches (PL-06)
        action_scores = []
        action_outcomes_map: Dict[str, Dict[str, CaseOutcome]] = {}

        for act in actions:
            act_exposed: List[str] = []
            act_breaches_sum = 0
            act_outcomes: Dict[str, CaseOutcome] = {}

            for f2 in f2_candidates:
                with self.orchestrator.branch_context(run_id, f"C_{f1}_{f2}_{act.action_id}") as (bname, bgraph):
                    self.orchestrator.apply_cascade(bname, f1, is_f1=True)
                    self.orchestrator.apply_cascade(bname, f2, is_f1=False)
                    overrides = self._apply_action_to_branch(bgraph, act)
                    res = self.evaluator.evaluate_graph(bgraph, f"case_{f1}_{f2}", depot_delay_overrides=overrides)

                    outcome = CaseOutcome(
                        f1=f1,
                        f2=f2,
                        action_id=act.action_id,
                        is_breach=res.is_breached,
                        breached_facilities=res.access_breaches,
                        breached_relays=res.alert_breaches,
                        total_breaches=res.total_breaches
                    )
                    act_outcomes[f2] = outcome
                    if res.is_breached:
                        act_exposed.append(f2)
                    act_breaches_sum += res.total_breaches

            action_outcomes_map[act.action_id] = act_outcomes

            # Lexicographical key:
            # 1. exposed_cases_count
            # 2. total_breaches_sum
            # 3. action cost
            # 4. (action_kind, target_id) tie break (PL-05)
            score_key = (
                len(act_exposed),
                act_breaches_sum,
                act.cost,
                act.action_kind,
                act.target_id
            )
            action_scores.append((score_key, act, act_exposed, act_breaches_sum))

        # Sort actions lexicographically
        action_scores.sort(key=lambda x: x[0])
        best_score, best_action, best_exposed, best_breaches_sum = action_scores[0]
        best_exposed_count = best_score[0]

        # Check robust feasibility (PL-03)
        if best_exposed_count > 0:
            # First-class abstention: no plan preserves all critical requirements
            summary_c = PolicyEvaluationSummary(
                policy_name="POLICY_C_PREMORTEM",
                chosen_action=best_action,
                abstain=True,
                abstain_reason="NO_PLAN_PRESERVES_ALL_CRITICAL_REQUIREMENTS",
                total_cases_evaluated=len(f2_candidates),
                exposed_cases_count=best_exposed_count,
                exposed_cases=best_exposed,
                total_breaches_sum=best_breaches_sum,
                action_cost=0.0,
                case_outcomes=action_outcomes_map[best_action.action_id]
            )
        else:
            summary_c = PolicyEvaluationSummary(
                policy_name="POLICY_C_PREMORTEM",
                chosen_action=best_action,
                abstain=False,
                abstain_reason=None,
                total_cases_evaluated=len(f2_candidates),
                exposed_cases_count=0,
                exposed_cases=[],
                total_breaches_sum=best_breaches_sum,
                action_cost=best_action.cost,
                case_outcomes=action_outcomes_map[best_action.action_id]
            )

        return {
            "POLICY_A": summary_a,
            "POLICY_B": summary_b,
            "POLICY_C": summary_c
        }
