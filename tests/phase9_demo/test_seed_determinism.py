"""
tests/phase9_demo/test_seed_determinism.py — Verification of deterministic seeded demo harness.
Runs seed_demo twice and asserts the content digest, run ids, and decomposition are identical both times.
"""

import sys
from pathlib import Path
import pytest

root_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "src"))

from scripts.seed_demo import seed_demo

def test_seed_demo_determinism():
    """Run seed_demo twice, assert content digest, run ids and decomposition are identical both times."""
    result1 = seed_demo()
    result2 = seed_demo()

    assert result1["content_digest"] == result2["content_digest"], (
        f"Content digest drifted: {result1['content_digest']} != {result2['content_digest']}"
    )
    assert result1["golden_run_id"] == result2["golden_run_id"] == "run_golden_demo"
    assert result1["abstain_run_id"] == result2["abstain_run_id"] == "run_abstain_demo"
    assert result1["decomposition"] == result2["decomposition"] == "104/48/30/0"
    assert result1["config_hash"] == result2["config_hash"]
    assert result1["engine_version"] == result2["engine_version"]
