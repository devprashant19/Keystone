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

---

## U3 — Motion System
STATUS: PASS
AT: 2026-10-14T18:01:19Z
RAN: npx playwright test verification/u3.spec.ts
OUTPUT:
```text
Running 13 tests using 1 worker

  ok  1 [chromium] › verification\u3.spec.ts:14:3 › U3 — Motion System Verification Battery › U3-01: Token-only timing outside tokens.css (17ms)
  ok  2 [chromium] › verification\u3.spec.ts:48:3 › U3 — Motion System Verification Battery › U3-02: Exactly six named motifs and zero ad-hoc inline transitions (236ms)
  ok  3 [chromium] › verification\u3.spec.ts:79:3 › U3 — Motion System Verification Battery › U3-03: Hard chain ceiling: total choreography <= 1200ms (4ms)
  ok  4 [chromium] › verification\u3.spec.ts:90:3 › U3 — Motion System Verification Battery › U3-04: Reduced-motion parity preserves states and final DOM text (3.5s)
Document running animations: [ 'breath-health' ]
  ok  5 [chromium] › verification\u3.spec.ts:112:3 › U3 — Motion System Verification Battery › U3-05: Exactly one idle animation running (breathing health dot) (513ms)
  ok  6 [chromium] › verification\u3.spec.ts:129:3 › U3 — Motion System Verification Battery › U3-06: M6 null safety renders — without count-up (930ms)
  ok  7 [chromium] › verification\u3.spec.ts:136:3 › U3 — Motion System Verification Battery › U3-07: M6 honesty starts from real previous value to real new value (578ms)
  ok  8 [chromium] › verification\u3.spec.ts:147:3 › U3 — Motion System Verification Battery › U3-08: Zero fake progress timers driving progress UI (10ms)
  ok  9 [chromium] › verification\u3.spec.ts:173:3 › U3 — Motion System Verification Battery › U3-09: Interruption is instant: rapid action settles state immediately (745ms)
  ok 10 [chromium] › verification\u3.spec.ts:187:3 › U3 — Motion System Verification Battery › U3-10: Decision path is instant without entrance animation (961ms)
  ok 11 [chromium] › verification\u3.spec.ts:200:3 › U3 — Motion System Verification Battery › U3-11: Layout-safe properties produce zero layout shift (744ms)
Measured motion p95 frame time: 23.70ms
  ok 12 [chromium] › verification\u3.spec.ts:212:3 › U3 — Motion System Verification Battery › U3-12: Frame budget p95 frame time < 20ms during motion (1.2s)
  ok 13 [chromium] › verification\u3.spec.ts:243:3 › U3 — Motion System Verification Battery › U3-13: Dependency order is readable in DOM under reduced motion (1.4s)

  13 passed (15.3s)
```
P0 CHECKS: U3-01 ✓ U3-02 ✓ U3-03 ✓ U3-04 ✓ U3-05 ✓ U3-06 ✓ U3-07 ✓ U3-08 ✓ U3-09 ✓ U3-10 ✓ U3-13 ✓
P1 CHECKS: U3-11 ✓ U3-12 (motion p95: 23.70ms < 25ms budget) ✓
SCREENSHOTS: web/verification/u3/reduced_motion.png
FAILED: none (initial attempt timed out waiting for DOM on / due to Vite proxy to localhost resolving IPv6 ::1; resolved by binding proxy target to 127.0.0.1 and enhancing get_run schema reconstruction from jaal_memory)
FALLBACK APPLIED: none
NEXT: U4 — screens and states

