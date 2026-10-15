
## PHASE 1 — Phase 1 - Smoke Battery (Runtime Proof)
STATUS: PASS
AT: 2026-10-14T00:38 IST
RAN: pytest tests\phase1_smoke -q
OUTPUT: 8 passed in 0.32s
ELAPSED: 1.18s
RECOVERY APPLIED: —
NEXT: PHASE 2


## PHASE 2 — Phase 2 - World in the Graph (Data Loader & Provenance)
STATUS: FAILED
AT: 2026-10-14T00:40 IST
RAN: pytest tests\phase2_data -q
OUTPUT: 1 error in 0.25s
ELAPSED: 1.10s
RECOVERY APPLIED: —
NEXT: RETRY_OR_RECOVERY


## PHASE 2 — Phase 2 - World in the Graph (Data Loader & Provenance)
STATUS: FAILED
AT: 2026-10-14T00:42 IST
RAN: pytest tests\phase2_data -q
OUTPUT: 1 passed, 6 errors in 0.79s
ELAPSED: 2.25s
RECOVERY APPLIED: —
NEXT: RETRY_OR_RECOVERY


## PHASE 2 — Phase 2 - World in the Graph (Data Loader & Provenance)
STATUS: PASS
AT: 2026-10-14T00:44 IST
RAN: pytest tests\phase2_data -q
OUTPUT: 7 passed in 0.85s
ELAPSED: 1.64s
RECOVERY APPLIED: —
NEXT: PHASE 3


## PHASE 3 — Phase 3 - Branch and Cascade (Scenario Isolation)
STATUS: FAILED
AT: 2026-10-14T00:46 IST
RAN: pytest tests\phase3_branch -q
OUTPUT: 1 error in 1.21s
ELAPSED: 2.75s
RECOVERY APPLIED: —
NEXT: RETRY_OR_RECOVERY


## PHASE 3 — Phase 3 - Branch and Cascade (Scenario Isolation)
STATUS: PASS
AT: 2026-10-14T00:46 IST
RAN: pytest tests\phase3_branch -q
OUTPUT: 8 passed in 0.87s
ELAPSED: 1.70s
RECOVERY APPLIED: —
NEXT: PHASE 4


## PHASE 4 — Phase 4 - The Shared Evaluator (Access & Alert Metrics)
STATUS: PASS
AT: 2026-10-14T00:48 IST
RAN: pytest tests\phase4_evaluator -q
OUTPUT: 6 passed in 0.57s
ELAPSED: 1.44s
RECOVERY APPLIED: —
NEXT: PHASE 5


## PHASE 5 — Phase 5 - Conditional N-1 and Policies (Pre-Mortem Planner)
STATUS: FAILED
AT: 2026-10-14T00:50 IST
RAN: pytest tests\phase5_planner -q
OUTPUT: 4 failed, 6 passed in 10.02s
ELAPSED: 10.78s
RECOVERY APPLIED: —
NEXT: RETRY_OR_RECOVERY


## PHASE 5 — Phase 5 - Conditional N-1 and Policies (Pre-Mortem Planner)
STATUS: FAILED
AT: 2026-10-14T00:51 IST
RAN: pytest tests\phase5_planner -q
OUTPUT: 1 failed, 9 passed in 24.25s
ELAPSED: 25.13s
RECOVERY APPLIED: —
NEXT: RETRY_OR_RECOVERY


## PHASE 5 — Phase 5 - Conditional N-1 and Policies (Pre-Mortem Planner)
STATUS: PASS
AT: 2026-10-14T00:52 IST
RAN: pytest tests\phase5_planner -q
OUTPUT: 10 passed in 24.54s
ELAPSED: 25.25s
RECOVERY APPLIED: —
NEXT: PHASE 6


## PHASE 6 — Phase 6 - API and Four Typed Tools
STATUS: FAILED
AT: 2026-10-14T00:55 IST
RAN: pytest tests\phase6_api -q
OUTPUT: 1 failed, 12 passed, 1 warning in 15.23s
ELAPSED: 16.73s
RECOVERY APPLIED: —
NEXT: RETRY_OR_RECOVERY


## PHASE 6 — Phase 6 - API and Four Typed Tools
STATUS: PASS
AT: 2026-10-14T00:55 IST
RAN: pytest tests\phase6_api -q
OUTPUT: 13 passed, 1 warning in 7.72s
ELAPSED: 8.54s
RECOVERY APPLIED: —
NEXT: PHASE 7


## PHASE 7 — Phase 7 - UI Command Deck & Evidence
STATUS: FAILED
AT: 2026-10-14T01:03 IST
RAN: pytest tests\phase7_ui -q
OUTPUT: 1 failed, 6 passed in 0.14s
ELAPSED: 1.27s
RECOVERY APPLIED: —
NEXT: RETRY_OR_RECOVERY


## PHASE 7 — Phase 7 - UI Command Deck & Evidence
STATUS: PASS
AT: 2026-10-14T01:03 IST
RAN: pytest tests\phase7_ui -q
OUTPUT: 7 passed in 0.04s
ELAPSED: 0.69s
RECOVERY APPLIED: —
NEXT: PHASE 8


## PHASE 8 — Phase 8 - Benchmark Sweep & Ablations
STATUS: FAILED
AT: 2026-10-14T01:06 IST
RAN: pytest tests\phase8_benchmark -q
OUTPUT: 1 failed, 5 passed, 1 warning in 2.47s
ELAPSED: 3.21s
RECOVERY APPLIED: —
NEXT: RETRY_OR_RECOVERY


## PHASE 8 — Phase 8 - Benchmark Sweep & Ablations
STATUS: PASS
AT: 2026-10-14T01:07 IST
RAN: pytest tests\phase8_benchmark -q
OUTPUT: 6 passed, 1 warning in 0.70s
ELAPSED: 1.41s
RECOVERY APPLIED: —
NEXT: PHASE 9

