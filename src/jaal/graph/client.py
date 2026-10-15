"""
jaal.graph.client - Database connection, constraints, and canonical graph digests.
"""

import hashlib
import os
from typing import Tuple, Dict, Any, List
from falkordb import FalkorDB

def get_graph_client(host: str = None, port: int = None, password: str = None) -> FalkorDB:
    """Returns a connected FalkorDB client instance."""
    h = host or os.getenv("FALKORDB_HOST", "localhost")
    p = port or int(os.getenv("FALKORDB_PORT", "6379"))
    pw = password or os.getenv("FALKORDB_PASSWORD", None)
    return FalkorDB(host=h, port=p, password=pw)

def ensure_constraints_and_indexes(graph) -> None:
    """
    Creates schema unique constraints and attribute indexes per Section 3 of 06_PRODUCT_ARCHITECTURE.md.
    """
    # Unique node constraints
    unique_labels = [
        "Intersection", "Facility", "Depot", "Tower", 
        "RelayContact", "PowerFeeder", "Run", "Decision"
    ]
    for lbl in unique_labels:
        try:
            graph.query(f"CREATE CONSTRAINT FOR (n:{lbl}) REQUIRE n.id IS UNIQUE")
        except Exception:
            pass  # Constraint already exists

    # Indexes
    index_defs = [
        ("ROAD_ARC", "corridor_id"),
        ("ALERT_ARC", "carrier_corridor_id"),
        ("FEEDS_TOWER", "carrier_corridor_id"),
    ]
    for rel_type, prop in index_defs:
        try:
            graph.query(f"CREATE INDEX FOR ()-[r:{rel_type}]-() ON (r.{prop})")
        except Exception:
            pass
            
    try:
        graph.query("CREATE INDEX FOR (f:Facility) ON (f.is_critical_endpoint)")
    except Exception:
        pass

def compute_graph_digest(graph) -> Tuple[str, int, int]:
    """
    Computes a deterministic SHA-256 digest over all nodes and relationships.
    Returns: (sha256_hex_digest, node_count, edge_count)
    """
    node_res = graph.query("MATCH (n) RETURN labels(n) AS lbls, properties(n) AS props ORDER BY id(n)")
    node_data = []
    for row in node_res.result_set:
        lbls = sorted(row[0]) if row[0] else []
        props = row[1] if row[1] else {}
        sorted_props = sorted((k, str(v)) for k, v in props.items())
        node_data.append(f"NODE:{lbls}:{sorted_props}")
    
    edge_res = graph.query("MATCH (a)-[r]->(b) RETURN type(r) AS t, properties(r) AS props, a.id AS src, b.id AS dst ORDER BY id(r)")
    edge_data = []
    for row in edge_res.result_set:
        rel_type = row[0]
        props = row[1] if row[1] else {}
        sorted_props = sorted((k, str(v)) for k, v in props.items())
        src = row[2]
        dst = row[3]
        edge_data.append(f"EDGE:{rel_type}:{src}->{dst}:{sorted_props}")

    canonical_repr = "\n".join(node_data + edge_data).encode("utf-8")
    digest = hashlib.sha256(canonical_repr).hexdigest()
    return digest, len(node_data), len(edge_data)
