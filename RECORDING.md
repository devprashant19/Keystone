# KEYSTONE Pre-Mortem: Demonstration Recording Guide

> **Operator Master Document**: This document is the definitive, standalone filming and walkthrough manual for the KEYSTONE Pre-Mortem Command Deck. It is designed so that anyone can execute, narrate, and verify the entire presentation without reference to external documentation.

---

## 1. Pre-Flight Checklist

Perform each step in order before beginning a recording take:

1. **Verify FalkorDB Docker Container**:
   ```bash
   docker ps
   ```
   *Expected output*: Container `jaal_falkordb` is `Up` and listening on port `0.0.0.0:6379->6379/tcp`.
2. **Seed Deterministic Demo Fixtures**:
   ```bash
   python scripts/seed_demo.py
   ```
   *Expected output*: Prints the `============================== DEMO READY ==============================` banner.
   *Record the Canonical Content Digest*: `455712e82d224a2590060fd35d83abb4acb6cfafd633b12d275aa43337cd013a`.
3. **Start the API Server and Frontend Web Application**:
   - Backend terminal:
     ```bash
     .\.venv\Scripts\uvicorn.exe jaal.api.app:app --host 127.0.0.1 --port 8000
     ```
   - Frontend terminal:
     ```bash
     cd web && npm run dev
     ```
4. **Hard-Reload and Verify State Freshness**:
   - Open Chrome at `http://localhost:5173/?landing=1` or `http://localhost:5173/`.
   - Perform a hard reload (`Ctrl+F5` / `Cmd+Shift+R`).
   - Confirm **NO** "results stale" or "DATABASE UNAVAILABLE" warning banner is displayed.
5. **Verify Action Write-Gating**:
   - Navigate to Command Deck (`/deck`).
   - Select any corridor from `#corridor-select`.
   - Confirm `APPROVE PLAN` (`#approve-action-btn`) is **DISABLED** and `REJECT PLAN` (`#reject-action-btn`) is **ENABLED**.
   - *This is correct, not a fault.* At the frozen 6.8 km threshold no candidate action keeps every
     critical facility inside its deadline on **any** of the 14 corridors, so KEYSTONE abstains on all
     14 and gates approval off system-wide. Verified 2026-10-17: `recommendation.abstain = true` for
     all 14 precomputed scenarios. Do not describe APPROVE as available, and do not wait for it to
     turn green -- it will not. The commander's live path in this build is REJECT / logged
     concurrence, which still writes the decision and its rationale into `keystone_memory`.
6. **Set Up Recording Environment**:
   - Navigate back to the Landing page (`http://localhost:5173/`).
   - Close all other browser tabs, developer tools, and side panels.
   - Hide the bookmarks bar (`Ctrl+Shift+B` / `Cmd+Shift+B`).
   - Mute all operating system and messaging notifications.
   - Lock browser viewport to **exactly 1440 × 900**.

---

## 2. Canonical System Numbers

Quote these authoritative figures verbatim from `scripts/report_facts.py`; do not estimate from memory:

| System Metric | Canonical Truth | Description / Source |
| :--- | :--- | :--- |
| **Corridors** | **14** | Primary arterial road corridors in Central/North Delhi |
| **Intersections** | **13** | Road junctions from OpenStreetMap Delhi arterial topology |
| **Facilities** | **10** | Critical hospitals, water treatment plants, and drainage regulators |
| **Power Feeders** | **7** | Grid distribution feeders carried along road corridors |
| **Telecom Towers** | **8** | Cellular microwave towers distributing emergency triage alerts |
| **Relay Hubs** | **12** | Local microwave relay contact nodes covering hospitals |
| **Total Cases** | **182** | 14 primary sweeps × 13 secondary failure branches |
| **Decomposition** | **104 / 48 / 30 / 0** | 104 $f_1$-alone / 48 $f_2$-alone / 30 unstressed / **0 interaction-only** |
| **Content Digest** | `455712e8...` | `455712e82d224a2590060fd35d83abb4acb6cfafd633b12d275aa43337cd013a` |
| **Config Hash** | `ed468a59` | `ed468a59c67aa8a84f23dc7f71caecb0e6e2e5f8fd0cac3491b2070306eeaa35` |
| **Database Engine** | **FalkorDB 6.0.2** | Graph database running on Redis protocol with `GRAPH.COPY` support |

---

## 3. Things Never to Say

| Forbidden Phrase | Why It Is Prohibited | Replacement Truth |
| :--- | :--- | :--- |
| *"predict"* / *"forecast"* | KEYSTONE does not make statistical or weather predictions. | *"evaluate"*, *"explore counterfactual branches"* |
| *"probability"* / *"risk score"* | KEYSTONE operates on deterministic SLA thresholds, not arbitrary floats. | *"SLA margin"*, *"critical access boundary"*, *"reachability"* |
| *"real-time"* | Real-time implies live telemetry feeds; KEYSTONE runs pre-mortems. | *"precomputed"*, *"no loading step"*, *"deterministic"* |
| *"sub-10 milliseconds"* | No measurement in this repo supports it. Measured: scenario fetch 235-280 ms, `GRAPH.COPY` 114-286 ms, frame-time p95 17.8 ms. | *"precomputed and digest-validated, so there is no loading step"* |
| *"novel"* / *"first"* | Unverifiable marketing hype. | *"graph-native"*, *"branch-isolated"*, *"grounded in OpenStreetMap"* |
| *"validated"* | Claims of external emergency validation cannot be verified. | *"formally checked"*, *"asserted by verification tests"* |

---

## 4. The Seven Beats

> **For filming, use [](DEMO_SCRIPT.md).** It is the shot-by-shot script:
> ten beats with timecodes, exact clicks, verbatim narration, per-beat fallbacks, and a map
> from each beat to the Track 01 judging criteria. It adds the agent tool-selection beat,
> which the seven-beat table below does not cover. The table here remains as the condensed
> reference.

| Beat & Timecode | Exact Clicks in Order | Verbatim Narration | What Should Appear on Screen | Fallback / Contingency |
| :--- | :--- | :--- | :--- | :--- |
| **Beat 1: Landing Dashboard & Live Counters**<br>`0:00 - 0:25` | 1. Open `http://localhost:5173/`<br>2. Hover `#card-cross-layer`<br>3. Hover `#card-counterfactual`<br>4. Hover `#card-scientific-honesty` | *"This is KEYSTONE. In urban disasters, first infrastructure failures don't cause collapse on their own—it is the unexpected second failure thirty minutes later that severs critical hospital corridors. KEYSTONE evaluates every combinatorial secondary contingency on isolated FalkorDB graph copies."* | Landing page fills 1440x900 viewport without scrollbar. Three live counters pull from API (14 Corridors, 182 Cases, 60/100 Graph Topology). Bottom provenance strip shows FalkorDB 6.0.2 and Digest. | If counters show `—`, verify `:8000/api/world/summary` is reachable. If scrollbar appears, verify viewport is 1440x900. |
| **Beat 2: The Breakthrough — One-Click Pre-Mortem**<br>`0:25 - 0:50` | 1. Click `💥 BREAK SOMETHING ▸` (`#break-something-btn`) | *"With a single click, KEYSTONE takes an observed road failure—here, Ring Road between Monastery and Chandgiram Akhara—and evaluates all thirteen second-failure contingencies across road, power, and telecom layers."* | Instant transition to Command Deck (`/deck`). Golden scenario loads immediately. Blast Radius panel highlights 1 severed road and 1 severed feeder (`pf_chandrawal`). Read the power/alert counts off the screen; do not quote them from this document. | If golden scenario does not load, select `road_ring_monastery_chandgiram` from `#corridor-select`. |
| **Beat 3: Precomputed Scenario Sweeping**<br>`0:50 - 1:20` | 1. Select `Barakhamba Road` in `#corridor-select`<br>2. Select `Vikas Marg (ITO Crossing)`<br>3. Reselect `Ring Road (Monastery to Chandgiram)` | *"Because all fourteen primary corridor sweeps are precomputed and validated against immutable graph digests, scenario switching has no loading step. Incident commanders can pivot between contingencies without waiting on a recompute."* | Instant switching across scenarios. Case list, blast radius concentric bands, and policy recommendations update instantly without UI flicker. | If scenario load stalls, click `#recompute-live-btn` to force an in-memory recalculation. |
| **Beat 4: Blast Radius Concentric Cascade**<br>`1:20 - 1:50` | 1. Click `#blast-center-core`<br>2. Click `#blast-band-road`<br>3. Click `#blast-band-power`<br>4. Click `#blast-band-alert`<br>5. Hover `#blast-hero-metric` | *"Disasters do not respect domain silos. When this corridor floods, the road surface is severed. But because power feeders run along the same right-of-way, the power feeder carried along that same right-of-way drops, darkening the towers it feeds and cascading to the relays covering those hospitals."* | Concentric visual bands respond to clicks with ripple animations, updating the layer breakdown. Metric delta bar displays critical facility survival. | If blast bands do not animate, confirm reduced-motion toggle (`#reduced-motion-toggle`) is OFF. |
| **Beat 5: Cross-Layer Causal Evidence Chain**<br>`1:50 - 2:20` | 1. Click `Inspect Causal Proof ▸`<br>2. Hover dependency nodes<br>3. Click `Back to Command Deck` | *"KEYSTONE does not produce black-box scores. Every recommendation links directly to an unbroken graph traversal proof: from flooded road corridor to severed feeder, to dark tower, to unreached relay, to breached hospital response time."* | Navigates to `/evidence/...`. The step-by-step dependency chain is rendered with explicit hop counts, latencies, and data origins. Returns cleanly to `/deck`. | If evidence page fails to load, click `#open-evidence-btn` on the Command Deck right rail. |
| **Beat 6: Policy Comparison & Honest Null Result**<br>`2:20 - 2:50` | 1. Hover `#toggle-policy-table`<br>2. Scroll down to `#null-result-panel` | *"We compare three policies under the exact same evaluator: Policy A does nothing; Policy B uses static degree-centrality; Policy C evaluates pre-mortem contingencies on FalkorDB branches. Notice the null finding: exactly zero interaction-only cases at our pre-registered 6.8 kilometre threshold. Policy C does not dominate Policy B here, and we report that rather than hiding it. When single failures explain the breaches, KEYSTONE reports that honestly rather than inventing phantom interactions."* | Policy table shows exposed second failures out of 182: Policy A 13 / 182, Policy B 13 / 182, Policy C 7 / 182. Policy C abstains on this scenario. The Null Result panel is clearly visible and legible. | If null result panel is below the fold, scroll the right rail container smoothly into view. |
| **Beat 7: Abstention & Human Commander Decision**<br>`2:50 - 3:30` | 1. Select `road_ring_kashmere_monastery` in `#corridor-select`<br>2. Scroll right rail to `#decision-action-block`<br>3. Click `REJECT PLAN` (`#reject-action-btn`)<br>4. Fill `#rationale-input`: `Verified unresolvable secondary contingency risk across 13 failure branches; logged concurrence into graph memory.`<br>5. Click `Confirm REJECT`<br>6. Click `#provenance-badge` to finish on `/method` | *"When no action can prevent all breaches, KEYSTONE refuses to guess. It triggers an explicit abstention with a machine-readable reason code: NO_PLAN_PRESERVES_ALL_CRITICAL_REQUIREMENTS. The commander cannot approve a plan that fails, so the recorded decision here is a logged concurrence with the abstention -- written, with its rationale, into immutable graph memory. The decision is permanently recorded in FalkorDB."* | Right rail shows red warning banner: `ABSTAIN — NO ROBUST PLAN`. `APPROVE PLAN` is disabled. Decision modal opens, accepts rationale, and records decision into `keystone_memory`. `/method` page loads to conclude. | If modal does not close, click `#decision-cancel-btn` and verify `:8000/api/health` is green. |

---

## 5. Mid-Session Recovery

If the application state becomes desynchronized during rehearsal or filming:

1. **Clean Reset**:
   ```bash
   python scripts/reset_demo.py
   ```
   *Action*: Sweeps lingering orphan scenario branches, wipes `keystone_memory`, and reloads pristine `keystone_world`.
2. **Re-Seed Demo Cache**:
   ```bash
   python scripts/seed_demo.py
   ```
   *Action*: Re-populates `data/demo_cache` and sets golden run and abstention run baseline in FalkorDB.
3. **Restart API Server**:
   Terminate the running uvicorn process (`Ctrl+C`) and relaunch:
   ```bash
   .\.venv\Scripts\uvicorn.exe jaal.api.app:app --host 127.0.0.1 --port 8000
   ```
4. **Hard-Reload Browser**:
   Refresh Chrome (`Ctrl+F5`) to clear browser state and reload the pristine landing page.

---

## 6. Naming Audit

Comprehensive audit of remaining occurrences of the legacy project identifier (`jaal` / `Jaal`):

| Category | Count | Video (1) | Live App (2) | README (3) | Source (4) | Details & Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Judge-visible UI** | **0** | No | No | No | No | 100% migrated to KEYSTONE across all headers, cards, deck, modals, and method views. |
| **README** | **3** | No | No | **Yes** | **Yes** | Technical references to Python class `JaalAgent`, uvicorn command `uvicorn jaal.api.app:app`, and MCP server path `src/jaal/agent/mcp_server.py`. |
| **API responses** | **0** | No | No | No | No | All JSON responses return neutral, canonical entity fields (`keystone_world`, `run_id`, etc.). |
| **Graph keys** | **0** | No | No | No | No | 100% migrated to `keystone_world`, `keystone_memory`, `keystone_branch_{run}_{case}`. |
| **Python package path** | **1** | No | No | **Yes** | **Yes** | Package namespace is `src/jaal` (17 internal modules). Preserved per explicit instructions: *DO NOT rename the Python package*. |
| **Docker container** | **1** | No | No | **Yes** | **Yes** | Docker container named `jaal_falkordb` listening on port 6379. |
| **Repo directory** | **1** | No | No | No | **Yes** | Root folder `Jaal_PreMortem` as cloned from git. |
| **Code comments** | **22** | No | No | No | **Yes** | Internal file header docstrings in `src/jaal/` (20) and legacy encoding comments in `web/src/` (2). |
| **localStorage keys** | **1** | No | No | No | **Yes** | Internal key `'jaal_reduced_motion'` in `web/src/motion/useReducedMotion.ts` (3 references). Invisible to user. |

---

*Verified against live FalkorDB instance and codebase. Content Digest: `455712e82d224a2590060fd35d83abb4acb6cfafd633b12d275aa43337cd013a`.*
