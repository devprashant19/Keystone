"""
scripts/reset_demo.py - Complete repeatable reset sequence for demo presentation.
Clears memory, sweeps any orphan branches, reloads pristine keystone_world.
"""

from pathlib import Path
from jaal.graph.client import get_graph_client, compute_graph_digest
from jaal.ingest.loader import load_world_graph
from jaal.branch.orchestrator import BranchOrchestrator

def reset_demo():
    print("Beginning KEYSTONE Pre-Mortem demo reset...")
    client = get_graph_client()
    orchestrator = BranchOrchestrator(client)

    # 1. Sweep orphan branches
    orphans = orchestrator.sweep_orphan_branches()
    print(f"Swept {len(orphans)} lingering scenario branches.")

    # 2. Reset keystone_world
    base_graph = client.select_graph("keystone_world")
    try:
        base_graph.delete()
        print("Deleted existing keystone_world graph.")
    except Exception:
        pass

    base_graph = client.select_graph("keystone_world")
    data_dir = Path(__file__).resolve().parents[1] / "data"
    digest = load_world_graph(base_graph, data_root=data_dir)
    print(f"Reloaded keystone_world with pristine topology. Digest: {digest}")

    # 3. Clean memory graph decisions if needed
    try:
        mem_graph = client.select_graph("keystone_memory")
        mem_graph.delete()
        print("Reset keystone_memory audit log.")
    except Exception:
        pass

    print("Demo reset complete. Ready for live presentation.")

if __name__ == "__main__":
    reset_demo()
