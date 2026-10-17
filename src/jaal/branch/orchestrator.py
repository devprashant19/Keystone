"""
jaal.branch.orchestrator - FalkorDB branch lifecycle and staged cascade engine.
"""

import time
import uuid
from datetime import datetime, timezone
from contextlib import contextmanager
from typing import Dict, Any, List, Optional, Generator, Tuple
from falkordb import FalkorDB

from jaal.graph.client import compute_graph_digest

class BranchCollisionError(Exception):
    """Raised when attempting to create a branch that already exists."""
    pass

class BranchTransientError(Exception):
    """Raised when branch creation encounters a transient error."""
    pass

class ImmutabilityViolationError(Exception):
    """Raised when keystone_world graph digest changes after a run."""
    pass

class BranchOrchestrator:
    def __init__(
        self,
        client: FalkorDB,
        base_graph_name: str = "keystone_world",
        memory_graph_name: str = "keystone_memory",
        max_retries: int = 3,
        backoff_sec: float = 0.05
    ):
        self.client = client
        self.base_graph_name = base_graph_name
        self.memory_graph_name = memory_graph_name
        self.max_retries = max_retries
        self.backoff_sec = backoff_sec
        self.transient_fail_injector: Optional[Any] = None
        self.retries_attempted: int = 0

    def list_graphs(self) -> List[str]:
        """Returns all existing graph names in the FalkorDB instance."""
        raw_list = self.client.connection.execute_command("GRAPH.LIST")
        graphs = []
        for g in raw_list:
            if isinstance(g, bytes):
                graphs.append(g.decode("utf-8"))
            else:
                graphs.append(str(g))
        return graphs

    def create_branch(self, run_id: str, case_id: str, nonce: str = "") -> str:
        """
        Creates an isolated copy of keystone_world named keystone_branch_{run_id}_{case_id}{nonce}.
        Enforces collision detection (BR-05) and transient retries (BR-06).
        """
        suffix = f"_{nonce}" if nonce else ""
        branch_name = f"keystone_branch_{run_id}_{case_id}{suffix}"
        
        existing = self.list_graphs()
        if branch_name in existing:
            raise BranchCollisionError(f"Destination branch '{branch_name}' already exists (collision detected)")

        attempts = 0
        last_error = None
        while attempts <= self.max_retries:
            try:
                if self.transient_fail_injector:
                    self.transient_fail_injector(attempts)

                self.client.connection.execute_command("GRAPH.COPY", self.base_graph_name, branch_name)
                return branch_name
            except Exception as e:
                attempts += 1
                self.retries_attempted += 1
                last_error = e
                if attempts > self.max_retries:
                    break
                time.sleep(self.backoff_sec * (2 ** (attempts - 1)))

        raise BranchTransientError(f"Failed to copy '{self.base_graph_name}' to '{branch_name}' after {attempts} attempts: {last_error}")

    def delete_branch(self, branch_name: str) -> bool:
        """Deletes a branch graph, returning True if deleted."""
        try:
            self.client.connection.execute_command("GRAPH.DELETE", branch_name)
            return True
        except Exception:
            return False

    def sweep_orphan_branches(self, prefix: str = "keystone_branch_") -> List[str]:
        """Sweeps and deletes any lingering branch graphs."""
        deleted = []
        for g in self.list_graphs():
            if g.startswith(prefix):
                self.delete_branch(g)
                deleted.append(g)
        return deleted

    def record_ledger_entries(self, entries: List[Dict[str, Any]]) -> None:
        """Writes mutation ledger rows to keystone_memory graph."""
        if not entries:
            return
        mem_graph = self.client.select_graph(self.memory_graph_name)
        for e in entries:
            mem_graph.query(
                "CREATE (m:ScenarioMutation {mutation_id: $mid, branch_id: $bid, run_id: $rid, "
                "entity_kind: $ekind, entity_id: $eid, reason_code: $rcode, at: $at})",
                {
                    "mid": e["mutation_id"],
                    "bid": e["branch_id"],
                    "rid": e["run_id"],
                    "ekind": e["entity_kind"],
                    "eid": e["entity_id"],
                    "rcode": e["reason_code"],
                    "at": e["at"],
                }
            )

    def apply_cascade(
        self,
        branch_name: str,
        corridor_id: str,
        is_f1: bool = True,
        run_id: str = "",
        branch_id: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Executes the staged 4-step cascade on the specified branch graph:
        1. ROAD_ARC pairs sharing corridor_id (OBSERVED_CORRIDOR_FAILURE / EVALUATED_SECOND_FAILURE)
        2. Carried ALERT_ARC pairs (CARRIED_ALERT_BACKHAUL_SEVERED)
        3. Carried FEEDS_TOWER (CARRIED_FEEDER_SEVERED)
        4. Towers with zero surviving feeders -> attached ALERT_ARC pairs (TOWER_UNPOWERED)

        Ledger is recorded BEFORE deletions (BR-03).
        Returns the list of mutation records.
        """
        branch_graph = self.client.select_graph(branch_name)
        now_ts = datetime.now(timezone.utc).isoformat()
        b_id = branch_id or branch_name
        r_id = run_id or "run_local"

        mutation_ledger: List[Dict[str, Any]] = []

        # --- Stage 1: ROAD_ARC ---
        road_res = branch_graph.query(
            "MATCH (a:Intersection)-[r:ROAD_ARC {corridor_id: $cid}]->(b:Intersection) "
            "RETURN r.direction AS dir, a.id AS s, b.id AS t",
            {"cid": corridor_id}
        )
        road_reason = "OBSERVED_CORRIDOR_FAILURE" if is_f1 else "EVALUATED_SECOND_FAILURE"
        for row in road_res.result_set:
            direction = row[0]
            mutation_ledger.append({
                "mutation_id": str(uuid.uuid4()),
                "branch_id": b_id,
                "run_id": r_id,
                "entity_kind": "ROAD_ARC",
                "entity_id": f"{corridor_id}_{direction}",
                "reason_code": road_reason,
                "at": now_ts
            })

        # --- Stage 2: Carried ALERT_ARC ---
        alert_res = branch_graph.query(
            "MATCH (s)-[a:ALERT_ARC {carrier_corridor_id: $cid}]->(t) "
            "RETURN a.link_id AS lid, s.id AS src, t.id AS dst",
            {"cid": corridor_id}
        )
        for row in alert_res.result_set:
            lid = row[0]
            mutation_ledger.append({
                "mutation_id": str(uuid.uuid4()),
                "branch_id": b_id,
                "run_id": r_id,
                "entity_kind": "ALERT_ARC",
                "entity_id": lid,
                "reason_code": "CARRIED_ALERT_BACKHAUL_SEVERED",
                "at": now_ts
            })

        # --- Stage 3: Carried FEEDS_TOWER ---
        feeder_res = branch_graph.query(
            "MATCH (p:PowerFeeder)-[f:FEEDS_TOWER]->(t:Tower) "
            "WHERE p.carrier_corridor_id = $cid OR f.carrier_corridor_id = $cid "
            "RETURN p.id AS pid, t.id AS tid",
            {"cid": corridor_id}
        )
        affected_towers = set()
        for row in feeder_res.result_set:
            pid, tid = row[0], row[1]
            affected_towers.add(tid)
            mutation_ledger.append({
                "mutation_id": str(uuid.uuid4()),
                "branch_id": b_id,
                "run_id": r_id,
                "entity_kind": "FEEDS_TOWER",
                "entity_id": f"{pid}->{tid}",
                "reason_code": "CARRIED_FEEDER_SEVERED",
                "at": now_ts
            })

        # --- Stage 4: Towers with zero surviving feeders ---
        unpowered_towers = set()
        for tid in affected_towers:
            surviving_res = branch_graph.query(
                "MATCH (p:PowerFeeder)-[f:FEEDS_TOWER]->(t:Tower {id: $tid}) "
                "WHERE NOT (p.carrier_corridor_id = $cid OR f.carrier_corridor_id = $cid) "
                "RETURN count(f) AS cnt",
                {"tid": tid, "cid": corridor_id}
            )
            surviving_cnt = surviving_res.result_set[0][0] if surviving_res.result_set else 0
            if surviving_cnt == 0:
                unpowered_towers.add(tid)
                mutation_ledger.append({
                    "mutation_id": str(uuid.uuid4()),
                    "branch_id": b_id,
                    "run_id": r_id,
                    "entity_kind": "Tower",
                    "entity_id": tid,
                    "reason_code": "TOWER_UNPOWERED",
                    "at": now_ts
                })
                # Alert links attached to unpowered tower
                tow_alert_res = branch_graph.query(
                    "MATCH (t:Tower {id: $tid})-[a:ALERT_ARC]-(other) "
                    "RETURN a.link_id AS lid",
                    {"tid": tid}
                )
                for a_row in tow_alert_res.result_set:
                    lid = a_row[0]
                    mutation_ledger.append({
                        "mutation_id": str(uuid.uuid4()),
                        "branch_id": b_id,
                        "run_id": r_id,
                        "entity_kind": "ALERT_ARC",
                        "entity_id": lid,
                        "reason_code": "TOWER_UNPOWERED",
                        "at": now_ts
                    })

        # Write to memory graph BEFORE physical deletions (BR-03)
        self.record_ledger_entries(mutation_ledger)

        # --- Perform Physical Deletions in Branch ---
        branch_graph.query(
            "MATCH ()-[r:ROAD_ARC {corridor_id: $cid}]->() DELETE r",
            {"cid": corridor_id}
        )
        branch_graph.query(
            "MATCH ()-[a:ALERT_ARC {carrier_corridor_id: $cid}]->() DELETE a",
            {"cid": corridor_id}
        )
        branch_graph.query(
            "MATCH (p:PowerFeeder)-[f:FEEDS_TOWER]->() "
            "WHERE p.carrier_corridor_id = $cid OR f.carrier_corridor_id = $cid "
            "DELETE f",
            {"cid": corridor_id}
        )
        for tid in unpowered_towers:
            branch_graph.query(
                "MATCH (t:Tower {id: $tid})-[a:ALERT_ARC]-() DELETE a",
                {"tid": tid}
            )

        return mutation_ledger

    @contextmanager
    def branch_context(
        self,
        run_id: str,
        case_id: str,
        nonce: str = ""
    ) -> Generator[Tuple[str, Any], None, None]:
        """
        Context manager that creates a branch and guarantees cleanup in a finally block (BR-04).
        Yields (branch_name, branch_graph).
        """
        branch_name = self.create_branch(run_id, case_id, nonce)
        try:
            branch_graph = self.client.select_graph(branch_name)
            yield branch_name, branch_graph
        finally:
            self.delete_branch(branch_name)

    def assert_immutability(self, expected_digest: str) -> None:
        """Asserts that the base keystone_world graph digest matches the expected digest (BR-01, BR-07)."""
        base_graph = self.client.select_graph(self.base_graph_name)
        current_digest, _, _ = compute_graph_digest(base_graph)
        if current_digest != expected_digest:
            raise ImmutabilityViolationError(
                f"Base world immutability violated! Expected {expected_digest}, but found {current_digest}."
            )
