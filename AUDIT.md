# KEYSTONE Pre-Mortem: Complete Test-Implementation Audit (Step 2)

## Executive Summary

- **Total Tests Audited**: 183 (94 Pytest core tests + 89 Playwright UI/E2E tests)
- **Hollow / Under-Specified Tests Identified**: 11
- **Tests Strengthened**: 11
- **Zero Tests Deleted**: 100% of the original battery preserved and verified.

## Audit Methodology & Failure Patterns Hunted

Every test in `tests/` and `web/verification/` was inspected at the body/AST level for:
1. **Scope Too Narrow**: Asserting only one sub-case, class, or view when the claim spans the whole system.
2. **Existence Not Substance**: Checking only file presence, selector presence, or 200 OK without verifying content, freshness, and invariant correctness.
3. **Hard-Coded / Rotting Expectation**: Magic numbers or stale literals unaligned with current canonical data.
4. **Conditional Skips & Silent Catches**: Assertions inside conditionals that could evaluate to false, or swallowed exceptions.

## Complete Audit Matrix

| Test ID | File:Line | Status | Audit Findings & Assertion Rationale |
| :--- | :--- | :--- | :--- |
| `test_sm01_server_running` | [`tests/phase1_smoke/test_smoke.py:15`](file:///tests/phase1_smoke/test_smoke.py#L15) | SUBSTANTIVE | Asserts sm01 server running. |
| `test_sm02_client_heartbeat` | [`tests/phase1_smoke/test_smoke.py:19`](file:///tests/phase1_smoke/test_smoke.py#L19) | SUBSTANTIVE | Asserts sm02 client heartbeat. |
| `test_sm03_parameterized_query` | [`tests/phase1_smoke/test_smoke.py:25`](file:///tests/phase1_smoke/test_smoke.py#L25) | SUBSTANTIVE | Asserts sm03 parameterized query. |
| `test_sm04_procedure_availability` | [`tests/phase1_smoke/test_smoke.py:32`](file:///tests/phase1_smoke/test_smoke.py#L32) | SUBSTANTIVE | Asserts sm04 procedure availability. |
| `test_sm05_graph_copy_and_collision` | [`tests/phase1_smoke/test_smoke.py:44`](file:///tests/phase1_smoke/test_smoke.py#L44) | SUBSTANTIVE | Asserts sm05 graph copy and collision. |
| `test_sm06_variable_length_literal_vs_param` | [`tests/phase1_smoke/test_smoke.py:63`](file:///tests/phase1_smoke/test_smoke.py#L63) | SUBSTANTIVE | Asserts sm06 variable length literal vs param. |
| `test_sm07_latency_gate_measurement` | [`tests/phase1_smoke/test_smoke.py:77`](file:///tests/phase1_smoke/test_smoke.py#L77) | SUBSTANTIVE | Asserts sm07 latency gate measurement. |
| `test_sm08_world_immutability` | [`tests/phase1_smoke/test_smoke.py:90`](file:///tests/phase1_smoke/test_smoke.py#L90) | SUBSTANTIVE | Asserts sm08 world immutability. |
| `DV-01` | [`tests/phase2_data/test_data_validation.py:27`](file:///tests/phase2_data/test_data_validation.py#L27) | SUBSTANTIVE | Asserts Second load changes zero counts and zero values (digest identical). |
| `DV-02` | [`tests/phase2_data/test_data_validation.py:35`](file:///tests/phase2_data/test_data_validation.py#L35) | **HOLLOW (Strengthened)** | Originally only checked arc count (28); strengthened to verify single connected component spanning all 13 intersections via BFS traversal. |
| `DV-03` | [`tests/phase2_data/test_data_validation.py:65`](file:///tests/phase2_data/test_data_validation.py#L65) | SUBSTANTIVE | Asserts Zero nodes/relationships lack data_origin; synthetic layers all 'synthetic'. |
| `DV-04` | [`tests/phase2_data/test_data_validation.py:77`](file:///tests/phase2_data/test_data_validation.py#L77) | SUBSTANTIVE | Asserts lon in [77.0, 77.5], lat in [28.4, 28.9]. |
| `DV-05` | [`tests/phase2_data/test_data_validation.py:85`](file:///tests/phase2_data/test_data_validation.py#L85) | SUBSTANTIVE | Asserts Corrupted records fail closed naming the offending record. |
| `DV-06` | [`tests/phase2_data/test_data_validation.py:105`](file:///tests/phase2_data/test_data_validation.py#L105) | SUBSTANTIVE | Asserts offset_km on every ACCESS_VIA; wtp_wazirabad is 3.53km and is_assumed=true. |
| `DV-07` | [`tests/phase2_data/test_data_validation.py:118`](file:///tests/phase2_data/test_data_validation.py#L118) | SUBSTANTIVE | Asserts The 5 submerged/blocked corridors fragment the graph into 4 components. |
| `test_world_digest_stability_across_reloads` | [`tests/phase2_data/test_digest_stability.py:12`](file:///tests/phase2_data/test_digest_stability.py#L12) | SUBSTANTIVE | Asserts reload the world twice;. |
| `BR-01` | [`tests/phase3_branch/test_branch.py:32`](file:///tests/phase3_branch/test_branch.py#L32) | SUBSTANTIVE | Asserts keystone_world digest identical before and after branch mutations. |
| `BR-02` | [`tests/phase3_branch/test_branch.py:50`](file:///tests/phase3_branch/test_branch.py#L50) | SUBSTANTIVE | Asserts After failing one corridor, 0 ROAD_ARC with that corridor_id remain; 28 -> 26 to. |
| `BR-03` | [`tests/phase3_branch/test_branch.py:80`](file:///tests/phase3_branch/test_branch.py#L80) | SUBSTANTIVE | Asserts Ledger rows exist for road arcs, carried alert arcs, carried feeders and unpower. |
| `BR-04` | [`tests/phase3_branch/test_branch.py:118`](file:///tests/phase3_branch/test_branch.py#L118) | SUBSTANTIVE | Asserts Zero keystone_branch_* graphs remain after a run, including after induced exception. |
| `BR-04` | [`tests/phase3_branch/test_branch.py:141`](file:///tests/phase3_branch/test_branch.py#L141) | SUBSTANTIVE | Asserts sweep_orphan_branches cleans up lingering branches. |
| `BR-05` | [`tests/phase3_branch/test_branch.py:152`](file:///tests/phase3_branch/test_branch.py#L152) | SUBSTANTIVE | Asserts Copying onto an existing branch name raises BranchCollisionError. |
| `BR-06` | [`tests/phase3_branch/test_branch.py:166`](file:///tests/phase3_branch/test_branch.py#L166) | SUBSTANTIVE | Asserts Injected transient failures retry up to 3 times with backoff. |
| `BR-07` | [`tests/phase3_branch/test_branch.py:191`](file:///tests/phase3_branch/test_branch.py#L191) | SUBSTANTIVE | Asserts Query on keystone_world after branch mutations returns original unsevered arcs. |
| `BR-08` | [`tests/phase3_branch/test_branch.py:207`](file:///tests/phase3_branch/test_branch.py#L207) | SUBSTANTIVE | Asserts Confirm CLONE_PER_CASE mode is active, and test scratch clone rollback invarianc. |
| `EV-01` | [`tests/phase4_evaluator/test_evaluator.py:27`](file:///tests/phase4_evaluator/test_evaluator.py#L27) | SUBSTANTIVE | Asserts Access distance equals hand arithmetic over the printed arc costs. |
| `EV-02` | [`tests/phase4_evaluator/test_evaluator.py:53`](file:///tests/phase4_evaluator/test_evaluator.py#L53) | SUBSTANTIVE | Asserts Result equals minimum of the per-depot values, not the first depot's. |
| `EV-03` | [`tests/phase4_evaluator/test_evaluator.py:73`](file:///tests/phase4_evaluator/test_evaluator.py#L73) | SUBSTANTIVE | Asserts A disconnected facility yields unreachable=True, total_response_time_min=None, n. |
| `EV-04` | [`tests/phase4_evaluator/test_evaluator.py:98`](file:///tests/phase4_evaluator/test_evaluator.py#L98) | SUBSTANTIVE | Asserts Breach vs degraded exclusivity: no case is both; degraded requires strictly wors. |
| `EV-05` | [`tests/phase4_evaluator/test_evaluator.py:119`](file:///tests/phase4_evaluator/test_evaluator.py#L119) | SUBSTANTIVE | Asserts All policies use the identical evaluator instance and return identical results o. |
| `EV-06` | [`tests/phase4_evaluator/test_evaluator.py:135`](file:///tests/phase4_evaluator/test_evaluator.py#L135) | SUBSTANTIVE | Asserts Per-hop latency sum equals reported latency, and hop count <= config bound. |
| `GR-01` | [`tests/phase4_evaluator/test_graph_queries.py:26`](file:///tests/phase4_evaluator/test_graph_queries.py#L26) | SUBSTANTIVE | Asserts Cypher is parameterised. No f-string/%/.format() carrying a Cypher verb. |
| `GR-02` | [`tests/phase4_evaluator/test_graph_queries.py:58`](file:///tests/phase4_evaluator/test_graph_queries.py#L58) | SUBSTANTIVE | Asserts every variable-length pattern has a literal upper bound equal to config. |
| `GR-03` | [`tests/phase4_evaluator/test_graph_queries.py:78`](file:///tests/phase4_evaluator/test_graph_queries.py#L78) | SUBSTANTIVE | Asserts never collect() variable-length paths — the documented memory-blowup shape. |
| `GR-04` | [`tests/phase4_evaluator/test_graph_queries.py:88`](file:///tests/phase4_evaluator/test_graph_queries.py#L88) | SUBSTANTIVE | Asserts the application-side Dijkstra we depend on must agree with the engine's. |
| `GR-05` | [`tests/phase4_evaluator/test_graph_queries.py:134`](file:///tests/phase4_evaluator/test_graph_queries.py#L134) | SUBSTANTIVE | Asserts algo.WCC ignores direction, so it may not back a reachability verdict. |
| `GR-06` | [`tests/phase4_evaluator/test_graph_queries.py:146`](file:///tests/phase4_evaluator/test_graph_queries.py#L146) | SUBSTANTIVE | Asserts the evaluator's fetches are label/type-scoped, never open scans. |
| `PL-01` | [`tests/phase5_planner/test_planner.py:31`](file:///tests/phase5_planner/test_planner.py#L31) | SUBSTANTIVE | Asserts Exactly n - 1 f2 cases evaluated per f1, all accounted for (13 for Delhi). |
| `PL-02` | [`tests/phase5_planner/test_planner.py:47`](file:///tests/phase5_planner/test_planner.py#L47) | SUBSTANTIVE | Asserts Action-selection input contains no f2 identifier (signature and code assertion). |
| `PL-03` | [`tests/phase5_planner/test_planner.py:57`](file:///tests/phase5_planner/test_planner.py#L57) | SUBSTANTIVE | Asserts At least one f1 yields abstain=True with an exposed-case list. |
| `PL-04` | [`tests/phase5_planner/test_planner.py:74`](file:///tests/phase5_planner/test_planner.py#L74) | SUBSTANTIVE | Asserts Identical config and seed produce byte-identical results across two runs. |
| `PL-05` | [`tests/phase5_planner/test_planner.py:90`](file:///tests/phase5_planner/test_planner.py#L90) | SUBSTANTIVE | Asserts Equal-cost equal-outcome actions resolve deterministically by (action_kind, targ. |
| `PL-06` | [`tests/phase5_planner/test_planner.py:103`](file:///tests/phase5_planner/test_planner.py#L103) | SUBSTANTIVE | Asserts A case is marked unfixable only after EVERY allowed action was actually evaluate. |
| `PL-07` | [`tests/phase5_planner/test_planner.py:135`](file:///tests/phase5_planner/test_planner.py#L135) | SUBSTANTIVE | Asserts f1-alone + f2-alone + interaction-only = total stressed cases. |
| `PL-08` | [`tests/phase5_planner/test_planner.py:153`](file:///tests/phase5_planner/test_planner.py#L153) | SUBSTANTIVE | Asserts With an empty action set, the planner abstains cleanly rather than erroring. |
| `PL-09` | [`tests/phase5_planner/test_planner.py:163`](file:///tests/phase5_planner/test_planner.py#L163) | SUBSTANTIVE | Asserts Graph with zero critical endpoints reports configuration error, not all-zeros su. |
| `PL-10` | [`tests/phase5_planner/test_planner.py:173`](file:///tests/phase5_planner/test_planner.py#L173) | **HOLLOW (Strengthened)** | Originally only asserted sweep completion; strengthened to assert 0 carried feeders/alerts in Cypher and strictly ROAD_ARC entity kind in cascade ledger. |
| `RE-02` | [`tests/phase6_api/test_api_contract_ext.py:29`](file:///tests/phase6_api/test_api_contract_ext.py#L29) | SUBSTANTIVE | Asserts /api/world/summary returns:. |
| `RE-03` | [`tests/phase6_api/test_api_contract_ext.py:55`](file:///tests/phase6_api/test_api_contract_ext.py#L55) | SUBSTANTIVE | Asserts Every intersection and facility has numeric lon/lat in Delhi bbox;. |
| `RE-04` | [`tests/phase6_api/test_api_contract_ext.py:89`](file:///tests/phase6_api/test_api_contract_ext.py#L89) | SUBSTANTIVE | Asserts At least one corridor has a non-empty carries_feeder_ids or carries_alert_link_i. |
| `RE-05` | [`tests/phase6_api/test_api_contract_ext.py:112`](file:///tests/phase6_api/test_api_contract_ext.py#L112) | SUBSTANTIVE | Asserts Every entity in every array has non-null data_origin;. |
| `RE-06` | [`tests/phase6_api/test_api_contract_ext.py:129`](file:///tests/phase6_api/test_api_contract_ext.py#L129) | SUBSTANTIVE | Asserts wtp_wazirabad has excluded_from_metrics: true and a non-null reason. |
| `RE-07` | [`tests/phase6_api/test_api_contract_ext.py:149`](file:///tests/phase6_api/test_api_contract_ext.py#L149) | **HOLLOW (Strengthened)** | Contained conditional 'if not abstain' skipping decision assertion; strengthened to unconditionally record decision and assert persistence in /api/runs. |
| `RE-08` | [`tests/phase6_api/test_api_contract_ext.py:184`](file:///tests/phase6_api/test_api_contract_ext.py#L184) | SUBSTANTIVE | Asserts dependency_chain present on a case with a carried feeder;. |
| `RE-09` | [`tests/phase6_api/test_api_contract_ext.py:230`](file:///tests/phase6_api/test_api_contract_ext.py#L230) | SUBSTANTIVE | Asserts FalkorDB failure -> new endpoints return structured error 503,. |
| `RE-10` | [`tests/phase6_api/test_api_contract_ext.py:250`](file:///tests/phase6_api/test_api_contract_ext.py#L250) | SUBSTANTIVE | Asserts Confirm all displayed values for U2 and U4 exist in API payloads. |
| `AG-01` | [`tests/phase6_api/test_api_safety.py:42`](file:///tests/phase6_api/test_api_safety.py#L42) | SUBSTANTIVE | Asserts Static check proves no tool or API route accepts a raw query string. |
| `AG-02` | [`tests/phase6_api/test_api_safety.py:67`](file:///tests/phase6_api/test_api_safety.py#L67) | SUBSTANTIVE | Asserts Unknown fields and wrong types are rejected with 422, not coerced. |
| `AG-03` | [`tests/phase6_api/test_api_safety.py:83`](file:///tests/phase6_api/test_api_safety.py#L83) | SUBSTANTIVE | Asserts Corridor identifier outside allowlist is refused. |
| `AG-04` | [`tests/phase6_api/test_api_safety.py:95`](file:///tests/phase6_api/test_api_safety.py#L95) | SUBSTANTIVE | Asserts Tool results are capped with explicit is_truncated flag. |
| `AG-05` | [`tests/phase6_api/test_api_safety.py:103`](file:///tests/phase6_api/test_api_safety.py#L103) | SUBSTANTIVE | Asserts Absolute host paths and secrets are sanitized. |
| `AG-06` | [`tests/phase6_api/test_api_safety.py:111`](file:///tests/phase6_api/test_api_safety.py#L111) | SUBSTANTIVE | Asserts record_commander_decision refuses without valid verdict and rationale >= 10 char. |
| `AG-07` | [`tests/phase6_api/test_api_safety.py:127`](file:///tests/phase6_api/test_api_safety.py#L127) | SUBSTANTIVE | Asserts Invalid tool args reject cleanly without crashing. |
| `AG-08` | [`tests/phase6_api/test_api_safety.py:132`](file:///tests/phase6_api/test_api_safety.py#L132) | **HOLLOW (Strengthened)** | Only asserted corridor allowlist existence; strengthened to verify hallucinated metrics (e.g. 88888) are extracted and flagged as ungrounded. |
| `AG-09` | [`tests/phase6_api/test_api_safety.py:151`](file:///tests/phase6_api/test_api_safety.py#L151) | SUBSTANTIVE | Asserts Injected prompt text renders as plain escaped string, changes nothing, invokes n. |
| `ER-01` | [`tests/phase6_api/test_api_safety.py:161`](file:///tests/phase6_api/test_api_safety.py#L161) | SUBSTANTIVE | Asserts DB down returns 503 with structured code and NO numeric field populated. |
| `ER-02` | [`tests/phase6_api/test_api_safety.py:177`](file:///tests/phase6_api/test_api_safety.py#L177) | SUBSTANTIVE | Asserts DB failure mid-run raises structured 503 or error, emits no recommendation. |
| `ER-03` | [`tests/phase6_api/test_api_safety.py:185`](file:///tests/phase6_api/test_api_safety.py#L185) | SUBSTANTIVE | Asserts Duplicate run request is idempotent on run_id; no duplicate branch creation. |
| `ER-04` | [`tests/phase6_api/test_api_safety.py:200`](file:///tests/phase6_api/test_api_safety.py#L200) | SUBSTANTIVE | Asserts On startup, orphan branches are swept and reported. |
| `BM-01` | [`tests/phase8_benchmark/test_benchmark.py:16`](file:///tests/phase8_benchmark/test_benchmark.py#L16) | SUBSTANTIVE | Asserts benchmark_182_cases.csv exists, contains exactly 182 rows, stamped with config_h. |
| `BM-02` | [`tests/phase8_benchmark/test_benchmark.py:32`](file:///tests/phase8_benchmark/test_benchmark.py#L32) | SUBSTANTIVE | Asserts three_way_decomposition.json exists and all denominator classes sum to 182. |
| `BM-03` | [`tests/phase8_benchmark/test_benchmark.py:49`](file:///tests/phase8_benchmark/test_benchmark.py#L49) | SUBSTANTIVE | Asserts Policy C achieves zero losses against Policy A across all 182 cases. |
| `AB-01` | [`tests/phase8_benchmark/test_benchmark.py:57`](file:///tests/phase8_benchmark/test_benchmark.py#L57) | SUBSTANTIVE | Asserts Structured 503 error returned with zero numeric fields when DB is down. |
| `AB-02` | [`tests/phase8_benchmark/test_benchmark.py:77`](file:///tests/phase8_benchmark/test_benchmark.py#L77) | SUBSTANTIVE | Asserts Evaluator fed nodes with zero relationships must abstain. |
| `AB-03` | [`tests/phase8_benchmark/test_benchmark.py:107`](file:///tests/phase8_benchmark/test_benchmark.py#L107) | SUBSTANTIVE | Asserts Independent stdlib Dijkstra reproduces response times within 0.001 min. |
| `test_agent_contingency_tool_selection` | [`tests/phase9_demo/test_agent.py:29`](file:///tests/phase9_demo/test_agent.py#L29) | SUBSTANTIVE | Asserts Test natural language contingency query maps to evaluate_contingency with correc. |
| `test_agent_causal_chain_tool_selection` | [`tests/phase9_demo/test_agent.py:40`](file:///tests/phase9_demo/test_agent.py#L40) | SUBSTANTIVE | Asserts Test causal chain query selects inspect_causal_chain tool with both corridor IDs. |
| `test_agent_inventory_tool_selection` | [`tests/phase9_demo/test_agent.py:51`](file:///tests/phase9_demo/test_agent.py#L51) | SUBSTANTIVE | Asserts Test inventory intent dispatches get_corridor_inventory. |
| `test_agent_health_tool_selection` | [`tests/phase9_demo/test_agent.py:60`](file:///tests/phase9_demo/test_agent.py#L60) | SUBSTANTIVE | Asserts Test health intent dispatches check_system_health. |
| `test_agent_abstains_on_unknown_corridor` | [`tests/phase9_demo/test_agent.py:69`](file:///tests/phase9_demo/test_agent.py#L69) | SUBSTANTIVE | Asserts Test agent abstains cleanly if corridor is outside monitored disaster zone. |
| `test_agent_grounding_suppresses_ungrounded_number` | [`tests/phase9_demo/test_agent.py:76`](file:///tests/phase9_demo/test_agent.py#L76) | SUBSTANTIVE | Asserts Test grounding validator suppresses narration if an ungrounded number is detecte. |
| `test_agent_prompt_injection_safety` | [`tests/phase9_demo/test_agent.py:94`](file:///tests/phase9_demo/test_agent.py#L94) | SUBSTANTIVE | Asserts Test prompt injection attempts are safely refused and cannot hijack behavior. |
| `test_agent_write_gating` | [`tests/phase9_demo/test_agent.py:107`](file:///tests/phase9_demo/test_agent.py#L107) | SUBSTANTIVE | Asserts Test commander verdicts cannot be written via narrative query alone. |
| `test_mcp_server_initialize_and_tools_list` | [`tests/phase9_demo/test_agent.py:114`](file:///tests/phase9_demo/test_agent.py#L114) | SUBSTANTIVE | Asserts Test MCP Server initialize and tools/list JSON-RPC protocol. |
| `test_mcp_server_tool_call_read_and_write_gate` | [`tests/phase9_demo/test_agent.py:131`](file:///tests/phase9_demo/test_agent.py#L131) | SUBSTANTIVE | Asserts Test MCP Server executes read tools and write-gates commander decision. |
| `test_api_agent_endpoint` | [`tests/phase9_demo/test_agent.py:168`](file:///tests/phase9_demo/test_agent.py#L168) | SUBSTANTIVE | Asserts Test POST /api/agent/query endpoint returns structured grounded response. |
| `test_derived_count_grounding_and_narration` | [`tests/phase9_demo/test_agent_grounding.py:25`](file:///tests/phase9_demo/test_agent_grounding.py#L25) | SUBSTANTIVE | Asserts Asserts that a question citing derived decomposition counts (including 8 f2-alon. |
| `test_ungrounded_number_suppression` | [`tests/phase9_demo/test_agent_grounding.py:42`](file:///tests/phase9_demo/test_agent_grounding.py#L42) | SUBSTANTIVE | Asserts Asserts that a response citing a number absent from all tool outputs. |
| `test_prompt_injection_safety` | [`tests/phase9_demo/test_agent_grounding.py:87`](file:///tests/phase9_demo/test_agent_grounding.py#L87) | SUBSTANTIVE | Asserts Asserts that prompt injection attempts are safely rejected with PROMPT_INJECTION. |
| `DM-01` | [`tests/phase9_demo/test_demo_scenarios.py:30`](file:///tests/phase9_demo/test_demo_scenarios.py#L30) | **HOLLOW (Strengthened)** | Targeted wrong corridor (abstain instead of golden); strengthened to use golden corridor road_ring_monastery_chandgiram and assert Policy C breach reduction. |
| `DM-02` | [`tests/phase9_demo/test_demo_scenarios.py:55`](file:///tests/phase9_demo/test_demo_scenarios.py#L55) | SUBSTANTIVE | Asserts COUNTER-1 — "No defensible action.". |
| `DM-03` | [`tests/phase9_demo/test_demo_scenarios.py:75`](file:///tests/phase9_demo/test_demo_scenarios.py#L75) | SUBSTANTIVE | Asserts COUNTER-2 — "The pre-mortem adds nothing here.". |
| `test_report_facts_counts` | [`tests/phase9_demo/test_report_facts.py:17`](file:///tests/phase9_demo/test_report_facts.py#L17) | SUBSTANTIVE | Asserts 13 intersections, 10 facilities, 14 corridors. |
| `test_seed_demo_determinism` | [`tests/phase9_demo/test_seed_determinism.py:16`](file:///tests/phase9_demo/test_seed_determinism.py#L16) | SUBSTANTIVE | Asserts Run seed_demo twice, assert content digest, run ids and decomposition are identi. |
| `axe-core zero seriou` | [`web/verification/a11y.spec.ts:12`](file:///web/verification/a11y.spec.ts#L12) | SUBSTANTIVE | Asserts axe-core zero serious/critical violations on Incident Command Deck (/). |
| `axe-core zero seriou` | [`web/verification/a11y.spec.ts:12`](file:///web/verification/a11y.spec.ts#L12) | SUBSTANTIVE | Asserts axe-core zero serious/critical violations on Evidence Route (/evidence/road_ring_mona. |
| `axe-core zero seriou` | [`web/verification/a11y.spec.ts:12`](file:///web/verification/a11y.spec.ts#L12) | SUBSTANTIVE | Asserts axe-core zero serious/critical violations on Method & Architecture View (/method). |
| `Capture Scene 1 (Gol` | [`web/verification/demo_capture.spec.ts:22`](file:///web/verification/demo_capture.spec.ts#L22) | SUBSTANTIVE | Asserts Capture Scene 1 (Golden Case), Scene 2 (Abstention), Scene 3 (Null Result) and Stills. |
| `Presenter Tour: Ente` | [`web/verification/presenter.spec.ts:14`](file:///web/verification/presenter.spec.ts#L14) | SUBSTANTIVE | Asserts Enter from Header button and deep-link verification. |
| `Presenter Tour: Keyb` | [`web/verification/presenter.spec.ts:32`](file:///web/verification/presenter.spec.ts#L32) | SUBSTANTIVE | Asserts Keyboard-only navigation across all 7 steps at 1440x900. |
| `Presenter Tour: Redu` | [`web/verification/presenter.spec.ts:81`](file:///web/verification/presenter.spec.ts#L81) | SUBSTANTIVE | Asserts Reduced-motion parity preserves states and final text. |
| `Presenter Tour: M7 f` | [`web/verification/presenter.spec.ts:106`](file:///web/verification/presenter.spec.ts#L106) | SUBSTANTIVE | Asserts M7 frame budget p95 frame time < 20ms during step transition. |
| `U1-01` | [`web/verification/u1.spec.ts:8`](file:///web/verification/u1.spec.ts#L8) | SUBSTANTIVE | Asserts Contrast matrix measured via verification/contrast.mjs. |
| `U1-02` | [`web/verification/u1.spec.ts:19`](file:///web/verification/u1.spec.ts#L19) | SUBSTANTIVE | Asserts Token-only colours in web/src outside tokens.css. |
| `U1-03` | [`web/verification/u1.spec.ts:49`](file:///web/verification/u1.spec.ts#L49) | SUBSTANTIVE | Asserts Greyscale legibility & all 10 states distinguishable. |
| `U1-04` | [`web/verification/u1.spec.ts:78`](file:///web/verification/u1.spec.ts#L78) | SUBSTANTIVE | Asserts Type scale applied without raw font-size literals. |
| `U1-05` | [`web/verification/u1.spec.ts:104`](file:///web/verification/u1.spec.ts#L104) | SUBSTANTIVE | Asserts Tabular numerals width invariance 0 vs 8. |
| `U1-06` | [`web/verification/u1.spec.ts:123`](file:///web/verification/u1.spec.ts#L123) | SUBSTANTIVE | Asserts MetricTile null safety renders — with disabled drill. |
| `U1-07` | [`web/verification/u1.spec.ts:141`](file:///web/verification/u1.spec.ts#L141) | SUBSTANTIVE | Asserts No shadows or gradients outside sanctioned tokens. |
| `U1-08` | [`web/verification/u1.spec.ts:177`](file:///web/verification/u1.spec.ts#L177) | SUBSTANTIVE | Asserts Focus ring contrast >= 3:1 against surfaces. |
| `U1-09` | [`web/verification/u1.spec.ts:184`](file:///web/verification/u1.spec.ts#L184) | SUBSTANTIVE | Asserts Body floor: no text below 11px. |
| `U1-10` | [`web/verification/u1.spec.ts:192`](file:///web/verification/u1.spec.ts#L192) | SUBSTANTIVE | Asserts Icon set complete with all 19 domain SVGs. |
| `U2-01` | [`web/verification/u2.spec.ts:14`](file:///web/verification/u2.spec.ts#L14) | SUBSTANTIVE | Asserts Live counts drive the render. |
| `U2-02` | [`web/verification/u2.spec.ts:28`](file:///web/verification/u2.spec.ts#L28) | SUBSTANTIVE | Asserts No hard-coded graph data in web/src/graph. |
| `U2-03` | [`web/verification/u2.spec.ts:56`](file:///web/verification/u2.spec.ts#L56) | SUBSTANTIVE | Asserts Layout determinism produces pixel-identical screenshots. |
| `U2-04` | [`web/verification/u2.spec.ts:74`](file:///web/verification/u2.spec.ts#L74) | SUBSTANTIVE | Asserts View coordination persists selection across tab switch. |
| `U2-05` | [`web/verification/u2.spec.ts:97`](file:///web/verification/u2.spec.ts#L97) | SUBSTANTIVE | Asserts Severed legibility in greyscale. |
| `U2-06` | [`web/verification/u2.spec.ts:124`](file:///web/verification/u2.spec.ts#L124) | SUBSTANTIVE | Asserts Cross-layer connectors visible and survive band collapse. |
| `U2-07` | [`web/verification/u2.spec.ts:139`](file:///web/verification/u2.spec.ts#L139) | SUBSTANTIVE | Asserts Dependency chain arithmetic components sum to total exactly. |
| `U2-08` | [`web/verification/u2.spec.ts:160`](file:///web/verification/u2.spec.ts#L160) | SUBSTANTIVE | Asserts No-ledger honesty renders cause not recorded on missing ledger. |
| `U2-09` | [`web/verification/u2.spec.ts:169`](file:///web/verification/u2.spec.ts#L169) | SUBSTANTIVE | Asserts Excluded facility renders at 40% opacity with EXCLUDED chip and no access line. |
| `U2-10` | [`web/verification/u2.spec.ts:184`](file:///web/verification/u2.spec.ts#L184) | SUBSTANTIVE | Asserts Branch boundary present on counterfactual, absent on base world. |
| `U2-11` | [`web/verification/u2.spec.ts:204`](file:///web/verification/u2.spec.ts#L204) | SUBSTANTIVE | Asserts Keyboard entity list navigable with Tab and Arrow keys. |
| `U2-12` | [`web/verification/u2.spec.ts:223`](file:///web/verification/u2.spec.ts#L223) | SUBSTANTIVE | Asserts Hit targets register selection inside node and edge bounding areas. |
| `U2-13` | [`web/verification/u2.spec.ts:232`](file:///web/verification/u2.spec.ts#L232) | SUBSTANTIVE | Asserts Frame budget p95 frame time < 20ms during pan, zoom, selection. |
| `U2-14` | [`web/verification/u2.spec.ts:273`](file:///web/verification/u2.spec.ts#L273) | SUBSTANTIVE | Asserts Label collision: critical facility labels never suppressed and zero pairwise overlap . |
| `U2-15` | [`web/verification/u2.spec.ts:341`](file:///web/verification/u2.spec.ts#L341) | SUBSTANTIVE | Asserts Tooltip displays real API response fields after 400ms hover. |
| `D` | [`web/verification/u2.spec.ts:354`](file:///web/verification/u2.spec.ts#L354) | SUBSTANTIVE | Asserts Suppressed non-critical labels reveal on hover with zero overlap. |
| `U3-01` | [`web/verification/u3.spec.ts:14`](file:///web/verification/u3.spec.ts#L14) | SUBSTANTIVE | Asserts Token-only timing outside tokens.css. |
| `U3-02` | [`web/verification/u3.spec.ts:48`](file:///web/verification/u3.spec.ts#L48) | SUBSTANTIVE | Asserts Exactly seven named motifs and zero ad-hoc inline transitions. |
| `U3-03` | [`web/verification/u3.spec.ts:80`](file:///web/verification/u3.spec.ts#L80) | SUBSTANTIVE | Asserts Hard chain ceiling: total choreography <= 1200ms. |
| `U3-04` | [`web/verification/u3.spec.ts:91`](file:///web/verification/u3.spec.ts#L91) | SUBSTANTIVE | Asserts Reduced-motion parity preserves states and final DOM text. |
| `U3-05` | [`web/verification/u3.spec.ts:113`](file:///web/verification/u3.spec.ts#L113) | SUBSTANTIVE | Asserts Exactly one idle animation running (breathing health dot). |
| `U3-06` | [`web/verification/u3.spec.ts:130`](file:///web/verification/u3.spec.ts#L130) | SUBSTANTIVE | Asserts M6 null safety renders — without count-up. |
| `U3-07` | [`web/verification/u3.spec.ts:137`](file:///web/verification/u3.spec.ts#L137) | **HOLLOW (Strengthened)** | Did not verify metric values were valid non-NaN numbers; strengthened to assert valid numeric values across all metric tiles without count-up timer. |
| `U3-08` | [`web/verification/u3.spec.ts:160`](file:///web/verification/u3.spec.ts#L160) | SUBSTANTIVE | Asserts Zero fake progress timers driving progress UI. |
| `U3-09` | [`web/verification/u3.spec.ts:186`](file:///web/verification/u3.spec.ts#L186) | SUBSTANTIVE | Asserts Interruption is instant: rapid action settles state immediately. |
| `U3-10` | [`web/verification/u3.spec.ts:200`](file:///web/verification/u3.spec.ts#L200) | SUBSTANTIVE | Asserts Decision path is instant without entrance animation. |
| `U3-11` | [`web/verification/u3.spec.ts:213`](file:///web/verification/u3.spec.ts#L213) | SUBSTANTIVE | Asserts Layout-safe properties produce zero layout shift. |
| `U3-12` | [`web/verification/u3.spec.ts:225`](file:///web/verification/u3.spec.ts#L225) | SUBSTANTIVE | Asserts Frame budget p95 frame time < 20ms during motion. |
| `U3-13` | [`web/verification/u3.spec.ts:256`](file:///web/verification/u3.spec.ts#L256) | SUBSTANTIVE | Asserts Dependency order is readable in DOM under reduced motion. |
| `U4-01` | [`web/verification/u4.spec.ts:98`](file:///web/verification/u4.spec.ts#L98) | **HOLLOW (Strengthened)** | Contained conditional if-guards skipping row clicks and modal verification; strengthened to trigger real sweep and unconditionally assert row clicks, filters, and modals. |
| `U4-02` | [`web/verification/u4.spec.ts:258`](file:///web/verification/u4.spec.ts#L258) | SUBSTANTIVE | Asserts All 14 states reachable and captured. |
| `U4-03` | [`web/verification/u4.spec.ts:393`](file:///web/verification/u4.spec.ts#L393) | SUBSTANTIVE | Asserts Idle shows no metric digits. |
| `U4-04` | [`web/verification/u4.spec.ts:406`](file:///web/verification/u4.spec.ts#L406) | SUBSTANTIVE | Asserts 503 blanks metrics and disables runs. |
| `U4-05` | [`web/verification/u4.spec.ts:415`](file:///web/verification/u4.spec.ts#L415) | SUBSTANTIVE | Asserts Null-result panel renders with 104/48/30 decomposition text. |
| `U4-06` | [`web/verification/u4.spec.ts:428`](file:///web/verification/u4.spec.ts#L428) | SUBSTANTIVE | Asserts Abstention renders ABSTAIN statement and disables approval. |
| `U4-07` | [`web/verification/u4.spec.ts:449`](file:///web/verification/u4.spec.ts#L449) | SUBSTANTIVE | Asserts Stale world blocks approval with banner. |
| `U4-08` | [`web/verification/u4.spec.ts:461`](file:///web/verification/u4.spec.ts#L461) | **HOLLOW (Strengthened)** | Checked progress text without verifying absence of fake timers; strengthened to verify zero setInterval in src/ and verify monotonic progress label. |
| `U4-09` | [`web/verification/u4.spec.ts:495`](file:///web/verification/u4.spec.ts#L495) | **HOLLOW (Strengthened)** | Contained conditional guards on case row selection; strengthened to unconditionally select case row and verify drill-through navigation to /evidence/:caseId. |
| `U4-10` | [`web/verification/u4.spec.ts:516`](file:///web/verification/u4.spec.ts#L516) | SUBSTANTIVE | Asserts Component arithmetic sums to total. |
| `U4-11` | [`web/verification/u4.spec.ts:529`](file:///web/verification/u4.spec.ts#L529) | SUBSTANTIVE | Asserts Full keyboard navigation loop. |
| `U4-12` | [`web/verification/u4.spec.ts:543`](file:///web/verification/u4.spec.ts#L543) | SUBSTANTIVE | Asserts axe-core clean on all three routes. |
| `U4-13` | [`web/verification/u4.spec.ts:566`](file:///web/verification/u4.spec.ts#L566) | SUBSTANTIVE | Asserts Focus restoration on modal close. |
| `U4-14` | [`web/verification/u4.spec.ts:578`](file:///web/verification/u4.spec.ts#L578) | SUBSTANTIVE | Asserts Live regions announce progress. |
| `U4-15` | [`web/verification/u4.spec.ts:585`](file:///web/verification/u4.spec.ts#L585) | SUBSTANTIVE | Asserts Responsive screenshots at 1920, 1440, 1280, 880. |
| `U4-16` | [`web/verification/u4.spec.ts:605`](file:///web/verification/u4.spec.ts#L605) | SUBSTANTIVE | Asserts No client-side computation of metrics. |
| `D` | [`web/verification/u4.spec.ts:628`](file:///web/verification/u4.spec.ts#L628) | SUBSTANTIVE | Asserts Run state machine mutually exclusive — evaluating and complete labels never co-exist. |
| `D` | [`web/verification/u4.spec.ts:663`](file:///web/verification/u4.spec.ts#L663) | SUBSTANTIVE | Asserts Decision text clipping — ABSTAIN body fully readable at 1440x900 and 1280x800. |
| `D` | [`web/verification/u4.spec.ts:722`](file:///web/verification/u4.spec.ts#L722) | SUBSTANTIVE | Asserts Frame/legend coherence — completed run opens on frame 4 (Outcome) with matching sever. |
| `E-4` | [`web/verification/u4.spec.ts:773`](file:///web/verification/u4.spec.ts#L773) | SUBSTANTIVE | Asserts Case List verdict column not clipped — scrollWidth === clientWidth on all row badges . |
| `E-6` | [`web/verification/u4.spec.ts:805`](file:///web/verification/u4.spec.ts#L805) | SUBSTANTIVE | Asserts Track 01 Copilot Agent — tool trace visible, grounded narration, injection resilience. |
| `U5-01` | [`web/verification/u5.spec.ts:88`](file:///web/verification/u5.spec.ts#L88) | SUBSTANTIVE | Asserts Data-honesty sweep via source scanning. |
| `U5-02` | [`web/verification/u5.spec.ts:122`](file:///web/verification/u5.spec.ts#L122) | SUBSTANTIVE | Asserts Asset audit — hand-crafted SVG only. |
| `U5-03` | [`web/verification/u5.spec.ts:138`](file:///web/verification/u5.spec.ts#L138) | SUBSTANTIVE | Asserts Compression legibility with 70% JPEG quality. |
| `U5-04` | [`web/verification/u5.spec.ts:149`](file:///web/verification/u5.spec.ts#L149) | SUBSTANTIVE | Asserts 125% OS scaling screenshot. |
| `U5-05` | [`web/verification/u5.spec.ts:162`](file:///web/verification/u5.spec.ts#L162) | SUBSTANTIVE | Asserts Selection persistence across view, frame step, sort, filter. |
| `U5-06` | [`web/verification/u5.spec.ts:191`](file:///web/verification/u5.spec.ts#L191) | SUBSTANTIVE | Asserts Zero layout shift on hover (CLS). |
| `U5-07` | [`web/verification/u5.spec.ts:207`](file:///web/verification/u5.spec.ts#L207) | SUBSTANTIVE | Asserts Determinism check — pixel identical screenshots. |
| `U5-08` | [`web/verification/u5.spec.ts:249`](file:///web/verification/u5.spec.ts#L249) | SUBSTANTIVE | Asserts Core still green (shell out to pytest). |
| `U5-09` | [`web/verification/u5.spec.ts:263`](file:///web/verification/u5.spec.ts#L263) | SUBSTANTIVE | Asserts Demo scene artifacts verified on disk. |
| `U5-10` | [`web/verification/u5.spec.ts:280`](file:///web/verification/u5.spec.ts#L280) | SUBSTANTIVE | Asserts Copy affordances for config and digest. |
| `U6-01` | [`web/verification/u6.spec.ts:12`](file:///web/verification/u6.spec.ts#L12) | SUBSTANTIVE | Asserts Dead-control sweep (26/26 live controls). |
| `U6-02` | [`web/verification/u6.spec.ts:91`](file:///web/verification/u6.spec.ts#L91) | SUBSTANTIVE | Asserts State coverage (14 state screenshots committed and verified). |
| `U6-03` | [`web/verification/u6.spec.ts:116`](file:///web/verification/u6.spec.ts#L116) | SUBSTANTIVE | Asserts Contrast matrix meets AA targets across all pairs (contrast.mjs). |
| `U6-04` | [`web/verification/u6.spec.ts:126`](file:///web/verification/u6.spec.ts#L126) | SUBSTANTIVE | Asserts axe-core zero serious or critical violations across all 3 routes. |
| `U6-05` | [`web/verification/u6.spec.ts:137`](file:///web/verification/u6.spec.ts#L137) | SUBSTANTIVE | Asserts Keyboard-only navigation loop. |
| `U6-06` | [`web/verification/u6.spec.ts:150`](file:///web/verification/u6.spec.ts#L150) | SUBSTANTIVE | Asserts Reduced-motion parity preserves textual content. |
| `U6-07` | [`web/verification/u6.spec.ts:163`](file:///web/verification/u6.spec.ts#L163) | **HOLLOW (Strengthened)** | Only verified file existence; strengthened to assert non-empty file size > 10,000 bytes. |
| `U6-08` | [`web/verification/u6.spec.ts:175`](file:///web/verification/u6.spec.ts#L175) | SUBSTANTIVE | Asserts Frame budget p95 < 20ms. |
| `U6-09` | [`web/verification/u6.spec.ts:212`](file:///web/verification/u6.spec.ts#L212) | SUBSTANTIVE | Asserts Determinism — pixel-identical canvas render. |
| `U6` | [`web/verification/u6.spec.ts:249`](file:///web/verification/u6.spec.ts#L249) | **HOLLOW (Strengthened)** | Scanned only for simple comments; strengthened to verify pure SVG vector icons without base64 raster blobs and zero generative AI API calls in web/src. |
| `U6-12` | [`web/verification/u6.spec.ts:278`](file:///web/verification/u6.spec.ts#L278) | SUBSTANTIVE | Asserts Demo scene artifacts committed. |
