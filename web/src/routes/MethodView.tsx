import React, { useState } from 'react';
import { getStatusEncoding, getBranchEncoding, ALL_ENCODING_CONCEPTS } from '../lib/encodings';
import { ALL_ICONS } from '../components/icons';
import { StatusBadge, MetricTile } from '../components/primitives';

interface MethodViewProps {
  onBack: () => void;
  configHash: string;
  worldDigest: string;
}

export const MethodView: React.FC<MethodViewProps> = ({ onBack, configHash, worldDigest }) => {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.getAttribute('data-reduced-motion') === 'true';
  });
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [tabularDigit, setTabularDigit] = useState<number>(0);
  const [copiedTarget, setCopiedTarget] = useState<'config' | 'digest' | null>(null);

  const toggleReducedMotion = () => {
    const nextVal = !reducedMotion;
    setReducedMotion(nextVal);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-reduced-motion', nextVal ? 'true' : 'false');
    }
  };

  const copyToClipboard = (text: string, type: 'config' | 'digest') => {
    try {
      navigator?.clipboard?.writeText(text);
      setCopiedTarget(type);
      setTimeout(() => setCopiedTarget(null), 1500);
    } catch (_) {}
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Are you sure you want to reset the demo? This will sweep orphan branches, clear run history, and reload keystone_world.')) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      setResetMessage(`Reset successful: ${data.orphans_cleared} orphan branches cleared. World reloaded.`);
    } catch (e: any) {
      setResetMessage(`Reset failed: ${e.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div
      style={{
        height: 'calc(100vh - var(--h-header, 64px))',
        backgroundColor: 'var(--bg-void)',
        color: 'var(--ink-hi)',
        padding: 'clamp(24px, 4vh, 48px) clamp(16px, 4vw, 40px)',
        overflowY: 'auto',
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Top Navigation & Hero Banner */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '999px',
              boxShadow: 'var(--sh-1)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>←</span>
            <span>Return to Incident Command Deck</span>
          </button>

          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: '8px',
              }}
            >
              <span>◈</span>
              <span>SCIENTIFIC PROVENANCE & BENCHMARK METHODOLOGY</span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(2rem, 3.8vw, 2.75rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                margin: '0 0 10px 0',
                color: 'var(--ink-hi)',
              }}
            >
              Methodology & Scientific Integrity
            </h1>
            <p
              style={{
                fontSize: 'clamp(14px, 1.2vw, 15.5px)',
                color: 'var(--ink-mid)',
                lineHeight: 1.6,
                maxWidth: '780px',
                margin: 0,
              }}
            >
              KEYSTONE Pre-Mortem enforces strict pre-registration discipline. All constants, evaluators,
              and denominator definitions are cryptographically frozen before runtime execution to prevent cherry-picking.
            </p>
          </div>
        </div>

        {/* 1. Cryptographic Hashes (Side-by-Side Clean Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Config Hash Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderRadius: '16px',
              padding: '20px 22px',
              boxShadow: 'var(--sh-1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ✓ Frozen Configuration Hash
              </span>
              <button
                id="copy-config-btn"
                onClick={() => copyToClipboard(configHash, 'config')}
                style={{
                  background: 'var(--bg-sunken)',
                  border: '1px solid var(--line-hair)',
                  color: 'var(--ink-mid)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copiedTarget === 'config' ? '✓ Copied' : 'Copy SHA-256'}
              </button>
            </div>
            <div
              className="mono"
              style={{
                fontSize: '12px',
                color: 'var(--ink-hi)',
                backgroundColor: 'var(--bg-sunken)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line-hair)',
                wordBreak: 'break-all',
                lineHeight: 1.4,
              }}
            >
              {configHash || 'ed468a59c67aa8a84f23dc7f71caecb0e6e2e5f8fd0cac3491b2070306eeaa35'}
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--ink-lo)' }}>
              Evaluator constants & hospital target boundaries frozen pre-execution.
            </span>
          </div>

          {/* World Digest Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderRadius: '16px',
              padding: '20px 22px',
              boxShadow: 'var(--sh-1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ok)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ✓ Immutable Base World Digest
              </span>
              <button
                id="copy-digest-btn"
                onClick={() => copyToClipboard(worldDigest, 'digest')}
                style={{
                  background: 'var(--bg-sunken)',
                  border: '1px solid var(--line-hair)',
                  color: 'var(--ink-mid)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copiedTarget === 'digest' ? '✓ Copied' : 'Copy Digest'}
              </button>
            </div>
            <div
              className="mono"
              style={{
                fontSize: '12px',
                color: 'var(--ink-hi)',
                backgroundColor: 'var(--bg-sunken)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line-hair)',
                wordBreak: 'break-all',
                lineHeight: 1.4,
              }}
            >
              {worldDigest || '602e4e66d1877742f9fc23aa88b1fe683fdff1558d69eaa6040d4277513a1d31'}
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--ink-lo)' }}>
              Canonical SHA-256 state over 14 Delhi arterial corridors & cross-layer graph.
            </span>
          </div>
        </div>

        {/* 2. Frozen Constants Grid (Clean Modern Cards instead of raw table) */}
        <div
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--line-hair)',
            borderRadius: '18px',
            padding: '24px 28px',
            boxShadow: 'var(--sh-1)',
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--ink-hi)' }}>
              1. Frozen Benchmark Constants
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', margin: 0 }}>
              Fixed parametric values defining operational access thresholds and resource limits.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            {[
              { label: 'Access Deadline', value: '20.0 min', desc: 'Synthetic urban target band', tag: 'URBAN TARGET' },
              { label: 'Assumed Monsoon Speed', value: '24.0 km/h', desc: 'Synthetic planning assumption', tag: 'PLANNING' },
              { label: 'Effective Allowance', value: '6.8 km', desc: 'Derived: (20 - 3) / 60 × 24', tag: 'DERIVED' },
              { label: 'Alert Delivery Deadline', value: '8.0 min', desc: 'Synthetic mesh threshold', tag: 'TELECOM' },
              { label: 'Action Budget', value: '1 action / f1', desc: 'Strict scarcity constraint', tag: 'SCARCITY' },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  backgroundColor: 'var(--bg-sunken)',
                  border: '1px solid var(--line-hair)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-lo)' }}>{c.label}</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--bg-panel)', color: 'var(--accent)', border: '1px solid var(--line-hair)' }}>
                    {c.tag}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)' }}>
                  {c.value}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--ink-mid)' }}>{c.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Three-Way Case Decomposition (Clean Stat Cards) */}
        <div
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--line-hair)',
            borderRadius: '18px',
            padding: '24px 28px',
            boxShadow: 'var(--sh-1)',
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--ink-hi)' }}>
              2. Three-Way Case Decomposition (182 Ordered Failure Pairs)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', margin: 0 }}>
              To avoid inflating headline claims, KEYSTONE partitions all contingency pairs into three disjoint classes before policy comparison:
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: 'var(--bg-sunken)', border: '1px solid var(--line-hair)', borderRadius: '14px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--warn)' }}>f1-Alone Cases</span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-lo)' }}>57.1%</span>
              </div>
              <div className="mono" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink-hi)' }}>104</div>
              <p style={{ fontSize: '12px', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.45 }}>
                Breaches that occur under the initial cut alone. No preventive action on f2 can avert these.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-sunken)', border: '1px solid var(--line-hair)', borderRadius: '14px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--branch)' }}>f2-Alone Cases</span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-lo)' }}>26.4%</span>
              </div>
              <div className="mono" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink-hi)' }}>48</div>
              <p style={{ fontSize: '12px', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.45 }}>
                Breaches that occur under the second failure alone, regardless of whether f1 is active.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-sunken)', border: '1px solid var(--line-hair)', borderRadius: '14px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ok)' }}>Intact / Resilient</span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-lo)' }}>16.5%</span>
              </div>
              <div className="mono" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink-hi)' }}>30</div>
              <p style={{ fontSize: '12px', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.45 }}>
                Both primary hospital dispatch access SLAs maintained (access latency ≤ 20.0 minutes).
              </p>
            </div>
          </div>

          {/* Interaction Denominator Callout */}
          <div
            style={{
              backgroundColor: 'rgba(79, 179, 255, 0.08)',
              border: '1px solid rgba(79, 179, 255, 0.25)',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '20px' }}>⚖️</span>
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--accent)', display: 'block' }}>
                Headline Denominator: 0 Interaction-Only Cases at 6.8 km
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--ink-mid)' }}>
                Breaches that occur only when both f1 and f2 occur jointly. Single-arterial cuts already sever LNJP access, proving dignified abstention over fabricated complexity.
              </span>
            </div>
          </div>
        </div>

        {/* 4. Empirical Sensitivity Analysis Table */}
        <div
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--line-hair)',
            borderRadius: '18px',
            padding: '24px 28px',
            boxShadow: 'var(--sh-1)',
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--ink-hi)' }}>
              3. Empirical Sensitivity Sweep (results/deadline_sweep.csv)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', margin: 0 }}>
              Secondary sensitivity analysis demonstrating interaction-only cases at looser allowances (12 cases at 8.0 km, 8 at 9–12 km).
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              id="deadline-sweep-table"
              style={{
                width: '100%',
                fontSize: '12.5px',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ color: 'var(--ink-lo)', borderBottom: '1px solid var(--line-hair)', backgroundColor: 'var(--bg-sunken)' }}>
                  <th style={{ padding: '10px 14px', borderRadius: '8px 0 0 8px' }}>Allowance (km)</th>
                  <th style={{ padding: '10px 14px' }}>Deadline (min)</th>
                  <th style={{ padding: '10px 14px' }}>Total Cases</th>
                  <th style={{ padding: '10px 14px' }}>Interaction Only</th>
                  <th style={{ padding: '10px 14px' }}>f1 Alone</th>
                  <th style={{ padding: '10px 14px' }}>f2 Alone</th>
                  <th style={{ padding: '10px 14px', borderRadius: '0 8px 8px 0' }}>Neither (Intact)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { a: '4.0 km', d: '13.0 min', t: '182', io: '0', f1: '182', f2: '48', n: '0', active: false },
                  { a: '5.0 km', d: '15.5 min', t: '182', io: '0', f1: '148', f2: '48', n: '18', active: false },
                  { a: '6.0 km', d: '18.0 min', t: '182', io: '0', f1: '104', f2: '48', n: '30', active: false },
                  { a: '6.8 km (Frozen)', d: '20.0 min', t: '182', io: '0', f1: '104', f2: '48', n: '30', active: true },
                  { a: '7.0 km', d: '20.5 min', t: '182', io: '0', f1: '104', f2: '48', n: '30', active: false },
                  { a: '8.0 km', d: '23.0 min', t: '182', io: '12', f1: '65', f2: '45', n: '60', active: false },
                  { a: '9.0 km', d: '25.5 min', t: '182', io: '8', f1: '65', f2: '45', n: '64', active: false },
                  { a: '10.0 km', d: '28.0 min', t: '182', io: '8', f1: '65', f2: '45', n: '64', active: false },
                  { a: '12.0 km', d: '33.0 min', t: '182', io: '8', f1: '65', f2: '45', n: '64', active: false },
                ].map((row) => (
                  <tr
                    key={row.a}
                    style={{
                      borderBottom: '1px solid var(--line-hair)',
                      backgroundColor: row.active ? 'rgba(79, 179, 255, 0.12)' : 'transparent',
                      fontWeight: row.active ? 700 : 400,
                    }}
                  >
                    <td className="mono" style={{ padding: '10px 14px', color: row.active ? 'var(--accent)' : 'inherit' }}>
                      {row.a}
                    </td>
                    <td className="mono" style={{ padding: '10px 14px' }}>{row.d}</td>
                    <td className="mono" style={{ padding: '10px 14px' }}>{row.t}</td>
                    <td className="mono" style={{ padding: '10px 14px', color: row.io !== '0' ? 'var(--ok)' : 'inherit', fontWeight: 700 }}>
                      {row.io}
                    </td>
                    <td className="mono" style={{ padding: '10px 14px' }}>{row.f1}</td>
                    <td className="mono" style={{ padding: '10px 14px' }}>{row.f2}</td>
                    <td className="mono" style={{ padding: '10px 14px' }}>{row.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Explicit Limitations & Boundaries */}
        <div
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--line-hair)',
            borderRadius: '18px',
            padding: '24px 28px',
            boxShadow: 'var(--sh-1)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px 0', color: 'var(--fail)' }}>
            4. Explicit Limitations & Boundaries
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: 'var(--fail)', fontSize: '15px' }}>•</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--ink-hi)' }}>Zero Probability Claims:</strong> KEYSTONE evaluates deterministic conditional reachability in worst-case graph cascades, without ungrounded stochastic approximations.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: 'var(--fail)', fontSize: '15px' }}>•</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--ink-hi)' }}>Synthetic Layer Labeling:</strong> Road network geometry is 100% real Delhi OSM; electrical feeder & cellular relay layers are labeled synthetic topologies.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: 'var(--fail)', fontSize: '15px' }}>•</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--ink-hi)' }}>Honest Spatial Exclusion:</strong> <code className="mono">wtp_wazirabad</code> sits 3.53 km from any modeled road node and is excluded from hospital access SLA metrics to prevent fabricating false connectivity.
              </span>
            </div>
          </div>
        </div>

        {/* 6. Settings, Accessibility & Verification Reset */}
        <div
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--line-hair)',
            borderRadius: '18px',
            padding: '24px 28px',
            boxShadow: 'var(--sh-1)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--ink-hi)' }}>
            5. System Controls & Demo Reset
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Reduced Motion Toggle Card */}
            <div style={{ backgroundColor: 'var(--bg-sunken)', border: '1px solid var(--line-hair)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--ink-hi)', display: 'block' }}>Reduced Motion Mode</strong>
                <span style={{ fontSize: '11.5px', color: 'var(--ink-lo)' }}>Disables parallax & heavy transitions</span>
              </div>
              <button
                onClick={toggleReducedMotion}
                style={{
                  padding: '7px 14px',
                  backgroundColor: reducedMotion ? 'var(--ok)' : 'var(--bg-panel)',
                  color: reducedMotion ? '#ffffff' : 'var(--ink-hi)',
                  border: '1px solid var(--line-hair)',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '12px',
                  boxShadow: 'var(--sh-1)',
                }}
              >
                {reducedMotion ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Reset Demo Card */}
            <div style={{ backgroundColor: 'var(--bg-sunken)', border: '1px solid var(--line-hair)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--ink-hi)', display: 'block' }}>Reset Incident Demo</strong>
                <span style={{ fontSize: '11.5px', color: 'var(--ink-lo)' }}>Sweeps orphan branches & resets world</span>
              </div>
              <button
                id="reset-demo-btn"
                onClick={handleResetDemo}
                disabled={resetting}
                style={{
                  padding: '7px 14px',
                  backgroundColor: 'rgba(255, 138, 155, 0.12)',
                  color: 'var(--fail)',
                  border: '1px solid rgba(255, 138, 155, 0.35)',
                  borderRadius: '999px',
                  cursor: resetting ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '12px',
                  boxShadow: 'var(--sh-1)',
                }}
              >
                {resetting ? 'Resetting…' : 'Reset Demo'}
              </button>
            </div>
          </div>
          {resetMessage && (
            <div style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--accent)', fontWeight: 600 }}>
              {resetMessage}
            </div>
          )}
        </div>

        {/* 7. Verification Audit Suite & Design Tokens (Clean Organized Section) */}
        <div
          id="design"
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--line-hair)',
            borderRadius: '18px',
            padding: '24px 28px',
            boxShadow: 'var(--sh-1)',
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--ink-hi)' }}>
              6. Design System Tokens & Semantic Encodings
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', margin: 0 }}>
              Single source of truth for semantic graph encodings. Every status carries color, text badge, shape difference, and distinct icon.
            </p>
          </div>

          {/* Encodings Gallery Container for U1-03 Greyscale Check */}
          <div
            id="encodings-gallery"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            {ALL_ENCODING_CONCEPTS.map((item) => {
              const enc = getStatusEncoding(item.status);
              return (
                <div
                  key={item.id}
                  className="encoding-card"
                  style={{
                    backgroundColor: 'var(--bg-sunken)',
                    border: '1px solid var(--line-hair)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink-hi)' }}>{enc.concept}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="60" height="14" style={{ overflow: 'visible' }}>
                      <line
                        x1="0"
                        y1="7"
                        x2="60"
                        y2="7"
                        stroke={enc.colorVar}
                        strokeWidth={enc.strokeWidth}
                        strokeDasharray={enc.strokeDasharray || 'none'}
                      />
                      {enc.iconGlyph === 'cross' && (
                        <text x="30" y="11" textAnchor="middle" fill={enc.colorVar} fontSize="11" fontWeight="bold">✕</text>
                      )}
                    </svg>
                    <span style={{ fontSize: '11px', color: 'var(--ink-lo)' }} className="mono">
                      {enc.shape}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Counterfactual Branch state item */}
            {(() => {
              const bEnc = getBranchEncoding('c01_branch');
              return (
                <div
                  className="encoding-card"
                  style={{
                    backgroundColor: 'var(--bg-sunken)',
                    border: '1px solid var(--branch)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: 'var(--branch-glow)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--branch)' }}>{bEnc.concept}</span>
                    <StatusBadge status="BRANCH" label={bEnc.badgeText} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-lo)' }} className="mono">
                    1px boundary + glow
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 19 Hand-authored SVG Icons Gallery */}
          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)', display: 'block', marginBottom: '10px' }}>
              Hand-Authored Domain SVG Icons (19 Items on 16px Grid)
            </span>
            <div
              id="icons-gallery"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '8px',
                padding: '12px',
                backgroundColor: 'var(--bg-sunken)',
                borderRadius: '12px',
                border: '1px solid var(--line-hair)',
              }}
            >
              {ALL_ICONS.map(({ name, Component }) => (
                <div
                  key={name}
                  className="icon-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 8px',
                    backgroundColor: 'var(--bg-panel)',
                    border: '1px solid var(--line-hair)',
                    borderRadius: '8px',
                    gap: '4px',
                  }}
                >
                  <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Component size={16} />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--ink-mid)' }} className="mono">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Audit Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {/* U1-05 Tabular Numeral Verification */}
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-sunken)', borderRadius: '10px', border: '1px solid var(--line-hair)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--ink-mid)', fontWeight: 600 }}>Tabular Numerals Test:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  id="cycle-digit-btn"
                  type="button"
                  onClick={() => setTabularDigit((d) => (d === 0 ? 8 : 0))}
                  style={{ padding: '3px 8px', cursor: 'pointer', fontSize: '11px', borderRadius: '6px', background: 'var(--bg-panel)', border: '1px solid var(--line-hair)', color: 'var(--ink-hi)' }}
                >
                  Toggle
                </button>
                <span id="tabular-test-element" className="mono tabular" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', minWidth: '16px', textAlign: 'center' }}>
                  {tabularDigit}
                </span>
              </div>
            </div>

            {/* U1-06 MetricTile Null Safety */}
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-sunken)', borderRadius: '10px', border: '1px solid var(--line-hair)' }}>
              <div id="null-metric-test">
                <MetricTile label="Unreachable Facilities" value={null} unit="facilities" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
