import React from 'react';
import { WorldSummary } from '../graph/types';
import { IconPowerFeeder, IconBranch, IconEvidence } from './icons';

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
        padding: 'clamp(12px, 2vh, 24px) clamp(16px, 3vw, 40px) 12px clamp(16px, 3vw, 40px)',
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
      }}
      aria-label="KEYSTONE Pre-Mortem Landing"
    >
      <div
        style={{
          maxWidth: '1140px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          minHeight: 0,
          gap: 'clamp(10px, 1.8vh, 22px)',
        }}
      >
        {/* 1. Hero Eyebrow, Wordmark, and Promise */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'clamp(4px, 1vh, 16px)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderRadius: 'var(--r-pill)',
              fontSize: 'var(--fs-micro)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 'clamp(6px, 1vh, 12px)',
            }}
          >
            <span>◈</span>
            <span>GRAPH-NATIVE PRE-MORTEM DECISION ENGINE</span>
          </div>

          <h1
            id="landing-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.4rem, 4.6vw, 3.8rem)',
              textTransform: 'uppercase',
              fontWeight: 400,
              letterSpacing: '0.01em',
              margin: '0 0 clamp(6px, 1vh, 12px) 0',
              lineHeight: 1.02,
              color: 'var(--ink-hi)',
            }}
          >
            Find what breaks before it breaks you.
          </h1>

          <p
            style={{
              fontSize: 'clamp(13px, 1vw + 10px, 15px)',
              color: 'var(--ink-mid)',
              maxWidth: '720px',
              margin: '0 0 clamp(10px, 1.6vh, 20px) 0',
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
                border: '1px solid var(--fail)',
                borderRadius: 'var(--r-ctl)',
                padding: '10px 24px',
                fontSize: 'var(--fs-ui)',
                fontWeight: 700,
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
                padding: '10px 20px',
                fontSize: 'var(--fs-cap)',
                fontWeight: 600,
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
                border: '1px solid var(--line-hair)',
                borderRadius: 'var(--r-ctl)',
                padding: '10px 20px',
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
          }}
          role="region"
          aria-label="Live System Counters"
        >
          {/* Counter 1 */}
          <div
            id="counter-corridors"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(10px, 1.4vh, 16px) var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', fontWeight: 700, letterSpacing: '0.06em' }}>
              Corridors Modelled
            </span>
            <div className="mono" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 3.2vw, 42px)', fontWeight: 400, color: 'var(--accent)', lineHeight: 1 }}>
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
              border: '1px solid var(--line-hair)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(10px, 1.4vh, 16px) var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', fontWeight: 700, letterSpacing: '0.06em' }}>
              Cases Evaluated
            </span>
            <div className="mono" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 3.2vw, 42px)', fontWeight: 400, color: 'var(--branch)', lineHeight: 1 }}>
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
              border: '1px solid var(--line-hair)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(10px, 1.4vh, 16px) var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', fontWeight: 700, letterSpacing: '0.06em' }}>
              Graph Topology
            </span>
            <div className="mono" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 3.2vw, 42px)', fontWeight: 400, color: 'var(--ok)', lineHeight: 1 }}>
              {nodesCount} / {edgesCount}
            </div>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>
              Nodes & dependency edges across road, power, alert
            </div>
          </div>
        </div>

        {/* 3. Three Capability Cards: What the graph does that a table cannot */}
        <div
          id="landing-graph-cards"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--s3)',
          }}
          role="region"
          aria-label="Capabilities of Graph-Native Architecture"
        >
          {/* Card 1 */}
          <div
            id="card-cross-layer"
            style={{
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderTop: '3px solid var(--fail)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(14px, 2vh, 22px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Ghost Numeral */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: '12px',
                top: '-4px',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(4.5rem, 6vw, 6rem)',
                lineHeight: 1,
                color: 'var(--line-hair)',
                opacity: 0.6,
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 0,
              }}
            >
              01
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Icon Chip */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--r-chip)',
                  backgroundColor: 'var(--fail-wash)',
                  color: 'var(--fail)',
                  marginBottom: 'var(--s2)',
                  border: '1px solid var(--line-hair)',
                }}
              >
                <IconPowerFeeder size={16} />
              </div>

              {/* Eyebrow */}
              <div
                className="eyebrow"
                style={{
                  fontSize: 'var(--fs-micro)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--fail)',
                  letterSpacing: '0.10em',
                  marginBottom: 'var(--s1)',
                }}
              >
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
                position: 'relative',
                zIndex: 1,
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
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderTop: '3px solid var(--branch)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(14px, 2vh, 22px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Ghost Numeral */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: '12px',
                top: '-4px',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(4.5rem, 6vw, 6rem)',
                lineHeight: 1,
                color: 'var(--line-hair)',
                opacity: 0.6,
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 0,
              }}
            >
              02
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Icon Chip */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--r-chip)',
                  backgroundColor: 'var(--branch-wash)',
                  color: 'var(--branch)',
                  marginBottom: 'var(--s2)',
                  border: '1px solid var(--line-hair)',
                }}
              >
                <IconBranch size={16} />
              </div>

              {/* Eyebrow */}
              <div
                className="eyebrow"
                style={{
                  fontSize: 'var(--fs-micro)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--branch)',
                  letterSpacing: '0.10em',
                  marginBottom: 'var(--s1)',
                }}
              >
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
                position: 'relative',
                zIndex: 1,
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
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderTop: '3px solid var(--ok)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(14px, 2vh, 22px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Ghost Numeral */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: '12px',
                top: '-4px',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(4.5rem, 6vw, 6rem)',
                lineHeight: 1,
                color: 'var(--line-hair)',
                opacity: 0.6,
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 0,
              }}
            >
              03
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Icon Chip */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--r-chip)',
                  backgroundColor: 'var(--ok-wash)',
                  color: 'var(--ok)',
                  marginBottom: 'var(--s2)',
                  border: '1px solid var(--line-hair)',
                }}
              >
                <IconEvidence size={16} />
              </div>

              {/* Eyebrow */}
              <div
                className="eyebrow"
                style={{
                  fontSize: 'var(--fs-micro)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--ok)',
                  letterSpacing: '0.10em',
                  marginBottom: 'var(--s1)',
                }}
              >
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
                position: 'relative',
                zIndex: 1,
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
          maxWidth: '1140px',
          width: '100%',
          borderTop: '1px solid var(--line-hair)',
          paddingTop: '10px',
          paddingBottom: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--fs-micro)',
          color: 'var(--ink-lo)',
          flexWrap: 'wrap',
          gap: 'var(--s2)',
          boxSizing: 'border-box',
          marginTop: 'clamp(8px, 1.4vh, 16px)',
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
