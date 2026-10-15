# KNOWN_ISSUES.md — Jaal Pre-Mortem Known Issues & Verification Ledger
**Initial Creation**: Kickoff Phase 1 (2026-10-14)  
**Status**: ACTIVE SUBMISSION LEDGER  

---

## 1. Kickoff Rule & Platform Re-check (Step 2)
- Re-checked `https://www.wemakedevs.org/hackathons/falkordb` and `/rules`, `/schedule`, `/resources`.
- **Verdict**: Rules 1–18 remain identical to documented values in Section 2.
- No discrepancy affecting scope, eligibility, or required submission contents.

---

## 2. Engine & Procedure Availability Observations (SM-04)
- **`algo.SPpaths`**: Procedure is present in engine and executes successfully with Node objects as parameters (`MATCH (a), (b) CALL algo.SPpaths({sourceNode: a, ...})`).
- **`algo.betweenness`**: Procedure is present and returns betweenness centrality scores.
- **`algo.pageRank`**: Procedure is present (`algo.pageRank('Node', 'ROAD_ARC')`).
- **`algo.AStar`**: Confirmed **ABSENT** (`Unknown function 'algo.AStar'`), adhering strictly to Section 9 pre-decision to exclude A*.
- **Parameter Bound in Traversal**: In Cypher variable-length matches, parameters for depth (e.g. `*1..$depth`) raise `Encountered unhandled type in inlined properties`. All variable-length query patterns must use inline integer literals (e.g. `*1..12`) generated from `frozen_config.json` with startup assertions.

---

## 3. Data Snapping Disclosures (DV-06)
- In `citygraph/backend/data/delhi/infrastructure.geojson`, `wtp_wazirabad` is 3.53 km from any modeled intersection.
- Per Section 10.3, it is rendered with explicit status `EXCLUDED — no modelled road access within 1 km` to avoid fabricating artificial adjacency.
- Facilities with 1.0–1.5 km offsets carry `is_assumed=true` on their `ACCESS_VIA` relationships.
