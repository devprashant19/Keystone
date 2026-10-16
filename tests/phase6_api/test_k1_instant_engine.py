"""
tests/phase6_api/test_k1_instant_engine.py - K1 Instant Engine Verification.
Verifies:
  1. All 14 corridors return precomputed sweeps in under 150 ms with matching digest.
  2. "Recompute live" produces numbers 100% IDENTICAL to the precomputed ones (the honesty proof).
  3. Stored digest mismatch falls through to live computation and declares "source": "live".
"""

import time
import pytest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient

from jaal.api.app import app
from jaal.tools.tools import ALLOWED_CORRIDORS
from jaal.graph.client import get_graph_client, compute_content_digest

EXPECTED_CONTENT_DIGEST = "455712e82d224a2590060fd35d83abb4acb6cfafd633b12d275aa43337cd013a"

@pytest.fixture(scope="module")
def api_client():
    return TestClient(app)

def test_k1_all_14_corridors_precomputed_under_150ms(api_client):
    """
    K1-01: Every one of the 14 corridors returns precomputed in < 150ms.
    """
    # Warmup client
    first_cid = sorted(ALLOWED_CORRIDORS)[0]
    api_client.get(f"/api/scenario/{first_cid}")

    latencies = {}
    for cid in sorted(ALLOWED_CORRIDORS):
        t0 = time.perf_counter()
        res = api_client.get(f"/api/scenario/{cid}")
        lat_ms = (time.perf_counter() - t0) * 1000
        assert res.status_code == 200, f"Failed for {cid}: {res.text}"
        payload = res.json()
        assert payload.get("source") == "precomputed", f"{cid} source was {payload.get('source')}"
        assert payload.get("digest") == EXPECTED_CONTENT_DIGEST
        assert len(payload.get("cases", [])) == 13
        assert lat_ms < 150.0, f"{cid} latency {lat_ms:.1f}ms exceeded 150ms"
        latencies[cid] = lat_ms

    assert len(latencies) == 14

def test_k1_recompute_live_equality_proof(api_client):
    """
    K1-02 (Honesty Proof): Recompute live produces numbers IDENTICAL to precomputed.
    """
    cid = "road_ring_monastery_chandgiram"

    # Precomputed
    res_pre = api_client.get(f"/api/scenario/{cid}")
    assert res_pre.status_code == 200
    pre = res_pre.json()
    assert pre.get("source") == "precomputed"

    # Live
    res_live = api_client.get(f"/api/scenario/{cid}?live=true")
    assert res_live.status_code == 200
    live = res_live.json()
    assert live.get("source") == "live"
    assert "elapsed_ms" in live

    # 1. Decomposition identity
    assert pre["decomposition"] == live["decomposition"]

    # 2. Policies identity
    for pol_key in ["A", "B", "C"]:
        p_pre = pre["policies"][pol_key]
        p_live = live["policies"][pol_key]
        assert p_pre["exposed_count"] == p_live["exposed_count"]
        assert p_pre["total_breaches"] == p_live["total_breaches"]
        assert p_pre["cost"] == p_live["cost"]
        if pol_key == "C":
            assert p_pre.get("abstain") == p_live.get("abstain")

    # 3. Cases identity
    assert len(pre["cases"]) == len(live["cases"]) == 13
    for c_pre, c_live in zip(pre["cases"], live["cases"]):
        assert c_pre["case_id"] == c_live["case_id"]
        assert c_pre["verdict"] == c_live["verdict"]
        assert c_pre["breaches_a"] == c_live["breaches_a"]
        assert c_pre["breaches_c"] == c_live["breaches_c"]
        assert c_pre["interaction_only"] == c_live["interaction_only"]

    # 4. Recommendation identity
    assert pre["recommendation"]["verdict"] == live["recommendation"]["verdict"]
    assert pre["recommendation"]["abstain"] == live["recommendation"]["abstain"]
    assert pre["recommendation"]["exposed_count"] == live["recommendation"]["exposed_count"]

def test_k1_digest_mismatch_falls_through_to_live(api_client):
    """
    K1-03: When live digest mismatches the stored digest, response falls through to live.
    """
    cid = "road_ring_kashmere_monastery"

    # Mock compute_content_digest to return a different digest (simulating world mutation)
    with patch("jaal.api.app.compute_content_digest", return_value=("mutated_world_digest_999999", 50, 60)):
        res = api_client.get(f"/api/scenario/{cid}")
        assert res.status_code == 200
        data = res.json()
        assert data.get("source") == "live", f"Expected live fallback, got {data.get('source')}"
        assert data.get("digest") == "mutated_world_digest_999999"
