"""
tests/phase9_demo/test_report_facts.py — Verifies scripts/report_facts.py.
Asserts the script runs and its output counts match the canonical graph:
13 intersections, 10 facilities, 14 corridors.
"""
import sys
import subprocess
from pathlib import Path
import pytest

root_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "src"))

from scripts.report_facts import get_report_facts, print_canonical_markdown

def test_report_facts_counts():
    """Assert live system facts match canonical counts: 13 intersections, 10 facilities, 14 corridors."""
    facts = get_report_facts()
    counts = facts["counts"]

    assert counts["intersections"] == 13, f"Expected 13 intersections, got {counts['intersections']}"
    assert counts["facilities"] == 10, f"Expected 10 facilities, got {counts['facilities']}"
    assert counts["corridors"] == 14, f"Expected 14 corridors, got {counts['corridors']}"
    assert counts["power_feeders"] == 7, f"Expected 7 power feeders, got {counts['power_feeders']}"
    assert counts["towers"] == 8, f"Expected 8 towers, got {counts['towers']}"
    assert counts["relays"] == 12, f"Expected 12 relays, got {counts['relays']}"

    d = facts["decomposition"]
    assert d["f1_alone"] == 104
    assert d["f2_alone"] == 48
    assert d["unstressed"] == 30
    assert d["interaction_only"] == 0
    assert d["total"] == 182

    # Markdown format prints cleanly without error
    md = print_canonical_markdown(facts)
    assert "Intersections: 13" in md
    assert "Facilities: 10" in md
    assert "Corridors: 14" in md
    assert "104" in md and "48" in md and "30" in md and "0" in md
