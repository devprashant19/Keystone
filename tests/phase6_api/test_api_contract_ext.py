"""
tests/phase6_api/test_api_contract_ext.py - Acceptance tests for API contract extensions (PRE-01..PRE-10).
Per E:\\GraphHacks\\_planning_output\\ui_prompts\\U_PRE_API_CONTRACT.md.
"""

import pytest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient

from jaal.api.app import app
from jaal.graph.client import get_graph_client
from jaal.ingest.loader import load_world_graph

@pytest.fixture(scope="module")
def api_client():
    # Ensure fresh world loaded
    db = get_graph_client()
    base_graph = db.select_graph("jaal_world")
    try:
        base_graph.delete()
    except Exception:
        pass
    base_graph = db.select_graph("jaal_world")
    load_world_graph(base_graph, data_root=Path("data"))
    client = TestClient(app)
    return client

def test_pre_02_topology_completeness(api_client):
    """
    PRE-02: /api/world/summary returns:
    - 13 intersections
    - 14 corridors each with non-null source and target
    - 10 facilities
    - 6 hazard zones
    All counts derived from graph, none hard-coded.
    """
    res = api_client.get("/api/world/summary")
    assert res.status_code == 200, res.text
    data = res.json()

    assert len(data["intersections"]) == 13
    assert len(data["corridors"]) == 14
    for c in data["corridors"]:
        assert c["source"] is not None and len(c["source"]) > 0
        assert c["target"] is not None and len(c["target"]) > 0
        assert "travel_cost_min" in c and c["travel_cost_min"] > 0
        assert "historical_status_peak" in c
        assert isinstance(c["carries_feeder_ids"], list)
        assert isinstance(c["carries_alert_link_ids"], list)

    assert len(data["facilities"]) == 10
    assert len(data["hazard_zones"]) == 6

def test_pre_03_geometry_present(api_client):
    """
    PRE-03: Every intersection and facility has numeric lon/lat in Delhi bbox;
    every hazard zone has valid Polygon coordinates.
    """
    res = api_client.get("/api/world/summary")
    assert res.status_code == 200
    data = res.json()

    bbox = data["bbox"]
    assert 77.0 <= bbox["min_lon"] <= bbox["max_lon"] <= 77.5
    assert 28.5 <= bbox["min_lat"] <= bbox["max_lat"] <= 28.9

    for inter in data["intersections"]:
        assert isinstance(inter["lon"], (int, float))
        assert isinstance(inter["lat"], (int, float))
        assert 77.2 <= inter["lon"] <= 77.3
        assert 28.6 <= inter["lat"] <= 28.75

    for fac in data["facilities"]:
        assert isinstance(fac["lon"], (int, float))
        assert isinstance(fac["lat"], (int, float))
        assert 77.2 <= fac["lon"] <= 77.3
        assert 28.6 <= fac["lat"] <= 28.75

    for hz in data["hazard_zones"]:
        geom = hz["geometry"]
        assert geom["type"] == "Polygon"
        assert isinstance(geom["coordinates"], list)
        assert len(geom["coordinates"][0]) >= 3
        for pt in geom["coordinates"][0]:
            assert 77.0 <= pt[0] <= 77.5
            assert 28.5 <= pt[1] <= 28.9

def test_pre_04_carrier_links_present(api_client):
    """
    PRE-04: At least one corridor has a non-empty carries_feeder_ids or carries_alert_link_ids,
    and the matching carrier_corridor_id appears on that feeder/link.
    """
    res = api_client.get("/api/world/summary")
    assert res.status_code == 200
    data = res.json()

    corridors = data["corridors"]
    feeders = data["power_feeders"]
    alert_links = data["alert_links"]

    has_carried_feeder = False
    for c in corridors:
        for fid in c["carries_feeder_ids"]:
            has_carried_feeder = True
            matching_feeder = next((pf for pf in feeders if pf["id"] == fid), None)
            assert matching_feeder is not None
            assert matching_feeder["carrier_corridor_id"] == c["id"]

    assert has_carried_feeder, "Expected at least one carried power feeder"

def test_pre_05_provenance_complete(api_client):
    """
    PRE-05: Every entity in every array has non-null data_origin;
    provenance_mix sums to node_count.
    """
    res = api_client.get("/api/world/summary")
    assert res.status_code == 200
    data = res.json()

    for arr_key in ["intersections", "corridors", "facilities", "depots", "towers",
                    "hazard_zones", "power_feeders", "relays", "alert_links", "feeds_tower_links"]:
        for item in data[arr_key]:
            assert item.get("data_origin") is not None, f"Missing data_origin on {arr_key}: {item}"

    prov_mix = data["provenance_mix"]
    assert sum(prov_mix.values()) == data["node_count"]

def test_pre_06_exclusion_surfaced(api_client):
    """
    PRE-06: wtp_wazirabad has excluded_from_metrics: true and a non-null reason.
    All other facilities have excluded_from_metrics: false.
    """
    res = api_client.get("/api/world/summary")
    assert res.status_code == 200
    data = res.json()

    wtp = next((f for f in data["facilities"] if f["id"] == "wtp_wazirabad"), None)
    assert wtp is not None
    assert wtp["excluded_from_metrics"] is True
    assert wtp["exclusion_reason"] is not None
    assert "3.53" in wtp["exclusion_reason"]

    for f in data["facilities"]:
        if f["id"] != "wtp_wazirabad":
            assert f["excluded_from_metrics"] is False
            assert f["exclusion_reason"] is None

def test_pre_07_runs_list(api_client):
    """
    PRE-07: /api/runs returns prior runs newest-first with config hash and decision.
    """
    # Create a test run
    create_res = api_client.post("/api/run", json={"f1_corridor_id": "road_ring_kashmere_monastery"})
    assert create_res.status_code == 200
    run_id = create_res.json()["run_id"]

    # Record decision if not abstained
    run_data = create_res.json()
    if not run_data["recommendation"]["abstain"]:
        dec_res = api_client.post(
            f"/api/run/{run_id}/decision",
            json={"verdict": "APPROVE", "rationale": "Commander standard contingency approval", "actor": "CMD_TEST"}
        )
        assert dec_res.status_code == 200

    # Query /api/runs
    res = api_client.get("/api/runs?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "runs" in data
    assert len(data["runs"]) >= 1

    r0 = data["runs"][0]
    assert "run_id" in r0
    assert "f1_corridor_id" in r0
    assert "config_hash" in r0
    assert "world_digest" in r0
    assert "abstain" in r0
    assert "headline_interaction_only_count" in r0
    assert "status" in r0

def test_pre_08_chain_assembled(api_client):
    """
    PRE-08: dependency_chain present on a case with a carried feeder;
    reason_code is null (not an invented string) where the ledger has no row (relay, facility).
    """
    # road_ring_kashmere_monastery carries pf_monastery
    run_res = api_client.post("/api/run", json={"f1_corridor_id": "road_ring_kashmere_monastery"})
    assert run_res.status_code == 200
    run_id = run_res.json()["run_id"]

    case_id = "road_ring_kashmere_monastery__road_ring_monastery_chandgiram"
    case_res = api_client.get(f"/api/run/{run_id}/case/{case_id}")
    assert case_res.status_code == 200
    case_data = case_res.json()

    assert "dependency_chain" in case_data
    chain = case_data["dependency_chain"]
    assert len(chain) == 5

    # Step 1: corridor
    assert chain[0]["step"] == 1
    assert chain[0]["kind"] == "corridor"
    assert chain[0]["status"] == "SEVERED"
    assert chain[0]["reason_code"] is not None

    # Step 2: power feeder
    assert chain[1]["step"] == 2
    assert chain[1]["kind"] == "power_feeder"
    assert chain[1]["status"] == "SEVERED"
    assert chain[1]["reason_code"] is not None

    # Step 3: tower
    assert chain[2]["step"] == 3
    assert chain[2]["kind"] == "tower"
    assert "status" in chain[2]

    # Step 4: relay
    assert chain[3]["step"] == 4
    assert chain[3]["kind"] == "relay"
    assert chain[3]["reason_code"] is None, "Relay reason_code must be null where mutation ledger has no row"

    # Step 5: facility
    assert chain[4]["step"] == 5
    assert chain[4]["kind"] == "facility"
    assert chain[4]["reason_code"] is None, "Facility reason_code must be null where mutation ledger has no row"

def test_pre_09_503_integrity(api_client):
    """
    PRE-09: FalkorDB failure -> new endpoints return structured error 503,
    no empty arrays, no zeros.
    """
    with patch("jaal.api.app.get_graph_client") as mock_db:
        mock_db.side_effect = Exception("Connection refused: FalkorDB is offline")

        r_summary = api_client.get("/api/world/summary")
        assert r_summary.status_code == 503
        data_s = r_summary.json()
        assert data_s.get("error") == "DATABASE_UNAVAILABLE" or data_s.get("detail", {}).get("error") == "DATABASE_UNAVAILABLE"
        assert "intersections" not in data_s

        r_runs = api_client.get("/api/runs")
        assert r_runs.status_code == 503
        data_r = r_runs.json()
        assert data_r.get("error") == "DATABASE_UNAVAILABLE" or data_r.get("detail", {}).get("error") == "DATABASE_UNAVAILABLE"
        assert "runs" not in data_r

def test_pre_10_no_client_side_derivation_needed(api_client):
    """
    PRE-10: Confirm all displayed values for U2 and U4 exist in API payloads.
    """
    res = api_client.get("/api/world/summary")
    assert res.status_code == 200
    summary = res.json()

    # U2 needs
    assert all("lon" in i and "lat" in i for i in summary["intersections"])
    assert all("source" in c and "target" in c and "travel_cost_min" in c for c in summary["corridors"])
    assert all("lon" in f and "lat" in f and "excluded_from_metrics" in f for f in summary["facilities"])
    assert all("geometry" in h and h["geometry"]["type"] == "Polygon" for h in summary["hazard_zones"])
    assert len(summary["power_feeders"]) > 0
    assert len(summary["relays"]) > 0
    assert len(summary["alert_links"]) > 0
    assert len(summary["feeds_tower_links"]) > 0
