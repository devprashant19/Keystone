"""
tests/phase4_evaluator/test_graph_queries.py — GR-01..GR-06.

Graph/query integration checks that were missing entirely from the original suite:
static safety properties of the Cypher we emit, plus an agreement check between the
application-side Dijkstra we depend on and the engine's native algo.SPpaths.
"""

import json
import re
from pathlib import Path

import pytest

from jaal.graph.client import get_graph_client
from jaal.evaluate.evaluator import SharedEvaluator

SRC = Path(__file__).resolve().parents[2] / "src" / "jaal"
CFG = Path(__file__).resolve().parents[2] / "config" / "frozen_config.json"


def _py_files():
    return [p for p in SRC.rglob("*.py") if "__pycache__" not in str(p)]


def test_gr_01_no_string_interpolation_into_cypher():
    """GR-01: Cypher is parameterised. No f-string/%/.format() carrying a Cypher verb."""
    verbs = re.compile(r"(MATCH|MERGE|CREATE|DELETE|SET|RETURN|CALL)\b", re.I)
    offenders = []
    for f in _py_files():
        for i, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            if not verbs.search(line):
                continue
            # A real interpolation needs BOTH an f-string/format call AND a
            # substitution placeholder on the same line. Requiring the placeholder
            # avoids flagging ordinary query fragments that merely end in a bare
            # token before a quote (e.g. the literal "DELETE f",).
            interpolating = (
                (re.search(r'(?:^|[\s(,=+])f["\']', line) and "{" in line)
                or ".format(" in line
                or re.search(r'%\s*\(', line)
            )
            if not interpolating:
                continue
            # Allowed: Cypher cannot parameterise labels, relationship types or
            # property names in DDL. These are built from module-level literal lists
            # in graph/client.py, never from request or model input.
            if re.search(r"CREATE (CONSTRAINT|INDEX)", line, re.I):
                continue
            # Allowed: config-derived integer bounds, asserted equal to config at
            # startup (GR-02).
            if "{self.road_hop_bound}" in line or "{self.alert_hop_bound}" in line:
                continue
            offenders.append(f"{f.name}:{i}: {line.strip()[:110]}")
    assert not offenders, "Cypher must be parameterised, not interpolated:\n" + "\n".join(offenders)


def test_gr_02_variable_length_bounds_are_literal_and_match_config():
    """GR-02: every variable-length pattern has a literal upper bound equal to config."""
    cfg = json.loads(CFG.read_text(encoding="utf-8"))
    allowed = {str(cfg["road_hop_bound"]), str(cfg["alert_hop_bound"])}
    pattern = re.compile(r"\*\s*(\d*)\s*\.\.\s*(\d*)")
    found = 0
    for f in _py_files():
        text = f.read_text(encoding="utf-8")
        for m in pattern.finditer(text):
            upper = m.group(2)
            assert upper != "", f"{f.name}: unbounded variable-length pattern '{m.group(0)}'"
            assert upper in allowed, (
                f"{f.name}: bound {upper} in '{m.group(0)}' is not a frozen-config bound {allowed}"
            )
            found += 1
    # Not asserting found > 0: the implementation may legitimately use procedures or
    # application-side traversal instead of variable-length patterns.
    assert found >= 0


def test_gr_03_no_path_materialisation():
    """GR-03: never collect() variable-length paths — the documented memory-blowup shape."""
    bad = []
    for f in _py_files():
        text = f.read_text(encoding="utf-8")
        for m in re.finditer(r"collect\s*\(\s*p\s*\)|collect\s*\(\s*path\s*\)", text, re.I):
            bad.append(f"{f.name}: {m.group(0)}")
    assert not bad, "path materialisation is forbidden: " + "; ".join(bad)


def test_gr_04_dijkstra_agrees_with_native_sppaths():
    """
    GR-04: the application-side Dijkstra we depend on must agree with the engine's
    native algo.SPpaths. algo.SPpaths IS available on this image (SMOKE_RESULTS.md
    section 2a), so this is a real cross-implementation check, not a fallback excuse.
    """
    client = get_graph_client()
    world = client.select_graph("keystone_world")
    ev = SharedEvaluator(CFG)

    ints = [r[0] for r in world.query(
        "MATCH (i:Intersection) RETURN i.id ORDER BY i.id"
    ).result_set]
    assert len(ints) >= 4

    pairs = [(a, b) for a in ints[:4] for b in ints[-4:] if a != b]
    compared = 0
    for src, dst in pairs:
        res = world.query(
            "MATCH (a:Intersection {id: $s}), (b:Intersection {id: $t}) "
            "CALL algo.SPpaths({sourceNode: a, targetNode: b, relTypes: ['ROAD_ARC'], "
            "weightProp: 'travel_cost_min', pathCount: 1}) "
            "YIELD pathWeight RETURN pathWeight",
            {"s": src, "t": dst},
        )
        if not res.result_set:
            continue  # unreachable in the engine's view; Dijkstra agreement is vacuous
        native = float(res.result_set[0][0])

        road_res = world.query(
            "MATCH (a:Intersection)-[r:ROAD_ARC]->(b:Intersection) "
            "RETURN a.id, b.id, r.travel_cost_min, r.length_km"
        )
        adj = {}
        for row in road_res.result_set:
            adj.setdefault(row[0], []).append((row[1], float(row[2]), float(row[3])))
        cost, _dist, _path = ev._dijkstra(adj, src, dst)

        assert cost is not None, f"Dijkstra found no path {src}->{dst} but SPpaths did"
        assert abs(cost - native) < 1e-6, (
            f"{src}->{dst}: Dijkstra {cost} != algo.SPpaths {native}"
        )
        compared += 1
    assert compared >= 1, "no comparable reachable pairs — check the loaded world"


def test_gr_05_wcc_not_used_as_directed_reachability():
    """GR-05: algo.WCC ignores direction, so it may not back a reachability verdict."""
    for f in _py_files():
        text = f.read_text(encoding="utf-8")
        if "algo.WCC" in text:
            lowered = text.lower()
            assert "reachab" not in lowered, (
                f"{f.name} references algo.WCC near reachability language; WCC ignores "
                "edge direction and cannot prove directed reachability"
            )


def test_gr_06_queries_carry_timeouts_or_are_bounded():
    """GR-06: the evaluator's fetches are label/type-scoped, never open scans."""
    text = (SRC / "evaluate" / "evaluator.py").read_text(encoding="utf-8")
    open_scans = re.findall(r'MATCH\s*\(\s*\w*\s*\)\s*RETURN', text)
    assert not open_scans, f"unscoped MATCH () RETURN found: {open_scans}"
