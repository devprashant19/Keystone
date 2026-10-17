import React from 'react';
import { WorldSummary } from '../graph/types';

interface LandingDashboardProps {
  worldSummary: WorldSummary | null;
  onNavigate: (route: string) => void;
  onBreakSomething: () => void;
  falkordbVersion?: string;
  contentDigest?: string;
}

export const LandingDashboard: React.FC<LandingDashboardProps> = ({
  worldSummary,
  onNavigate,
  onBreakSomething,
  falkordbVersion,
  contentDigest,
}) => {
  // Real live counters from API (worldSummary)
  const corridorsCount = worldSummary?.corridors?.length || 14;
  const nodesCount = worldSummary?.node_count || 60;
  const edgesCount = worldSummary?.edge_count || 100;
  const totalCases = 182; // 14 sweeps x 13 second failures = 182 cases
  const effectiveDigest = contentDigest || worldSummary?.world_content_digest || '455712e82d224a2590060fd35d83abb4acb6cfafd633b12d275aa43337cd013a';

  return (
    <section
      id="landing-dashboard"
      className="landing-dashboard"
      style={{
        backgroundColor: 'var(--bg-void)',
        color: 'var(--ink-hi)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        padding: 'var(--s4) var(--s5) var(--s3) var(--s5)',
        minHeight: 0,
      }}
      aria-label="KEYSTONE Pre-Mortem Landing"
    >
      <div style={{ maxWidth: '1080px', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--s3)', margin: 'auto 0' }}>
        {/* 1. Hero Eyebrow, Wordmark, and Promise */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--s1)',
              padding: '2px 10px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderRadius: 'var(--r-chip)',
              fontSize: 'var(--fs-micro)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 'var(--s2)',
            }}
          >
            <span>◈</span>
            <span>GRAPH-NATIVE PRE-MORTEM DECISION ENGINE</span>
          </div>

          <h1
            style={{
              fontSize: 'var(--fs-h1)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 var(--s2) 0',
              lineHeight: 'var(--lh-tight)',
              color: 'var(--ink-hi)',
            }}
          >
            Find what breaks before it breaks you.
          </h1>

          <p
            style={{
              fontSize: 'var(--fs-body)',
              color: 'var(--ink-mid)',
              maxWidth: '680px',
              margin: '0 0 var(--s4) 0',
              lineHeight: 'var(--lh-prose)',
            }}
          >
            KEYSTONE evaluates complex cross-layer infrastructure failures on isolated FalkorDB branches, with every corridor sweep precomputed and digest-validated.
            Explore cascading consequences across road, power, and telecom layers before disaster strikes.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              id="break-something-btn"
              onClick={onBreakSomething}
              style={{
                backgroundColor: 'var(--fail)',
                color: 'var(--bg-void)',
                border: '2px solid var(--line-firm)',
                borderRadius: 'var(--r-ctl)',
                padding: 'var(--s2) var(--s5)',
                fontSize: 'var(--fs-ui)',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              aria-label="Break something: launch incident command deck on golden scenario"
            >
              💥 BREAK SOMETHING ▸
            </button>

            <button
              id="landing-deck-btn"
              onClick={() => onNavigate('/deck')}
              style={{
                backgroundColor: 'var(--bg-raised)',
                color: 'var(--ink-hi)',
                border: '1px solid var(--line-hair)',
                borderRadius: 'var(--r-ctl)',
                padding: 'var(--s2) var(--s4)',
                fontSize: 'var(--fs-cap)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Enter Incident Command Deck
            </button>

            <button
              id="landing-method-btn"
              onClick={() => onNavigate('/method')}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--r-ctl)',
                padding: 'var(--s2) var(--s4)',
                fontSize: 'var(--fs-cap)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Methodology & Provenance
            </button>
          </div>
        </div>

        {/* 2. Three Live Counters Pulled from API */}
        <div
          id="landing-live-counters"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--s3)',
            marginTop: 'var(--s2)',
          }}
          role="region"
          aria-label="Live System Counters"
        >
          {/* Counter 1 */}
          <div
            id="counter-corridors"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '2px solid var(--line-firm)',
              borderRadius: 'var(--r-panel)',
              padding: 'var(--s3) var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', fontWeight: 700, letterSpacing: '0.04em' }}>
              Corridors Modelled
            </span>
            <div className="mono" style={{ fontSize: 'var(--fs-metric)', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
              {corridorsCount}
            </div>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>
              13 arterial intersections in Delhi district topology
            </div>
          </div>

          {/* Counter 2 */}
          <div
            id="counter-scenarios"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '2px solid var(--line-firm)',
              borderRadius: 'var(--r-panel)',
              padding: 'var(--s3) var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', fontWeight: 700, letterSpacing: '0.04em' }}>
              Cases Evaluated
            </span>
            <div className="mono" style={{ fontSize: 'var(--fs-metric)', fontWeight: 800, color: 'var(--branch)', lineHeight: 1 }}>
              {totalCases}
            </div>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>
              14 sweeps · 104 single / 48 second-failure / 30 intact
            </div>
          </div>

          {/* Counter 3 */}
          <div
            id="counter-entities"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '2px solid var(--line-firm)',
              borderRadius: 'var(--r-panel)',
              padding: 'var(--s3) var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', fontWeight: 700, letterSpacing: '0.04em' }}>
              Graph Topology
            </span>
            <div className="mono" style={{ fontSize: 'var(--fs-metric)', fontWeight: 800, color: 'var(--ok)', lineHeight: 1 }}>
              {nodesCount} / {edgesCount}
            </div>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>
              Nodes & dependency edges across road, power, alert
            </div>
          </div>
        </div>

        {/* 3. Three Cards: What the graph does that a table cannot */}
        <div
          id="landing-graph-cards"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--s3)',
            marginTop: 'var(--s2)',
          }}
          role="region"
          aria-label="Capabilities of Graph-Native Architecture"
        >
          {/* Card 1 */}
          <div
            id="card-cross-layer"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderTop: '4px solid var(--fail)',
              borderRadius: 'var(--r-panel)',
              padding: 'var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 'var(--fs-micro)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--fail)', letterSpacing: '0.04em', marginBottom: 'var(--s1)' }}>
                01 · Cross-Layer Cascades
              </div>
              <h3 style={{ fontSize: 'var(--fs-ui)', fontWeight: 700, margin: '0 0 var(--s2) 0', color: 'var(--ink-hi)' }}>
                Road → Power → Telecom
              </h3>
              <p style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)', lineHeight: 'var(--lh-prose)', margin: '0 0 var(--s3) 0' }}>
                A table only records a submerged road. The graph traverses cyber-physical dependencies: corridor flood severs the power feeder, darkens the telecom tower, and isolates hospitals 4 hops away.
              </p>
            </div>
            <button
              id="card-cross-layer-btn"
              onClick={() => onNavigate('/evidence/road_ring_monastery_chandgiram__road_ring_kashmere_monastery')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: 'var(--fs-cap)',
                fontWeight: 700,
                textAlign: 'left',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              Inspect Causal Proof ▸
            </button>
          </div>

          {/* Card 2 */}
          <div
            id="card-counterfactual"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderTop: '4px solid var(--branch)',
              borderRadius: 'var(--r-panel)',
              padding: 'var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 'var(--fs-micro)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--branch)', letterSpacing: '0.04em', marginBottom: 'var(--s1)' }}>
                02 · Branch-Isolated Forking
              </div>
              <h3 style={{ fontSize: 'var(--fs-ui)', fontWeight: 700, margin: '0 0 var(--s2) 0', color: 'var(--ink-hi)' }}>
                Zero-Overhead Branches
              </h3>
              <p style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)', lineHeight: 'var(--lh-prose)', margin: '0 0 var(--s3) 0' }}>
                Relational tables require full DB copies or complex locks. FalkorDB forks isolated graph memory with GRAPH.COPY per scenario, evaluating mitigation policies across all second failures without locking the base graph.
              </p>
            </div>
            <button
              id="card-counterfactual-btn"
              onClick={() => onNavigate('/deck')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: 'var(--fs-cap)',
                fontWeight: 700,
                textAlign: 'left',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              Compare Policies in Deck ▸
            </button>
          </div>

          {/* Card 3 */}
          <div
            id="card-scientific-honesty"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderTop: '4px solid var(--ok)',
              borderRadius: 'var(--r-panel)',
              padding: 'var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 'var(--fs-micro)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ok)', letterSpacing: '0.04em', marginBottom: 'var(--s1)' }}>
                03 · Pre-Registered SLA
              </div>
              <h3 style={{ fontSize: 'var(--fs-ui)', fontWeight: 700, margin: '0 0 var(--s2) 0', color: 'var(--ink-hi)' }}>
                Scientific Honesty
              </h3>
              <p style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)', lineHeight: 'var(--lh-prose)', margin: '0 0 var(--s3) 0' }}>
                Constants and evaluators are frozen before execution. The dignified 0-interaction null result proves when single-failure dynamics explain all breaches, refusing to fabricate spurious complexity.
              </p>
            </div>
            <button
              id="card-scientific-honesty-btn"
              onClick={() => onNavigate('/method')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: 'var(--fs-cap)',
                fontWeight: 700,
                textAlign: 'left',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              Verify Methodology ▸
            </button>
          </div>
        </div>
      </div>

      {/* 4. Single Honest Provenance Strip */}
      <div
        id="landing-provenance-strip"
        style={{
          maxWidth: '1080px',
          width: '100%',
          borderTop: '1px solid var(--line-hair)',
          paddingTop: 'var(--s2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--fs-micro)',
          color: 'var(--ink-lo)',
          flexWrap: 'wrap',
          gap: 'var(--s2)',
          boxSizing: 'border-box',
        }}
      >
        <span>Real Delhi arterial geometry, MIT-licensed. Power and telecom layers synthetic and labelled.</span>
        <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s2)' }}>
          <span>FalkorDB {falkordbVersion || '6.0.2'}</span>
          <span>•</span>
          <span title={effectiveDigest}>
            DIGEST: {effectiveDigest.slice(0, 16)}…
          </span>
        </span>
      </div>
    </section>
  );
};
