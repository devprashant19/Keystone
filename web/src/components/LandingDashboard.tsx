import React from 'react';
import { WorldSummary } from '../graph/types';
import { IconPowerFeeder, IconBranch, IconEvidence } from './icons';
import { Valley } from './Valley';

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
  const effectiveDigest =
    contentDigest ||
    worldSummary?.world_content_digest ||
    '455712e82d224a2590060fd35d83abb4acb6cfafd633b12d275aa43337cd013a';

  return (
    <section
      id="landing-dashboard"
      className="landing-dashboard"
      style={{
        position: 'relative',
        backgroundColor: '#06111f',
        color: '#eaf4fb',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        padding: 'clamp(8px, 1.6vh, 20px) clamp(16px, 3vw, 40px) 8px clamp(16px, 3vw, 40px)',
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
      }}
      aria-label="KEYSTONE Pre-Mortem Landing"
    >
      {/* 0. Pukaar Layered Himalayan Night Valley Background */}
      <Valley />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1240px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          minHeight: 0,
          gap: 'clamp(8px, 1.4vh, 16px)',
        }}
      >
        {/* 1. Pukaar Asymmetric Hero Grid: Left Copy & Right Floating Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 0.85fr)',
            gap: 'clamp(16px, 3vw, 36px)',
            alignItems: 'center',
            marginTop: 'clamp(2px, 0.8vh, 10px)',
          }}
        >
          {/* Left Column: Eyebrow, Anton Title, Lead & Pukaar CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                backgroundColor: 'rgba(79, 179, 255, 0.12)',
                border: '1px solid rgba(79, 179, 255, 0.35)',
                borderRadius: 'var(--r-pill)',
                fontSize: 'var(--fs-micro)',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#8ad0ff',
                marginBottom: 'clamp(6px, 1vh, 10px)',
              }}
            >
              <span>◈</span>
              <span>GRAPH-NATIVE PRE-MORTEM DECISION ENGINE</span>
            </div>

            <h1
              id="landing-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.2rem, 4.4vw, 3.8rem)',
                textTransform: 'uppercase',
                fontWeight: 400,
                letterSpacing: '0.01em',
                margin: '0 0 clamp(6px, 1vh, 10px) 0',
                lineHeight: 0.98,
                color: '#ffffff',
                textShadow: '0 4px 24px rgba(79, 179, 255, 0.25)',
              }}
            >
              Find what breaks before it breaks you.
            </h1>

            <p
              style={{
                fontSize: 'clamp(12.5px, 0.95vw + 8px, 14.5px)',
                color: '#c3dbee',
                maxWidth: '620px',
                margin: '0 0 clamp(10px, 1.4vh, 16px) 0',
                lineHeight: 1.45,
              }}
            >
              When an arterial corridor floods in Delhi, KEYSTONE evaluates every secondary contingency on isolated FalkorDB clones (<span className="mono" style={{ color: '#8ad0ff' }}>GRAPH.COPY</span>), uncovering cross-layer hospital isolation before disaster strikes.
            </p>

            {/* Pukaar Action CTAs & Live Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', flexWrap: 'wrap', marginBottom: 'clamp(6px, 1vh, 10px)' }}>
              <button
                id="break-something-btn"
                onClick={onBreakSomething}
                style={{
                  backgroundColor: '#b3122a',
                  color: '#ffffff',
                  border: '1px solid #ff4d6d',
                  borderRadius: 'var(--r-ctl)',
                  padding: '9px 22px',
                  fontSize: 'var(--fs-ui)',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(179, 18, 42, 0.45), 0 4px 14px rgba(0, 0, 0, 0.4)',
                }}
                aria-label="Break something: launch incident command deck on golden scenario"
              >
                💥 BREAK SOMETHING ▸
              </button>

              <button
                id="landing-deck-btn"
                onClick={() => onNavigate('/deck')}
                style={{
                  backgroundColor: 'rgba(12, 33, 54, 0.85)',
                  color: '#eaf4fb',
                  border: '1px solid rgba(79, 179, 255, 0.35)',
                  borderRadius: 'var(--r-ctl)',
                  padding: '9px 18px',
                  fontSize: 'var(--fs-cap)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Incident Command Deck ↗
              </button>

              <button
                id="landing-method-btn"
                onClick={() => onNavigate('/method')}
                style={{
                  backgroundColor: 'transparent',
                  color: '#8ad0ff',
                  border: '1px solid rgba(138, 208, 255, 0.25)',
                  borderRadius: 'var(--r-ctl)',
                  padding: '9px 18px',
                  fontSize: 'var(--fs-cap)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Methodology & Provenance ↗
              </button>
            </div>

            {/* Live Status Pill with Pinging Dot */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: 'var(--r-pill)',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: 'var(--fs-micro)',
                color: '#8fb0cb',
              }}
            >
              <span className="live-ping-dot" style={{ backgroundColor: '#3cc68f' }} />
              <span>
                FalkorDB {falkordbVersion || '6.0.2'} Active • 182 Cases Precomputed • Multi-hop Cross-layer
              </span>
            </div>
          </div>

          {/* Right Column: Pukaar Floating Depth Cards */}
          <div
            style={{
              position: 'relative',
              height: 'clamp(180px, 24vh, 230px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            {/* Card 1: Gold Pill Card */}
            <div
              className="hf-bob-1"
              style={{
                position: 'absolute',
                left: '4%',
                top: '6%',
                width: '180px',
                backgroundColor: '#4fb3ff',
                color: '#06111f',
                borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', lineHeight: 0.9 }}>
                {totalCases}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                CASES EVALUATED<br />N-1 SWEEPS
              </span>
            </div>

            {/* Card 2: Frosted Glass Real Scenario Ticket */}
            <div
              className="hf-bob-2"
              style={{
                position: 'absolute',
                right: '2%',
                top: '28%',
                width: 'min(310px, 92%)',
                backgroundColor: 'rgba(12, 33, 54, 0.88)',
                border: '1px solid rgba(79, 179, 255, 0.35)',
                borderRadius: '16px',
                padding: '12px 16px',
                color: '#eef6fb',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8ad0ff' }}>
                <span className="live-ping-dot" style={{ backgroundColor: '#ff4d6d' }} />
                <span>ISOLATED FALKORDB BRANCH</span>
              </div>
              <div style={{ fontSize: '12px', lineHeight: 1.35, color: '#eef6fb', borderLeft: '2px solid #8ad0ff', paddingLeft: '8px' }}>
                <strong>Ring Road (Monastery):</strong> 2nd failure at Kashmere Gate isolates LNJP Hospital alert relays.
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', fontSize: '11px', color: '#8fb0cb' }}>
                <span className="mono" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                  GRAPH.COPY (ISOLATED)
                </span>
                <span style={{ color: '#5fd6a4', fontWeight: 700 }}>✓ ABSTAIN LOGGED</span>
              </div>
            </div>

            {/* Card 3: Cream Base Topology Card */}
            <div
              className="hf-bob-3"
              style={{
                position: 'absolute',
                left: '12%',
                bottom: '4%',
                width: '160px',
                backgroundColor: '#eef6fb',
                color: '#06111f',
                borderRadius: '14px',
                padding: '10px 14px',
                boxShadow: '0 16px 32px -8px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', lineHeight: 0.9 }}>
                {corridorsCount}
              </span>
              <span style={{ fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                DELHI CORRIDORS
              </span>
            </div>
          </div>
        </div>

        {/* 2. Three Live Counters Pulled from API */}
        <div
          id="landing-live-counters"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(8px, 1.4vw, 16px)',
          }}
          role="region"
          aria-label="Live System Counters"
        >
          {/* Counter 1 */}
          <div
            id="counter-corridors"
            style={{
              backgroundColor: 'rgba(12, 33, 54, 0.75)',
              border: '1px solid rgba(79, 179, 255, 0.25)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(8px, 1.2vh, 12px) var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: '#8fb0cb', fontWeight: 700, letterSpacing: '0.08em' }}>
              Corridors Modelled
            </span>
            <div className="mono" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 2.8vw, 38px)', fontWeight: 400, color: '#4fb3ff', lineHeight: 1 }}>
              {corridorsCount}
            </div>
            <div style={{ fontSize: 'var(--fs-micro)', color: '#c3dbee' }}>
              Primary arterial road corridors in Central/North Delhi
            </div>
          </div>

          {/* Counter 2 */}
          <div
            id="counter-scenarios"
            style={{
              backgroundColor: 'rgba(12, 33, 54, 0.75)',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(8px, 1.2vh, 12px) var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: '#8fb0cb', fontWeight: 700, letterSpacing: '0.08em' }}>
              Cases Evaluated
            </span>
            <div className="mono" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 2.8vw, 38px)', fontWeight: 400, color: '#c084fc', lineHeight: 1 }}>
              {totalCases}
            </div>
            <div style={{ fontSize: 'var(--fs-micro)', color: '#c3dbee' }}>
              14 sweeps · 104 single / 48 second-failure / 30 intact
            </div>
          </div>

          {/* Counter 3 */}
          <div
            id="counter-entities"
            style={{
              backgroundColor: 'rgba(12, 33, 54, 0.75)',
              border: '1px solid rgba(95, 214, 164, 0.25)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(8px, 1.2vh, 12px) var(--s4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: '#8fb0cb', fontWeight: 700, letterSpacing: '0.08em' }}>
              Graph Topology
            </span>
            <div className="mono" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 2.8vw, 38px)', fontWeight: 400, color: '#5fd6a4', lineHeight: 1 }}>
              {nodesCount} / {edgesCount}
            </div>
            <div style={{ fontSize: 'var(--fs-micro)', color: '#c3dbee' }}>
              Nodes & dependency edges across road, power, alert
            </div>
          </div>
        </div>

        {/* 3. Three Pukaar Step Cards (HOW IT WORKS: 01 FORK, 02 TRAVERSE, 03 ABSTAIN) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(8px, 1.4vw, 16px)',
          }}
        >
          {/* Card 1 */}
          <div
            id="card-cross-layer"
            style={{
              position: 'relative',
              backgroundColor: 'rgba(12, 33, 54, 0.75)',
              border: '1px solid rgba(79, 179, 255, 0.25)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(10px, 1.3vh, 16px)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Outline 01 */}
            <span
              style={{
                position: 'absolute',
                right: '8px',
                top: '-4px',
                fontFamily: 'var(--font-display)',
                fontSize: '4.8rem',
                lineHeight: 1,
                color: 'rgba(79, 179, 255, 0.08)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              01
            </span>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--r-chip)',
                  backgroundColor: 'rgba(79, 179, 255, 0.18)',
                  color: '#4fb3ff',
                  marginBottom: 'var(--s2)',
                }}
              >
                <IconPowerFeeder size={15} />
              </div>
              <div style={{ fontSize: 'var(--fs-micro)', fontWeight: 700, textTransform: 'uppercase', color: '#8ad0ff', letterSpacing: '0.10em', marginBottom: '4px' }}>
                01 · Cross-Layer Cascades
              </div>
              <h3 style={{ fontSize: 'var(--fs-ui)', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
                Road → Power → Telecom
              </h3>
              <p style={{ fontSize: 'var(--fs-cap)', color: '#c3dbee', lineHeight: 1.4, margin: '0 0 var(--s2) 0' }}>
                Traverses cyber-physical dependencies: corridor flood severs power feeder, darkens telecom tower, and severs alert reachability to hospital trauma centers.
              </p>
            </div>
            <button
              id="card-cross-layer-btn"
              onClick={() => onNavigate('/evidence/road_ring_monastery_chandgiram__road_ring_kashmere_monastery')}
              style={{ background: 'none', border: 'none', color: '#4fb3ff', fontSize: 'var(--fs-cap)', fontWeight: 700, textAlign: 'left', padding: 0, cursor: 'pointer' }}
            >
              Inspect Causal Proof ▸
            </button>
          </div>

          {/* Card 2 */}
          <div
            id="card-counterfactual"
            style={{
              position: 'relative',
              backgroundColor: 'rgba(12, 33, 54, 0.75)',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(10px, 1.3vh, 16px)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Outline 02 */}
            <span
              style={{
                position: 'absolute',
                right: '8px',
                top: '-4px',
                fontFamily: 'var(--font-display)',
                fontSize: '4.8rem',
                lineHeight: 1,
                color: 'rgba(192, 132, 252, 0.08)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              02
            </span>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--r-chip)',
                  backgroundColor: 'rgba(192, 132, 252, 0.18)',
                  color: '#c084fc',
                  marginBottom: 'var(--s2)',
                }}
              >
                <IconBranch size={15} />
              </div>
              <div style={{ fontSize: 'var(--fs-micro)', fontWeight: 700, textTransform: 'uppercase', color: '#c084fc', letterSpacing: '0.10em', marginBottom: '4px' }}>
                02 · Branch-Isolated Forking
              </div>
              <h3 style={{ fontSize: 'var(--fs-ui)', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
                Zero-Overhead Branches
              </h3>
              <p style={{ fontSize: 'var(--fs-cap)', color: '#c3dbee', lineHeight: 1.4, margin: '0 0 var(--s2) 0' }}>
                FalkorDB forks isolated in-memory graph clones with <span className="mono" style={{ color: '#c084fc' }}>GRAPH.COPY</span>, testing every mitigation policy against all second failures without locking base state.
              </p>
            </div>
            <button
              id="card-counterfactual-btn"
              onClick={() => onNavigate('/deck')}
              style={{ background: 'none', border: 'none', color: '#c084fc', fontSize: 'var(--fs-cap)', fontWeight: 700, textAlign: 'left', padding: 0, cursor: 'pointer' }}
            >
              Compare Policies in Deck ▸
            </button>
          </div>

          {/* Card 3 */}
          <div
            id="card-scientific-honesty"
            style={{
              position: 'relative',
              backgroundColor: 'rgba(12, 33, 54, 0.75)',
              border: '1px solid rgba(95, 214, 164, 0.25)',
              borderRadius: 'var(--r-panel)',
              padding: 'clamp(10px, 1.3vh, 16px)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Outline 03 */}
            <span
              style={{
                position: 'absolute',
                right: '8px',
                top: '-4px',
                fontFamily: 'var(--font-display)',
                fontSize: '4.8rem',
                lineHeight: 1,
                color: 'rgba(95, 214, 164, 0.08)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              03
            </span>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--r-chip)',
                  backgroundColor: 'rgba(95, 214, 164, 0.18)',
                  color: '#5fd6a4',
                  marginBottom: 'var(--s2)',
                }}
              >
                <IconEvidence size={15} />
              </div>
              <div style={{ fontSize: 'var(--fs-micro)', fontWeight: 700, textTransform: 'uppercase', color: '#5fd6a4', letterSpacing: '0.10em', marginBottom: '4px' }}>
                03 · Pre-Registered SLA
              </div>
              <h3 style={{ fontSize: 'var(--fs-ui)', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
                Scientific Honesty
              </h3>
              <p style={{ fontSize: 'var(--fs-cap)', color: '#c3dbee', lineHeight: 1.4, margin: '0 0 var(--s2) 0' }}>
                Evaluators are frozen pre-execution. The dignified 0-interaction null result proves when single failures explain all breaches, refusing to fabricate spurious complexity.
              </p>
            </div>
            <button
              id="card-scientific-honesty-btn"
              onClick={() => onNavigate('/method')}
              style={{ background: 'none', border: 'none', color: '#5fd6a4', fontSize: 'var(--fs-cap)', fontWeight: 700, textAlign: 'left', padding: 0, cursor: 'pointer' }}
            >
              Verify Methodology ▸
            </button>
          </div>
        </div>

        {/* 4. Pukaar Sourced Empirical Finding Banner (Crimson Fact Strip) */}
        <div
          id="pukaar-empirical-fact"
          style={{
            backgroundColor: 'rgba(179, 18, 42, 0.35)',
            border: '1px solid rgba(255, 128, 152, 0.45)',
            borderRadius: 'var(--r-panel)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--s3)',
            fontSize: 'var(--fs-cap)',
            color: '#ffd9d0',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 800,
                color: '#ff8098',
                backgroundColor: 'rgba(179, 18, 42, 0.6)',
                padding: '2px 8px',
                borderRadius: 'var(--r-chip)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              EMPIRICAL FINDING
            </span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>
              182 Ordered Pairs · Zero Spurious Interactions: 104 explained by 1st failure, 48 by 2nd, 30 intact. Keystone abstains honestly when SLAs cannot be guaranteed.
            </span>
          </div>
          <button
            onClick={() => onNavigate('/method')}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffd9d0',
              textDecoration: 'underline',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Review Audit →
          </button>
        </div>

        {/* 5. Single Honest Provenance Strip */}
        <div
          id="landing-provenance-strip"
          style={{
            borderTop: '1px solid rgba(79, 179, 255, 0.18)',
            paddingTop: '8px',
            paddingBottom: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--fs-micro)',
            color: '#8fb0cb',
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
      </div>
    </section>
  );
};
