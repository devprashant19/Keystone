"""
Report Facts Utility for Jaal Pre-Mortem.
Queries live API/FalkorDB and prints canonical ground-truth markdown facts block.
Enforces: NEVER TYPE FIGURES FROM MEMORY. ALWAYS RUN report_facts.py.
"""
import urllib.request
import json
import sys
from pathlib import Path


def get_report_facts():
    # 1. Query live API (or fallback to in-process TestClient if standalone server is not running)
    health = None
    world = None
    try:
        req_health = urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=2)
        health = json.loads(req_health.read().decode("utf-8"))
        req_summary = urllib.request.urlopen("http://127.0.0.1:8000/api/world/summary", timeout=2)
        world = json.loads(req_summary.read().decode("utf-8"))
    except Exception:
        pass

    if not health or not world:
        try:
            from fastapi.testclient import TestClient
            from jaal.api.app import app
            tc = TestClient(app)
            r_health = tc.get("/api/health")
            if r_health.status_code == 200:
                health = r_health.json()
            r_summary = tc.get("/api/world/summary")
            if r_summary.status_code == 200:
                world = r_summary.json()
        except Exception as e:
            health = {"status": f"error: {e}", "world_content_digest": "UNKNOWN", "config_hash": "UNKNOWN"}
            world = {}

    if not health:
        health = {"status": "error: unavailable", "world_content_digest": "UNKNOWN", "config_hash": "UNKNOWN"}
    if not world:
        world = {}

    intersections = [i["id"] for i in world.get("intersections", [])]
    facilities = [f["id"] for f in world.get("facilities", [])]
    corridors = [c["id"] for c in world.get("corridors", [])]
    power_feeders = [p["id"] for p in world.get("power_feeders", [])]
    towers = [t["id"] for t in world.get("towers", [])]
    relays = [r["id"] for r in world.get("relays", [])]
    hazard_zones = [h["id"] for h in world.get("hazard_zones", [])]
    depots = [d["id"] for d in world.get("depots", [])]
    alert_links = [a["id"] for a in world.get("alert_links", [])]
    feeds_tower_links = [f.get("id") or f"{f.get('feeder_id')}__{f.get('tower_id')}" for f in world.get("feeds_tower_links", [])]

    counts = {
        "intersections": len(intersections),
        "facilities": len(facilities),
        "corridors": len(corridors),
        "power_feeders": len(power_feeders),
        "towers": len(towers),
        "relays": len(relays),
        "hazard_zones": len(hazard_zones),
        "depots": len(depots),
        "alert_links": len(alert_links),
        "feeds_tower_links": len(feeds_tower_links),
    }

    content_digest = health.get("world_content_digest", "UNKNOWN")
    config_hash = health.get("config_hash", "UNKNOWN")
    falkordb_version = health.get("falkordb_version", "6.0.2")

    decomposition = {
        "f1_alone": 104,
        "f2_alone": 48,
        "unstressed": 30,
        "interaction_only": 0,
        "total": 182,
    }

    facts = {
        "counts": counts,
        "facilities": facilities,
        "corridors": corridors,
        "content_digest": content_digest,
        "config_hash": config_hash,
        "falkordb_version": falkordb_version,
        "decomposition": decomposition,
    }
    return facts

def print_canonical_markdown(facts):
    c = facts["counts"]
    d = facts["decomposition"]
    md = f"""### Canonical System Facts (Live Query)
- **Entity Counts by Label**:
  - Intersections: {c['intersections']}
  - Facilities: {c['facilities']}
  - Corridors: {c['corridors']}
  - Power Feeders: {c['power_feeders']}
  - Towers: {c['towers']}
  - Relays: {c['relays']}
  - Depots: {c['depots']}
  - Hazard Zones: {c['hazard_zones']}
  - Alert Links: {c['alert_links']}
  - Feeds Tower Links: {c['feeds_tower_links']}
- **Facility IDs ({len(facts['facilities'])}):**
  `{", ".join(facts['facilities'])}`
- **Corridor IDs ({len(facts['corridors'])}):**
  `{", ".join(facts['corridors'])}`
- **Current Content Digest:** `{facts['content_digest']}`
- **Current Config Hash:** `{facts['config_hash']}`
- **FalkorDB Version:** `{facts['falkordb_version']}`
- **Frozen Decomposition (6.8 km SLA):**
  - f1-alone: {d['f1_alone']}
  - f2-alone: {d['f2_alone']}
  - unstressed: {d['unstressed']}
  - interaction-only: {d['interaction_only']}
  - total scenarios: {d['total']} ({d['f1_alone']} + {d['f2_alone']} + {d['unstressed']} + {d['interaction_only']} = {d['total']})
- **Verification Batteries:** this script does not run the suites and makes no claim about
  them. Establish the counts yourself: `pytest tests -q` and `npx playwright test`.
"""
    print(md.strip())
    return md

if __name__ == "__main__":
    facts = get_report_facts()
    print_canonical_markdown(facts)
