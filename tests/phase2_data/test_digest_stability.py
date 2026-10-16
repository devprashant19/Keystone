"""
tests/phase2_data/test_digest_stability.py - Verifies world digest stability and content digest invariance.
Per Fix-All Step 4 (I-8).
"""

import pytest
import time
from pathlib import Path
from jaal.graph.client import get_graph_client, compute_graph_digest, compute_content_digest
from jaal.ingest.loader import load_world_graph

def test_world_digest_stability_across_reloads():
    """
    Verify: reload the world twice;
    mutation digest differs (ingested_at changes), content digest identical;
    """
    client = get_graph_client()
    base_graph = client.select_graph("jaal_world")

    # Load world run 1
    base_graph.delete()
    base_graph = client.select_graph("jaal_world")
    load_world_graph(base_graph, data_root=Path("data"))
    mut_digest_1, n1, e1 = compute_graph_digest(base_graph)
    content_digest_1, cn1, ce1 = compute_content_digest(base_graph)

    # Pause 1 second so timestamp changes
    time.sleep(1.1)

    # Load world run 2
    base_graph.delete()
    base_graph = client.select_graph("jaal_world")
    load_world_graph(base_graph, data_root=Path("data"))
    mut_digest_2, n2, e2 = compute_graph_digest(base_graph)
    content_digest_2, cn2, ce2 = compute_content_digest(base_graph)

    # Node count and edge count are identical
    assert n1 == n2 == 60
    assert e1 == e2 == 100

    # Content digest must be strictly identical across reloads
    assert content_digest_1 == content_digest_2, (
        f"Content digest drifted across reloads! Run 1: {content_digest_1}, Run 2: {content_digest_2}"
    )

    # Mutation digest differs due to ingested_at timestamp
    assert mut_digest_1 != mut_digest_2, (
        "Mutation digest did not capture timestamp difference across reloads"
    )
