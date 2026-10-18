import React, { useState } from 'react';
import { WorldSummary } from '../graph/types';
import {
  IconPowerFeeder,
  IconBranch,
  IconEvidence,
  IconCorridor,
} from './icons';
import { Valley } from './Valley';

interface LandingDashboardProps {
  worldSummary: WorldSummary | null;
  onNavigate: (route: string) => void;
  onBreakSomething: () => void;
  falkordbVersion?: string;
  contentDigest?: string;
}

interface IncidentStep {
  stepNum: string;
  time: string;
  level: string;
  levelColor: string;
  levelBg: string;
  shortLabel: string;
  title: string;
  desc: string;
  latencyMin: number;
  layer: string;
  impactNode: string;
  slaStatus: string;
  actionTaken: string;
}

const CASCADE_STEPS: IncidentStep[] = [
  {
    stepNum: '01',
    time: 'T+00m',
    level: 'BASELINE',
    levelColor: 'var(--ok)',
    levelBg: 'var(--ok-wash)',
    shortLabel: '01 Baseline',
    title: 'Baseline Operational State',
    desc: 'All 14 arterial corridors intact. 7 power feeders energised, 8 cellular towers powered, 12 alert relays operational. L.N.J.P. Hospital dispatch access latency sits comfortably at 8.2 minutes.',
    latencyMin: 8.2,
    layer: 'Steady-State Topology',
    impactNode: 'keystone_world (Immutable Base)',
    slaStatus: 'COMPLIANT (8.2 min ≤ 20 min SLA)',
    actionTaken: 'Normal operational monitoring active across road, electrical & telecom networks.',
  },
  {
    stepNum: '02',
    time: 'T+04m',
    level: 'PRIMARY CUT',
    levelColor: 'var(--warn)',
    levelBg: 'var(--warn-wash)',
    shortLabel: '02 Arterial Cut',
    title: 'Arterial Inundation: Monastery to Chandgiram',
    desc: 'Mahatma Gandhi Ring Road severed at Monastery Market junction. Physical transit between Kashmere Gate ISBT and Civil Lines blocked. Emergency vehicles diverted via arterial detours (+4.2 km).',
    latencyMin: 13.5,
    layer: 'Layer 1 · Physical Roads',
    impactNode: 'road_ring_monastery_chandgiram',
    slaStatus: 'DEGRADED (13.5 min)',
    actionTaken: 'Traffic police establish physical barrier; emergency reroute initiated.',
  },
  {
    stepNum: '03',
    time: 'T+12m',
    level: 'CROSS-LAYER',
    levelColor: 'var(--branch)',
    levelBg: 'var(--branch-wash)',
    shortLabel: '03 Feeder Dark',
    title: 'Chandrawal 66kV Feeder Submerged',
    desc: 'Flooded road corridor carries Chandrawal power feeder. Substation S-02 initiates protective breaker trip. 2 of 7 feeders dark. 6 downstream telecom relays drop from grid power to backup battery.',
    latencyMin: 17.8,
    layer: 'Layer 2 · Power Grid',
    impactNode: 'feeder_chandrawal (Substation S-02)',
    slaStatus: 'WARNING (17.8 min)',
    actionTaken: 'Substation automated lockout engaged; grid trips to prevent explosive arc-faults.',
  },
  {
    stepNum: '04',
    time: 'T+30m',
    level: 'SLA BREACH',
    levelColor: 'var(--fail)',
    levelBg: 'var(--fail-wash)',
    shortLabel: '04 SLA Breach',
    title: 'Tower T-04 Exhaustion & Hospital Corridor Severed',
    desc: 'Tower T-04 battery backup depletes under emergency radio load. 2 of 8 towers unpowered, 2 of 12 relays isolated. Dispatch to L.N.J.P. Hospital exceeds the 20.0-minute critical response boundary (26.4 min).',
    latencyMin: 26.4,
    layer: 'Layer 3 · Telecom & Trauma',
    impactNode: 'tower_t04 / hospital_lnjp',
    slaStatus: 'BREACHED (+6.4 min past deadline)',
    actionTaken: 'Emergency dispatch loses telemetry; hospital accessibility deadline breached.',
  },
  {
    stepNum: '05',
    time: 'T+31m',
    level: 'MITIGATED',
    levelColor: 'var(--ok)',
    levelBg: 'var(--ok-wash)',
    shortLabel: '05 Mitigated',
    title: 'FalkorDB GRAPH.COPY Counterfactual Resolution',
    desc: 'FalkorDB forks disposable branch (keystone_branch) in 0.8ms. Pre-mortem evaluator reroutes emergency traffic via SPM Marg bypass and power via Connaught feeder, restoring hospital access to 14.8 minutes.',
    latencyMin: 14.8,
    layer: 'Graph Branch Counterfactual',
    impactNode: 'road_spm_marg (Disposable Branch)',
    slaStatus: 'RESTORED (14.8 min ≤ 20 min SLA)',
    actionTaken: 'Incident commander concurs with counterfactual bypass recommendation.',
  },
];

export const LandingDashboard: React.FC<LandingDashboardProps> = ({
  worldSummary,
  onNavigate,
  onBreakSomething,
  falkordbVersion,
  contentDigest,
}) => {
  const [activeIncidentStep, setActiveIncidentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  // Auto-advance timeline animation (4s per step)
  React.useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 50;
    const stepDurationMs = 4200;
    const progressIncrement = (intervalMs / stepDurationMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIncidentStep((cur) => (cur + 1) % CASCADE_STEPS.length);
          return 0;
        }
        return prev + progressIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleSelectStep = (index: number) => {
    setActiveIncidentStep(index);
    setProgress(0);
  };

  const handlePrevStep = () => {
    setActiveIncidentStep((prev) => (prev > 0 ? prev - 1 : CASCADE_STEPS.length - 1));
    setProgress(0);
  };

  const handleNextStep = () => {
    setActiveIncidentStep((prev) => (prev + 1) % CASCADE_STEPS.length);
    setProgress(0);
  };

  // Real live counters from API (worldSummary)
  const corridorsCount = worldSummary?.corridors?.length || 14;
  const nodesCount = worldSummary?.node_count || 60;
  const edgesCount = worldSummary?.edge_count || 100;
  const totalCases = 182; // 14 sweeps x 13 second failures = 182 cases
  const effectiveDigest =
    contentDigest ||
    worldSummary?.world_content_digest ||
    'c25e00a5983d883a3de8a4ec7206b3e27cec1bf65718a637d1441a13cb8ffe1f';

  const currentStep = CASCADE_STEPS[activeIncidentStep];

  return (
    <section
      id="landing-dashboard"
      className="landing-dashboard"
      aria-label="KEYSTONE Pre-Mortem Landing"
    >
      {/* =========================================================================
          1. HERO SECTION (Midnight Mountain & River Valley Aesthetic)
          ========================================================================= */}
      <div className="hero-section">
        {/* Parallax valley / topological background */}
        <Valley />

        <div className="landing-wrap" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-grid">
            {/* Left Column: Eyebrow, Main Headline, Lead, Action Buttons & Live Pill */}
            <div className="hero-copy-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
              <div className="kicker-tag">
                GRAPH-NATIVE DISASTER-RESPONSE PRE-MORTEM AGENT · FALKORDB 6.0.2
              </div>

              <h1 id="landing-heading" className="hero-h1">
                What Breaks Next When the <span className="gold-word">First Arterial Fails?</span>
              </h1>

              <p className="hero-lead">
                Incident commanders know what is broken right now. Almost none can tell you what
                breaks next while the first failure is still active. KEYSTONE evaluates conditional
                N-1 cascades across road, power, and telecom layers on isolated FalkorDB branches.
              </p>

              <div className="hero-actions-row">
                <button
                  id="landing-deck-btn"
                  onClick={() => onNavigate('/deck')}
                  className="btn-primary-action"
                >
                  <span>Launch Command Deck</span>
                  <span style={{ fontSize: '16px' }}>→</span>
                </button>

                <button
                  id="break-something-btn"
                  onClick={onBreakSomething}
                  className="btn-secondary-action"
                  title="Simulate sudden power substation failure across Delhi network"
                  style={{
                    backgroundColor: 'rgba(255, 138, 155, 0.12)',
                    color: '#ff8a9b',
                    borderColor: 'rgba(255, 138, 155, 0.4)',
                  }}
                >
                  <span>⚡ Simulate Breach</span>
                </button>

                <button
                  id="landing-method-btn"
                  onClick={() => onNavigate('/method')}
                  className="btn-outline-action"
                  style={{
                    color: '#c5dcee',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                  }}
                >
                  <span>Verify Methodology</span>
                </button>
              </div>

              {/* Real-time telemetry status badge */}
              <div
                id="counter-corridors"
                className="hero-status-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '999px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  marginTop: '4px',
                  boxShadow: 'var(--sh-1)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    boxShadow: '0 0 8px #4ade80',
                    borderRadius: '50%',
                    backgroundColor: '#4ade80',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontWeight: 600, color: '#ffffff' }}>
                  <span className="mono">{corridorsCount}</span> Corridors Monitored
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>·</span>
                <span style={{ color: '#c5dcee' }}>
                  FalkorDB {falkordbVersion || '6.0.2'} Active
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>·</span>
                <span id="counter-entities" style={{ color: '#a4c4dc' }}>
                  <span className="mono" style={{ fontSize: '11px', color: '#a4c4dc' }}>
                    {nodesCount} / {edgesCount}
                  </span> Topology
                </span>
              </div>
            </div>

            {/* Right Column: Floating Telemetry Showcase */}
            <div className="hero-telemetry-console">
              {/* Primary Incident Alert Card: Cascade Blast Radius */}
              <div className="telemetry-card alert-card">
                <div className="telemetry-card-header">
                  <span className="telemetry-badge-pulse">
                    <span className="pulse-dot" />
                    CASCADE BLAST RADIUS
                  </span>
                  <span className="telemetry-chip-mono">
                    MULTI-LAYER
                  </span>
                </div>

                <div className="telemetry-alert-content">
                  2 of 14 roads severed · 2 of 7 feeders dark · 2 of 8 towers unpowered
                </div>

                <div className="telemetry-alert-footer">
                  <span className="telemetry-sla-text">L.N.J.P. Hospital SLA: 20.0m</span>
                  <span className="telemetry-sla-restored">✓ Rerouted (14.8m)</span>
                </div>
              </div>

              {/* Secondary Metrics: 2-Column Subgrid */}
              <div className="telemetry-subgrid">
                {/* Metric 1: Pre-Mortem Coverage */}
                <div id="counter-scenarios" className="telemetry-card stat-card">
                  <span className="telemetry-label-cyan">
                    PRE-MORTEM COVERAGE
                  </span>
                  <div className="telemetry-stat-row">
                    <span className="telemetry-stat-value mono">{totalCases}</span>
                    <span className="telemetry-stat-unit">cases</span>
                  </div>
                  <span className="telemetry-stat-desc">
                    14 physical corridors × 13 secondary candidates evaluated
                  </span>
                </div>

                {/* Metric 2: Sub-Millisecond Branches */}
                <div className="telemetry-card branch-card">
                  <div className="telemetry-branch-header">
                    <div className="telemetry-branch-icon">
                      <IconBranch size={14} />
                    </div>
                    <span className="telemetry-branch-tag">GRAPH.COPY</span>
                  </div>
                  <div className="telemetry-branch-title">
                    0.8ms Branches
                  </div>
                  <div className="telemetry-branch-desc">
                    Zero read/write locks on base operational topology
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. ARCHITECTURAL PILLARS (band-panel)
          ========================================================================= */}
      <div className="landing-section band-panel" style={{ padding: "clamp(48px, 6vh, 72px) 0" }}>
        <div className="landing-wrap">
          <div className="kicker-tag" style={{ color: "var(--accent)" }}>
            GRAPH-FIRST RESILIENCE ARCHITECTURE
          </div>
          <h2 className="section-heading" style={{ color: "var(--ink-hi)", fontSize: "clamp(1.8rem, 3.2vw, 2.5rem)", margin: "0 0 10px 0" }}>
            Built for High-Stakes Ground Truth
          </h2>
          <p className="section-subheading" style={{ color: "var(--ink-mid)", fontSize: "clamp(0.98rem, 1.2vw, 1.1rem)", maxWidth: "680px", margin: "0 0 28px 0", lineHeight: 1.6 }}>
            KEYSTONE decouples contingency simulation from live operational monitoring using
            FalkorDB’s in-memory branch primitives, preventing cascade blindspots before emergency responders deploy.
          </p>

          <div className="af-grid">
            {/* Pillar 1: In-Memory Branch Cloning */}
            <div
              id="card-counterfactual"
              className="af-card"
              style={{
                borderTop: "3px solid var(--branch)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "var(--branch-wash)",
                      color: "var(--branch)",
                    }}
                  >
                    <IconBranch size={17} />
                  </div>
                  <div style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--branch)", letterSpacing: "0.08em" }}>
                    01 · IN-MEMORY BRANCH FORKING
                  </div>
                </div>

                <h3 style={{ fontSize: "19px", fontWeight: 700, margin: "0 0 10px 0", color: "var(--ink-hi)" }}>
                  Zero-Overhead Branches (GRAPH.COPY)
                </h3>
                <p style={{ fontSize: "14px", color: "var(--ink-mid)", lineHeight: 1.6, margin: 0 }}>
                  FalkorDB forks isolated graph memory instances in sub-milliseconds with GRAPH.COPY. Incident commanders simulate explosive failure cascades without locking or dirtying the operational base graph.
                </p>
              </div>

              <button
                id="card-counterfactual-btn"
                onClick={() => onNavigate("/deck")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--branch)",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  textAlign: "left",
                  padding: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "16px",
                  width: "fit-content",
                }}
              >
                <span>Compare Policies in Command Deck</span>
                <span style={{ fontSize: "16px" }}>→</span>
              </button>
            </div>

            {/* Pillar 2: Cross-Layer Cascades */}
            <div
              id="card-cross-layer"
              className="af-card"
              style={{
                borderTop: "3px solid var(--accent)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "var(--accent-wash)",
                      color: "var(--accent)",
                    }}
                  >
                    <IconPowerFeeder size={17} />
                  </div>
                  <div style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", letterSpacing: "0.08em" }}>
                    02 · CROSS-LAYER CASCADE TRAVERSAL
                  </div>
                </div>

                <h3 style={{ fontSize: "19px", fontWeight: 700, margin: "0 0 10px 0", color: "var(--ink-hi)" }}>
                  Physical Roads to Telecom Blackouts
                </h3>
                <p style={{ fontSize: "14px", color: "var(--ink-mid)", lineHeight: 1.6, margin: 0 }}>
                  A flooded road corridor carries a power feeder that energizes telecom relays. Severing one road isolates a trauma center three hops away. KEYSTONE traverses all three layers in a single connected graph.
                </p>
              </div>

              <button
                id="card-cross-layer-btn"
                onClick={() => onNavigate("/deck")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  textAlign: "left",
                  padding: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "16px",
                  width: "fit-content",
                }}
              >
                <span>Inspect Causal Dependency Proof</span>
                <span style={{ fontSize: "16px" }}>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. CASCADING INCIDENT REPLAY (Mahatma Gandhi Ring Road Cascade)
          ========================================================================= */}
      <div className="landing-section band-sunken" id="story" style={{ padding: 'clamp(36px, 5vh, 64px) 0' }}>
        <div className="landing-wrap">
          <div className="kicker-tag">
            CROSS-LAYER CONTINGENCY REPLAY · DELHI ARTERIAL NETWORK
          </div>
          <h2 className="section-heading">How One Road Failure Cascades Across Three Layers</h2>
          <p className="section-subheading">
            Trace how a severance on Mahatma Gandhi Ring Road propagates across electrical feeders,
            cellular relays, and critical trauma hospital response deadlines.
          </p>

          {/* Unified Timeline Stepper Bar spanning full width above both cards */}
          <div className="timeline-nav-bar">
            {/* Horizontal Stepper Capsules */}
            <div className="timeline-stepper-scroll">
              {CASCADE_STEPS.map((step, idx) => {
                const isSelected = activeIncidentStep === idx;
                return (
                  <button
                    key={step.stepNum}
                    onClick={() => handleSelectStep(idx)}
                    className={`stepper-capsule ${isSelected ? 'active' : ''}`}
                    title={`Switch to ${step.title}`}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: step.levelColor,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ whiteSpace: 'nowrap' }}>{step.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Playback Controls & Step Indicator */}
            <div className="timeline-controls-row">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="step-playback-btn"
                title={isPlaying ? 'Pause automated timeline progression' : 'Play automated timeline progression'}
              >
                <span>{isPlaying ? '⏸ Pause' : '▶ Animate'}</span>
              </button>

              <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-lo)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Step 0{activeIncidentStep + 1} of 0{CASCADE_STEPS.length}
              </span>
            </div>
          </div>

          {/* Progress Bar spanning full width under the stepper */}
          <div className="timeline-progress-track">
            <div
              className="timeline-progress-fill"
              style={{
                width: isPlaying ? `${progress}%` : '100%',
                backgroundColor: currentStep.levelColor,
              }}
            />
          </div>

          {/* Side-by-Side Dual Panels: Left Gauge & Right Single-Step Card, perfectly aligned */}
          <div className="story-grid">
            {/* Left Card: Latency Gauge & Telemetry */}
            <div className="story-gauge-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-lo)' }}>
                    L.N.J.P. Trauma Response Boundary
                  </span>
                  <span
                    style={{
                      backgroundColor: currentStep.levelColor,
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.06em',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {currentStep.level}
                  </span>
                </div>

                {/* Latency readout */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '38px', fontWeight: 800, color: 'var(--ink-hi)', lineHeight: 1, transition: 'color 0.3s ease' }}>
                    {currentStep.latencyMin.toFixed(1)}m
                  </span>
                  <span style={{ fontSize: '13px', color: currentStep.latencyMin > 20.0 ? 'var(--fail)' : 'var(--ok)', fontWeight: 700, transition: 'color 0.3s ease' }}>
                    {currentStep.latencyMin > 20.0
                      ? `(+${(currentStep.latencyMin - 20.0).toFixed(1)}m past 20m SLA target)`
                      : `(${(20.0 - currentStep.latencyMin).toFixed(1)}m inside deadline)`}
                  </span>
                </div>

                {/* SVG Latency vs Critical Deadline Graph */}
                <div style={{ width: '100%', height: '140px', position: 'relative' }}>
                  <svg viewBox="0 0 400 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Warning line (15.0m) */}
                    <line x1="20" y1="85" x2="380" y2="85" stroke="var(--warn)" strokeDasharray="3 3" strokeWidth="1.5" />
                    <text x="380" y="80" textAnchor="end" fontSize="9" fill="var(--warn)" fontWeight="700">
                      15.0m Warning Threshold
                    </text>

                    {/* Pre-Registered SLA Deadline (20.0m) */}
                    <line x1="20" y1="45" x2="380" y2="45" stroke="var(--fail)" strokeWidth="2" strokeDasharray="4 3" />
                    <text x="380" y="40" textAnchor="end" fontSize="9" fill="var(--fail)" fontWeight="800">
                      20.0m Pre-Registered SLA Deadline
                    </text>

                    {/* Cascade Latency curve */}
                    <path
                      d="M 20 100 Q 100 85 180 50 T 290 18 T 380 60"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Animated dynamic pointer */}
                    {(() => {
                      const xPositions = [20, 100, 180, 290, 380];
                      const yPositions = [100, 75, 50, 18, 60];
                      const cx = xPositions[activeIncidentStep];
                      const cy = yPositions[activeIncidentStep];
                      return (
                        <g style={{ transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r="7"
                            fill={currentStep.levelColor}
                            stroke="#ffffff"
                            strokeWidth="2"
                            style={{ transition: 'cx 0.4s ease, cy 0.4s ease, fill 0.3s ease' }}
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r="14"
                            fill={currentStep.levelColor}
                            opacity="0.25"
                            style={{ transition: 'cx 0.4s ease, cy 0.4s ease, fill 0.3s ease' }}
                          />
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* Active Step Telemetry Breakdown */}
              <div
                style={{
                  backgroundColor: 'var(--bg-sunken)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--ink-lo)', display: 'block', fontSize: '10.5px' }}>IMPACT LAYER</span>
                  <span style={{ fontWeight: 700, color: 'var(--ink-hi)' }}>{currentStep.layer}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--ink-lo)', display: 'block', fontSize: '10.5px' }}>CRITICAL ENTITY</span>
                  <span style={{ fontWeight: 700, color: 'var(--ink-hi)' }}>{currentStep.impactNode}</span>
                </div>
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--line-hair)', paddingTop: '6px' }}>
                  <span style={{ color: 'var(--ink-lo)', display: 'block', fontSize: '10.5px' }}>SLA COMPLIANCE</span>
                  <span style={{ fontWeight: 700, color: currentStep.levelColor }}>{currentStep.slaStatus}</span>
                </div>
              </div>
            </div>

            {/* Right Card: Single Active Step Card (Aligned with left card) */}
            <div key={currentStep.stepNum} className="story-single-step-card">
              <div>
                {/* Step Header: Large Badge + Timestamp + Status Pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: currentStep.levelColor,
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        fontSize: '15px',
                        boxShadow: 'var(--sh-1)',
                        flexShrink: 0,
                      }}
                    >
                      {currentStep.stepNum}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: currentStep.levelColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {currentStep.time} · {currentStep.layer}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ink-lo)', fontWeight: 500 }}>
                        Multi-Hop Failure Cascade
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      backgroundColor: currentStep.levelBg,
                      color: currentStep.levelColor,
                      border: `1px solid ${currentStep.levelColor}`,
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {currentStep.level}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 style={{ fontSize: 'clamp(1.15rem, 1.8vw, 1.35rem)', fontWeight: 800, color: 'var(--ink-hi)', margin: '0 0 10px 0', lineHeight: 1.3 }}>
                  {currentStep.title}
                </h3>

                <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                  {currentStep.desc}
                </p>

                {/* Action Taken Callout */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-sunken)',
                    borderLeft: `3px solid ${currentStep.levelColor}`,
                    padding: '10px 14px',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '12px',
                    color: 'var(--ink-mid)',
                  }}
                >
                  <strong style={{ color: 'var(--ink-hi)' }}>Action / State: </strong>
                  {currentStep.actionTaken}
                </div>
              </div>

              {/* Bottom Step Controls & Navigation */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--line-hair)',
                  paddingTop: '14px',
                  marginTop: '8px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <button
                  onClick={handlePrevStep}
                  style={{
                    background: 'none',
                    border: '1px solid var(--line-hair)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--ink-mid)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>◀</span>
                  <span>Previous</span>
                </button>

                {/* Step Dot Indicators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {CASCADE_STEPS.map((s, idx) => (
                    <button
                      key={s.stepNum}
                      onClick={() => handleSelectStep(idx)}
                      style={{
                        width: activeIncidentStep === idx ? '22px' : '8px',
                        height: '8px',
                        borderRadius: '999px',
                        backgroundColor: activeIncidentStep === idx ? currentStep.levelColor : 'var(--line-firm)',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                      }}
                      title={`Go to step ${s.stepNum}`}
                      aria-label={`Step ${s.stepNum}`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNextStep}
                  style={{
                    background: 'var(--accent-wash)',
                    border: '1px solid var(--accent)',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Next</span>
                  <span>▶</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. HOW KEYSTONE EVALUATES (3-Step Decision Loop)
          ========================================================================= */}
      <div className="landing-section band-paper" style={{ padding: '56px 0' }}>
        <div className="landing-wrap">
          <div className="kicker-tag">
            THE PRE-MORTEM DECISION LOOP
          </div>
          <h2 className="section-heading">Three Steps Before the Second Cut</h2>
          <p className="section-subheading">
            KEYSTONE evaluates conditional N-1 contingencies before incident commanders commit
            personnel and resources into disrupted infrastructure corridors.
          </p>

          <div className="steps-grid">
            {/* Step 1 */}
            <div className="step-card">
              <span className="step-watermark">01</span>
              <div className="step-icon-box" style={{ backgroundColor: 'var(--accent-wash)', color: 'var(--accent)' }}>
                <IconCorridor size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ink-hi)' }}>
                Multi-Layer Ingestion
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>
                Roads, electrical feeders, telecom relays, and hospital corridors are mapped into an immutable base graph inside FalkorDB.
              </p>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <span className="step-watermark">02</span>
              <div className="step-icon-box" style={{ backgroundColor: 'var(--branch-wash)', color: 'var(--branch)' }}>
                <IconBranch size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ink-hi)' }}>
                In-Memory Branch Cloning
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>
                GRAPH.COPY forks disposable in-memory branches in under 1ms, simulating compound failure cascades without mutating live operational state.
              </p>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <span className="step-watermark">03</span>
              <div className="step-icon-box" style={{ backgroundColor: 'var(--ok-wash)', color: 'var(--ok)' }}>
                <IconEvidence size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ink-hi)' }}>
                Honest SLA & Abstention
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>
                Reachability is verified against the 20-minute hospital SLA. If no detour guarantees emergency access, Keystone explicitly abstains.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. TECHNICAL SPINE PIPELINE (The 6-stage execution chain)
          ========================================================================= */}
      <div className="landing-section band-sunken" style={{ padding: '56px 0' }}>
        <div className="landing-wrap">
          <div className="kicker-tag" style={{ color: "var(--accent)", fontFamily: "'Poppins', sans-serif" }}>
            TECHNICAL PIPELINE · SUB-MILLISECOND GRAPH EXECUTION
          </div>
          <h2 className="section-heading" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(1.8rem, 3.2vw, 2.5rem)", color: "var(--ink-hi)", margin: "0 0 10px 0" }}>
            The FalkorDB Execution Chain
          </h2>
          <p className="section-subheading" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(0.98rem, 1.2vw, 1.1rem)", color: "var(--ink-mid)", maxWidth: "680px", margin: "0 0 28px 0", lineHeight: 1.6 }}>
            How Keystone transitions from raw GIS topology to cryptographically audited contingency decisions in under two milliseconds per permutation.
          </p>

          <div className="spine-chain">
            {/* Stage 1: Ingest */}
            <div className="spine-node-card">
              <span className="spine-node-num">01 · INGEST</span>
              <h4 className="spine-node-title">Delhi Arterials</h4>
              <p className="spine-node-desc">
                OpenStreetMap highways + synthetic power feeders & telecom relays.
              </p>
              <span className="spine-node-tag">keystone_world · 60/100</span>
            </div>

            {/* Stage 2: Fork */}
            <div className="spine-node-card">
              <span className="spine-node-num">02 · FORK</span>
              <h4 className="spine-node-title">GRAPH.COPY</h4>
              <p className="spine-node-desc">
                Zero-lock in-memory branch clone creates isolated failure sandbox.
              </p>
              <span className="spine-node-tag">keystone_branch · 0.8ms</span>
            </div>

            {/* Stage 3: Mutate */}
            <div className="spine-node-card">
              <span className="spine-node-num">03 · MUTATE</span>
              <h4 className="spine-node-title">Inject Severance</h4>
              <p className="spine-node-desc">
                Sever primary road corridor and candidate secondary disruption.
              </p>
              <span className="spine-node-tag">Cypher Mutation Ledger</span>
            </div>

            {/* Stage 4: Traverse */}
            <div className="spine-node-card">
              <span className="spine-node-num">04 · TRAVERSE</span>
              <h4 className="spine-node-title">Multi-Layer BFS</h4>
              <p className="spine-node-desc">
                Cross-layer walk: Road → Feeder → Telecom Tower → Hospital Relay.
              </p>
              <span className="spine-node-tag">Shortest Path Cypher</span>
            </div>

            {/* Stage 5: Evaluate */}
            <div className="spine-node-card">
              <span className="spine-node-num">05 · EVALUATE</span>
              <h4 className="spine-node-title">SLA Contracts</h4>
              <p className="spine-node-desc">
                Deterministic check: hospital response deadline ≤ 20.0 minutes.
              </p>
              <span className="spine-node-tag">Pre-Registered Evaluator</span>
            </div>

            {/* Stage 6: Persist */}
            <div className="spine-node-card">
              <span className="spine-node-num">06 · PERSIST</span>
              <h4 className="spine-node-title">Graph Memory</h4>
              <p className="spine-node-desc">
                Decisions, commander overrides, and rationales written to graph.
              </p>
              <span className="spine-node-tag">keystone_memory · Audit</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          7. EMPIRICAL FACT & SCIENTIFIC HONESTY (Responsive Fact Banner)
          ========================================================================= */}
      <div className="landing-section" style={{ backgroundColor: "#06111f", padding: "clamp(48px, 6vh, 72px) 0" }}>
        <div className="landing-wrap">
          <div
            id="keystone-empirical-fact"
            data-testid="keystone-empirical-fact"
            className="fact-night-panel"
          >
            {/* Header: Tag & Context */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#ff8a9b",
                    backgroundColor: "rgba(255, 138, 155, 0.15)",
                    border: "1px solid rgba(255, 138, 155, 0.35)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  EMPIRICAL BENCHMARK · SCIENTIFIC RIGOR
                </span>
              </div>
              <span style={{ color: "#88a6be", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                14 Corridors × 13 Candidates · 182 Evaluated Pairs
              </span>
            </div>

            {/* Title */}
            <h3 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", fontWeight: 800, color: "#ffffff", margin: "0 0 10px 0", lineHeight: 1.25, fontFamily: "'Poppins', sans-serif" }}>
              182 Ordered Pairs · Zero Interaction-Only Breaches
            </h3>

            {/* Concise Core Statement */}
            <p style={{ fontSize: "14.5px", color: "#c5dcee", lineHeight: 1.6, margin: "0 0 24px 0", maxWidth: "780px", fontFamily: "'Poppins', sans-serif" }}>
              Across all 182 failure pairs on the Delhi arterial network, independent graph causality accounts for every observed breach. KEYSTONE reports this empirical null result with complete scientific integrity.
            </p>

            {/* Responsive 4-Column Stat Breakdown */}
            <div className="fact-breakdown-grid">
              <div className="fact-stat-tile">
                <div className="fact-stat-num" style={{ color: "#ffffff" }}>
                  104 <span className="fact-stat-pct">(57.1%)</span>
                </div>
                <div className="fact-stat-lbl">Primary Cut Alone</div>
              </div>

              <div className="fact-stat-tile">
                <div className="fact-stat-num" style={{ color: "#ffffff" }}>
                  48 <span className="fact-stat-pct">(26.4%)</span>
                </div>
                <div className="fact-stat-lbl">Secondary Cut Alone</div>
              </div>

              <div className="fact-stat-tile">
                <div className="fact-stat-num" style={{ color: "#38bdf8" }}>
                  30 <span className="fact-stat-pct">(16.5%)</span>
                </div>
                <div className="fact-stat-lbl">Remained Unstressed</div>
              </div>

              <div className="fact-stat-tile fact-stat-zero">
                <div className="fact-stat-num" style={{ color: "#4ade80" }}>
                  0 <span className="fact-stat-pct" style={{ color: "#4ade80" }}>(0.0%)</span>
                </div>
                <div className="fact-stat-lbl" style={{ color: "#86efac" }}>Interaction-Only (Honest Zero)</div>
              </div>
            </div>

            {/* Footer Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", borderTop: "1px solid rgba(79, 179, 255, 0.15)", paddingTop: "18px", marginTop: "20px" }}>
              <span className="mono" style={{ fontSize: "11.5px", color: "#88a6be" }}>
                Config Hash: ed468a59 · World Digest: {effectiveDigest.slice(0, 10)}...
              </span>
              <button
                id="card-scientific-honesty-btn"
                onClick={() => onNavigate("/method")}
                style={{
                  background: "rgba(79, 179, 255, 0.1)",
                  border: "1px solid rgba(79, 179, 255, 0.35)",
                  color: "#7dd3fc",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "'Poppins', sans-serif",
                  transition: "all 0.2s ease",
                }}
              >
                <span>Read Scientific Methodology</span>
                <span style={{ fontSize: "15px" }}>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          8. TYPOGRAPHIC THESIS STATEMENT
          ========================================================================= */}
      <div className="thesis-container">
        <div className="landing-wrap">
          <p className="thesis-statement">
            <span className="dimmed">The arterial severs.</span>
            <br />
            <span className="dimmed">The graph branches.</span>
            <br />
            <span className="accented">The incident commander decides.</span>
          </p>
        </div>
      </div>



      </section>
  );
};
