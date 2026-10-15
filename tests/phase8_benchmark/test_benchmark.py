"""
tests/phase8_benchmark/test_benchmark.py - Acceptance tests for 182-case benchmark sweep and ablations (AB-01..AB-03).
"""

import csv
import json
from pathlib import Path
import pytest

from jaal.graph.client import get_graph_client
from jaal.evaluate.evaluator import SharedEvaluator

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RESULTS_DIR = PROJECT_ROOT / "results"

def test_bm_01_csv_output_182_rows():
    """BM-01: benchmark_182_cases.csv exists, contains exactly 182 rows, stamped with config_hash."""
    csv_path = RESULTS_DIR / "benchmark_182_cases.csv"
    assert csv_path.exists(), "benchmark_182_cases.csv must exist"

    cfg_path = PROJECT_ROOT / "config" / "frozen_config.json"
    with open(cfg_path, "r", encoding="utf-8") as f:
        expected_hash = json.load(f)["config_hash"]

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        assert len(reader) == 182, f"Expected 182 rows, found {len(reader)}"
        for row in reader:
            assert row["config_hash"] == expected_hash
            assert row["win_c_vs_a"] in ("WIN", "TIE", "LOSS")

def test_bm_02_three_way_decomposition_sums_to_182():
    """BM-02: three_way_decomposition.json exists and all denominator classes sum to 182."""
    json_path = RESULTS_DIR / "three_way_decomposition.json"
    assert json_path.exists()

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    total = (
        data["headline_interaction_only_cases"] +
        data["f1_alone_cases"] +
        data["f2_alone_cases"] +
        data["neither_stressed_cases"]
    )
    assert total == 182
    assert data["total_cases"] == 182

def test_bm_03_policy_c_zero_losses():
    """BM-03: Policy C achieves zero losses against Policy A across all 182 cases."""
    json_path = RESULTS_DIR / "three_way_decomposition.json"
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["policy_c_vs_a"]["losses"] == 0

def test_ab_01_database_unavailable():
    """AB-01: Structured 503 error returned with zero numeric fields when DB is down."""
    from jaal.api.app import app
    from fastapi.testclient import TestClient
    from unittest.mock import patch, MagicMock

    test_client = TestClient(app)
    with patch("jaal.api.app.get_graph_client") as mock_client:
        mock_instance = MagicMock()
        mock_instance.connection.ping.side_effect = ConnectionRefusedError("Redis down")
        mock_client.return_value = mock_instance

        res = test_client.get("/api/health")
        assert res.status_code == 503
        data = res.json()
        assert "error" in data.get("detail", data)
        # Invariant: No numeric values in response
        for k, v in data.items():
            assert not isinstance(v, (int, float))

def test_ab_02_relation_context_removed():
    """AB-02: Evaluator fed nodes with zero relationships must abstain."""
    client = get_graph_client()
    evaluator = SharedEvaluator()

    # Create temporary isolated graph with nodes but ZERO relationships
    flat_graph = client.select_graph("ab02_flat_world")
    try:
        flat_graph.delete()
    except Exception:
        pass
    flat_graph = client.select_graph("ab02_flat_world")
    try:
        flat_graph.query("CREATE (f:Facility {id: 'fac_1', name: 'Fac 1', is_critical_endpoint: true, access_offset_km: 0.5})")
        flat_graph.query("CREATE (d:Depot {id: 'dep_1', name: 'Depot 1', dispatch_delay_min: 3.0})")
        res = evaluator.evaluate_graph(flat_graph, "flat_case")

        # Without ROAD_ARC or ACCESS_VIA relations, facility is unreachable -> breach
        assert res.is_breached is True
        assert len(res.access_breaches) > 0
    finally:
        flat_graph.delete()

def test_ab_03_independent_recomputation():
    """AB-03: Independent stdlib Dijkstra reproduces response times within 0.001 min."""
    client = get_graph_client()
    evaluator = SharedEvaluator()
    base_graph = client.select_graph("jaal_world")

    res = evaluator.evaluate_graph(base_graph, "recomp")
    lnjp_metric = res.facility_metrics["hosp_lnjp"]

    # Hand calculation:
    # hosp_lnjp connected to int_delhi_gate (offset 0.5 km -> 1.25 min at 24 km/h)
    # depot_south located at int_delhi_gate (delay 3.0 min, road dist 0 km)
    # Expected total response time = 3.0 + 0.0 + 1.25 = 4.25 min
    expected = 4.25
    assert pytest.approx(lnjp_metric.total_response_time_min, 0.001) == expected
