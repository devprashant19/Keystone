"""
scripts/load_world.py - Idempotent CLI loader for jaal_world.
Prints node/edge counts and canonical SHA-256 graph digest.
"""

import sys
from pathlib import Path
from jaal.graph.client import get_graph_client
from jaal.ingest.loader import load_world_graph

def main():
    db = get_graph_client()
    graph = db.select_graph("jaal_world")
    print("Loading world into graph 'jaal_world'...")
    digest, nodes, edges = load_world_graph(graph, data_root=Path("data"))
    print(f"=== jaal_world Loaded Successfully ===")
    print(f"Total Nodes: {nodes}")
    print(f"Total Relationships: {edges}")
    print(f"Canonical Graph Digest: {digest}")

if __name__ == "__main__":
    main()
