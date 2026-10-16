/**
 * Jaal Pre-Mortem Motion System — Six Authoritative Motifs (U3)
 * Every animation is grammar; none is decoration.
 * Only CSS token variables are used for duration and easing.
 */

export interface MotifConfig {
  name: string;
  durationToken: string;
  easingToken: string;
  meaning: string;
  reducedMotionFallback: string;
  perfFallback: string;
}

/**
 * M1 — Sever (Causality)
 * Trigger: Mutation-ledger entry loads for a corridor failure.
 * Dependent elements sever in ledger order with stagger.
 */
export const M1_Sever: MotifConfig = {
  name: 'M1_Sever',
  durationToken: 'var(--dur-causal)',
  easingToken: 'var(--ease-emph)',
  meaning: 'Corridor failure and ledger-ordered dependent element severing',
  reducedMotionFallback: 'Instant end-state application in same ledger order without transition',
  perfFallback: 'Apply end-states without dash animation above 400 elements',
};

/**
 * M2 — Cascade Propagate (Causality)
 * Trigger: Stepping to the frame where f1 cascade is applied or replaying a case.
 * A single travelling pulse moves along dependency connectors from cause to effect.
 */
export const M2_CascadePropagate: MotifConfig = {
  name: 'M2_CascadePropagate',
  durationToken: 'var(--dur-causal)',
  easingToken: 'var(--ease-in-out)',
  meaning: 'Travelling pulse along dependency connectors from cause to effect',
  reducedMotionFallback: 'Connectors step opacity once or render final highlighted state',
  perfFallback: 'Animate at most 8 connectors; remaining apply end-state instantly',
};

/**
 * M3 — Branch Fork (State / Navigation)
 * Trigger: Displayed state switches to counterfactual branch.
 * Branch boundary and glow fade in around canvas; BRANCH chip slides down.
 */
export const M3_BranchFork: MotifConfig = {
  name: 'M3_BranchFork',
  durationToken: 'var(--dur-reveal)',
  easingToken: 'var(--ease-out)',
  meaning: 'State mode change: user is observing a counterfactual world branch',
  reducedMotionFallback: 'Boundary, glow, and chip appear instantly without slide or draw',
  perfFallback: 'Omit glow filter if GPU frame budget is stressed',
};

/**
 * M4 — Route Redraw (State Change)
 * Trigger: Selected route changes between frames or cases.
 * Old path fades to 25% while new path draws along its length.
 */
export const M4_RouteRedraw: MotifConfig = {
  name: 'M4_RouteRedraw',
  durationToken: 'var(--dur-causal)',
  easingToken: 'var(--ease-in-out)',
  meaning: 'Route delta between baseline and counterfactual paths',
  reducedMotionFallback: 'Both paths shown statically: old at 25% with OLD label, new at full weight',
  perfFallback: 'Cross-fade without path drawing',
};

/**
 * M5 — Focus and Selection (Feedback)
 * Trigger: Hover, keyboard focus, node selection.
 * Weight-only hover; focus ring scale; connected edges lift to 1.5x stroke weight.
 */
export const M5_FocusSelection: MotifConfig = {
  name: 'M5_FocusSelection',
  durationToken: 'var(--dur-feedback)',
  easingToken: 'var(--ease-out)',
  meaning: 'Immediate user interaction and focal element emphasis',
  reducedMotionFallback: 'Identical without ring scale transition',
  perfFallback: 'Static weight step',
};

/**
 * M6 — Verdict Settle (Feedback)
 * Trigger: Metric value arrives from the API.
 * Count-up starts from real previous value and ends on real new value.
 * Null safety: if value is null, tile shows em-dash and no count-up runs.
 */
export const M6_VerdictSettle: MotifConfig = {
  name: 'M6_VerdictSettle',
  durationToken: 'var(--dur-state)',
  easingToken: 'var(--ease-emph)',
  meaning: 'Live API metric arrival and badge snap with overshoot',
  reducedMotionFallback: 'Value and badge change instantly',
  perfFallback: 'Instant value update',
};

/**
 * M7 — Step Transition (Presenter Walkthrough)
 * Trigger: Presenter walkthrough steps between scenes.
 * Outgoing card fades and drops 6px (--dur-state, --ease-in-out)
 * while spotlight travels to next target along a straight path (--dur-reveal, --ease-emph)
 * and incoming card rises 6px into place. Total duration under --chain-max.
 */
export const M7_StepTransition: MotifConfig = {
  name: 'M7_StepTransition',
  durationToken: 'var(--dur-reveal)',
  easingToken: 'var(--ease-emph)',
  meaning: 'Continuous spatial spotlight travel and card fade/rise during presenter walkthrough steps',
  reducedMotionFallback: 'Instant spotlight snap and instant card opacity with zero spatial travel',
  perfFallback: 'Instant spotlight snap without intermediate interpolation',
};

