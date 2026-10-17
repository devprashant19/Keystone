# KEYSTONE Pre-Mortem Benchmark Results

**Config Hash:** `ed468a59c67aa8a84f23dc7f71caecb0e6e2e5f8fd0cac3491b2070306eeaa35`  
**World Digest:** `c25e00a5983d883a3de8a4ec7206b3e27cec1bf65718a637d1441a13cb8ffe1f`  
**FalkorDB Image:** `falkordb/falkordb:6.0.2@sha256:107455e862a824e45e8e9f5a7fbfdf5e00a08b14e13eae2577c72fd9e3f59ba6`  
**Execution Timestamp:** 2026-10-14T15:44:42Z  
**Sweep Runtime:** 253.37s across 182 ordered cases.

---

## 1. Primary Denominators (Published BEFORE Policy Comparison)

Per Section 10.1 of the build plan and pre-registration guidelines, all 182 ordered scenario cases are decomposed into three mutually exclusive categories:

| Denominator Category | Case Count | Share of Total | Methodological Meaning |
|---|---|---|---|
| **Interaction-Only (HEADLINE)** | **0** | **0.0%** | **Neither corridor breaches alone; breach occurs jointly. The only region where pre-mortem foresight changes action.** |
| f1-alone breaches | 104 | 57.1% | Breaches occurring from primary failure alone. Unavoidable by any secondary policy. |
| f2-alone breaches | 48 | 26.4% | Breaches occurring from second failure alone regardless of f1. |
| Neither stressed | 30 | 16.5% | System preserves SLAs across both disruptions without action. |
| **Total Ordered Pairs** | **182** | **100.0%** | **14 physical corridors × 13 secondary candidates.** |

*Note: the frozen allowance is derived from an urban response-target band (20 min total) and a deliberately pessimistic 24 km/h monsoon arterial speed, recorded before any policy existed. The full sweep below reports every threshold so no single value carries the claim.*

---

## 2. Policy Performance Comparison

| Policy | Budget | Heuristic / Method | Wins vs A | Ties vs A | Losses vs A | Wins vs B | Ties vs B | Losses vs B |
|---|---|---|---|---|---|---|---|---|
| **Policy A** (No Action) | 0 | Baseline passive response | — | — | — | — | — | — |
| **Policy B** (Static Heuristic) | 1 action | Static intersection degree centrality | 60 | 122 | 0 | — | — | — |
| **Policy C** (Pre-Mortem) | 1 action | Conditional N-1 across FalkorDB branches | **103** | **79** | **0** | **43** | **127** | **12** |

Losses are reported, not assumed to be zero: Policy C records 0 losses against A and 12 against B. Policy B's row is measured independently against A.

**Read the wins against the denominators above.** A win in an `f1`-alone or `f2`-alone case shows only that acting beats not acting; it does not demonstrate that conditioning on the second failure helped. Only the interaction-only region isolates the pre-mortem contribution.

---

## 3. Effective Travel Allowance Sweep (km)

Computed across **every** first failure at each threshold (not a single sampled corridor):

| Allowance (km) | Deadline (min) | Frozen? | Ordered Cases | **Interaction-Only** | f1-Alone | f2-Alone | Neither |
|---|---|---|---|---|---|---|---|
| 4.0 km | 13.0 min | No | 182 | **0** | 182 | 0 | 0 |
| 5.0 km | 15.5 min | No | 182 | **0** | 182 | 0 | 0 |
| 6.0 km | 18.0 min | No | 182 | **0** | 104 | 48 | 30 |
| 6.8 km | 20.0 min | **YES (FROZEN)** | 182 | **0** | 104 | 48 | 30 |
| 7.0 km | 20.5 min | No | 182 | **0** | 104 | 48 | 30 |
| 8.0 km | 23.0 min | No | 182 | **12** | 65 | 45 | 60 |
| 9.0 km | 25.5 min | No | 182 | **8** | 65 | 45 | 64 |
| 10.0 km | 28.0 min | No | 182 | **8** | 65 | 45 | 64 |
| 12.0 km | 33.0 min | No | 182 | **8** | 65 | 45 | 64 |

---

## 4. Ablations (Rule 3 Substantive Evidence)

### AB-01: Database Unavailable
- **Condition:** FalkorDB daemon stopped or port blocked.
- **Observed:** Structured `503 Service Unavailable` returned with error code `DATABASE_UNAVAILABLE`. Zero numeric metrics populated in payload.

### AB-02: Relation Context Removed (Graph Necessity Proof)
- **Condition:** Given corridors and facilities as flat attribute tables with graph edge traversals removed.
- **Observed:** Evaluator returns `abstained = true` with reason `NO_RELATION_CONTEXT_CANNOT_EVALUATE_ACCESS`, and emits **no** breach verdicts (`access_breaches = []`, `total_breaches = 0`). Multi-hop road routing and alert backhaul chains cannot be evaluated without relationship context, so the evaluator declines to answer rather than asserting a verdict. Verified by `tests/phase8_benchmark/test_benchmark.py::test_ab_02_relation_context_removed`.

### AB-03: Independent Recomputation Cross-Check
- **Condition:** Standard Python Dijkstra implementation executed on raw exported edge list.
- **Observed:** Response times and route sequences agree with FalkorDB procedure queries within 0.001 min. Zero arithmetic drift detected.
