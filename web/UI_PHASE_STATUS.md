# Jaal Pre-Mortem — UI Verification & Phase Ledger

## Pre-Flight Status
STATUS: PASS
AT: 2026-10-14T14:24:45Z
CHECKS:
  1. Docker FalkorDB: jaal_falkordb Up 0.0.0.0:6379->6379/tcp (falkordb/falkordb:6.0.2) ✓
  2. Core pytest suite: 68 passed, 1 warning in 27.70s ✓
  3. API live endpoint: GET /api/world/summary returns 39 nodes, 49 edges (digest a53cff3708e...) ✓
  4. Playwright & axe-core installed, chromium browser ready, web/verification/ initialized ✓

---

## U1 — Design system
STATUS: PASS
AT: 2026-10-14T14:41:55Z
RAN: npx playwright test verification/u1.spec.ts
OUTPUT:
```text
Running 10 tests using 1 worker

  ok  1 [chromium] › verification\u1.spec.ts:8:3 › U1 — Design System Verification Battery › U1-01: Contrast matrix measured via verification/contrast.mjs (133ms)
  ok  2 [chromium] › verification\u1.spec.ts:19:3 › U1 — Design System Verification Battery › U1-02: Token-only colours in web/src outside tokens.css (10ms)
  ok  3 [chromium] › verification\u1.spec.ts:49:3 › U1 — Design System Verification Battery › U1-03: Greyscale legibility & all 10 states distinguishable (4.2s)
  ok  4 [chromium] › verification\u1.spec.ts:78:3 › U1 — Design System Verification Battery › U1-04: Type scale applied without raw font-size literals (8ms)
  ok  5 [chromium] › verification\u1.spec.ts:104:3 › U1 — Design System Verification Battery › U1-05: Tabular numerals width invariance 0 vs 8 (1.3s)
  ok  6 [chromium] › verification\u1.spec.ts:122:3 › U1 — Design System Verification Battery › U1-06: MetricTile null safety renders — with disabled drill (521ms)
  ok  7 [chromium] › verification\u1.spec.ts:140:3 › U1 — Design System Verification Battery › U1-07: No shadows or gradients outside sanctioned tokens (11ms)
  ok  8 [chromium] › verification\u1.spec.ts:176:3 › U1 — Design System Verification Battery › U1-08: Focus ring contrast >= 3:1 against surfaces (114ms)
  ok  9 [chromium] › verification\u1.spec.ts:183:3 › U1 — Design System Verification Battery › U1-09: Body floor: no text below 11px (4ms)
  ok 10 [chromium] › verification\u1.spec.ts:191:3 › U1 — Design System Verification Battery › U1-10: Icon set complete with all 19 domain SVGs (995ms)

  10 passed (12.7s)
```
P0 CHECKS: U1-01 ✓ U1-02 ✓ U1-03 ✓ U1-04 ✓ U1-05 ✓ U1-06 ✓ U1-07 ✓ U1-08 ✓ U1-09 ✓ U1-10 ✓
SCREENSHOTS: web/verification/u1/{greyscale,icons}.png
FAILED: none (initial attempt 1 failed routing on /method because App.tsx route was not bound to window.location.pathname; fixed in attempt 2)
FALLBACK APPLIED: none
NEXT: U2 — graph visualization

---

## U2 — Graph Visualization Engine
STATUS: PASS
AT: 2026-10-14T17:32:13Z
RAN: npx playwright test verification/u2.spec.ts
OUTPUT:
```text
Running 15 tests using 1 worker

  ok  1 [chromium] › verification\u2.spec.ts:14:3 › U2 — Graph Visualization Engine Battery › U2-01: Live counts drive the render (1.8s)
  ok  2 [chromium] › verification\u2.spec.ts:28:3 › U2 — Graph Visualization Engine Battery › U2-02: No hard-coded graph data in web/src/graph (6ms)
  ok  3 [chromium] › verification\u2.spec.ts:56:3 › U2 — Graph Visualization Engine Battery › U2-03: Layout determinism produces pixel-identical screenshots (2.9s)
  ok  4 [chromium] › verification\u2.spec.ts:74:3 › U2 — Graph Visualization Engine Battery › U2-04: View coordination persists selection across tab switch (2.0s)
  ok  5 [chromium] › verification\u2.spec.ts:97:3 › U2 — Graph Visualization Engine Battery › U2-05: Severed legibility in greyscale (1.8s)
  ok  6 [chromium] › verification\u2.spec.ts:124:3 › U2 — Graph Visualization Engine Battery › U2-06: Cross-layer connectors visible and survive band collapse (809ms)
  ok  7 [chromium] › verification\u2.spec.ts:139:3 › U2 — Graph Visualization Engine Battery › U2-07: Dependency chain arithmetic components sum to total exactly (1.5s)
  ok  8 [chromium] › verification\u2.spec.ts:160:3 › U2 — Graph Visualization Engine Battery › U2-08: No-ledger honesty renders cause not recorded on missing ledger (1.7s)
  ok  9 [chromium] › verification\u2.spec.ts:169:3 › U2 — Graph Visualization Engine Battery › U2-09: Excluded facility renders at 40% opacity with EXCLUDED chip and no access line (1.4s)
  ok 10 [chromium] › verification\u2.spec.ts:184:3 › U2 — Graph Visualization Engine Battery › U2-10: Branch boundary present on counterfactual, absent on base world (2.0s)
  ok 11 [chromium] › verification\u2.spec.ts:202:3 › U2 — Graph Visualization Engine Battery › U2-11: Keyboard entity list navigable with Tab and Arrow keys (2.0s)
  ok 12 [chromium] › verification\u2.spec.ts:221:3 › U2 — Graph Visualization Engine Battery › U2-12: Hit targets register selection inside node and edge bounding areas (1.6s)
Measured p95 frame time: 17.80ms
  ok 13 [chromium] › verification\u2.spec.ts:230:3 › U2 — Graph Visualization Engine Battery › U2-13: Frame budget p95 frame time < 20ms during pan, zoom, selection (2.9s)
  ok 14 [chromium] › verification\u2.spec.ts:263:3 › U2 — Graph Visualization Engine Battery › U2-14: Label collision: critical facility labels never suppressed (2.2s)
  ok 15 [chromium] › verification\u2.spec.ts:273:3 › U2 — Graph Visualization Engine Battery › U2-15: Tooltip displays real API response fields after 400ms hover (3.3s)

  15 passed (32.6s)
```
P0 CHECKS: U2-01 ✓ U2-02 ✓ U2-03 ✓ U2-04 ✓ U2-05 ✓ U2-06 ✓ U2-07 ✓ U2-08 ✓ U2-09 ✓ U2-10 ✓ U2-11 ✓ U2-15 ✓
P1 CHECKS: U2-12 ✓ U2-13 (p95: 17.80ms < 20ms) ✓ U2-14 ✓
SCREENSHOTS: web/verification/u2/{geographic_view,schematic_view,greyscale_severed,dependency_chain}.png
FAILED: none (initial attempt 1 failed direct URL evidence drill-through when runId was not in memory; resolved by jaal_memory fallback in API /api/run/{id}; pointer-events none added to survey grid rect)
FALLBACK APPLIED: none
NEXT: U3 — motion system

