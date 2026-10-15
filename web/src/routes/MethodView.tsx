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
    return document.documentElement.getAttribute('data-reduced-motion') === 'true';
  });
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [tabularDigit, setTabularDigit] = useState<number>(0);

  const toggleReducedMotion = () => {
    const nextVal = !reducedMotion;
    setReducedMotion(nextVal);
    document.documentElement.setAttribute('data-reduced-motion', nextVal ? 'true' : 'false');
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Are you sure you want to reset the demo? This will sweep orphan branches, clear run history, and reload jaal_world.')) {
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
        height: 'calc(100vh - var(--h-header))',
        backgroundColor: 'var(--bg-void)',
        color: 'var(--ink-hi)',
        padding: 'var(--s6) var(--s7)',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Back navigation */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            cursor: 'pointer',
            fontSize: 'var(--fs-cap)',
            fontWeight: 600,
            marginBottom: 'var(--s4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s1)',
          }}
        >
          ◀ Return to Incident Command Deck
        </button>

        <h1 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, marginBottom: 'var(--s2)', margin: 0 }}>
          Methodology, Provenance & Scientific Integrity
        </h1>
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-mid)', lineHeight: 'var(--lh-prose)', marginBottom: 'var(--s5)' }}>
          Jaal Pre-Mortem is built under a strict pre-registration discipline. All constants, evaluators, and denominator definitions are frozen before runtime execution to prevent cherry-picking.
        </p>

        {/* 1. Frozen Config Card */}
        <section style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--line-hair)', borderRadius: 'var(--r-panel)', padding: 'var(--s5)', marginBottom: 'var(--s5)' }}>
          <h2 style={{ fontSize: 'var(--fs-ui)', marginBottom: 'var(--s3)', color: 'var(--accent)', margin: 0 }}>
            1. Frozen Configuration (SHA-256 Verified)
          </h2>
          <div style={{ display: 'flex', gap: 'var(--s4)', marginBottom: 'var(--s3)' }} className="mono">
            <div>CONFIG HASH: <span style={{ color: 'var(--ink-hi)', fontWeight: 600 }}>{configHash}</span></div>
            <div>WORLD DIGEST: <span style={{ color: 'var(--ink-hi)', fontWeight: 600 }}>{worldDigest}</span></div>
          </div>
          <table style={{ width: '100%', fontSize: 'var(--fs-cap)', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--ink-lo)', borderBottom: '1px solid var(--line-hair)', textAlign: 'left', backgroundColor: 'var(--bg-header)' }}>
                <th style={{ padding: 'var(--s2) var(--s1)' }}>Constant</th>
                <th style={{ padding: 'var(--s2) var(--s1)' }}>Value</th>
                <th style={{ padding: 'var(--s2) var(--s1)' }}>Methodological Label</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--line-hair)' }}>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>Access Deadline</td>
                <td className="mono" style={{ padding: 'var(--s2) var(--s1)' }}>20.0 minutes</td>
                <td style={{ padding: 'var(--s2) var(--s1)', color: 'var(--ink-mid)' }}>Synthetic urban target band</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--line-hair)' }}>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>Assumed Monsoon Arterial Speed</td>
                <td className="mono" style={{ padding: 'var(--s2) var(--s1)' }}>24.0 km/h</td>
                <td style={{ padding: 'var(--s2) var(--s1)', color: 'var(--warn)' }}>Synthetic planning assumption — NOT empirical</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--line-hair)' }}>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>Effective Travel Allowance</td>
                <td className="mono" style={{ padding: 'var(--s2) var(--s1)' }}>6.8 km</td>
                <td style={{ padding: 'var(--s2) var(--s1)', color: 'var(--ink-mid)' }}>Derived: (20 - 3) / 60 * 24</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--line-hair)' }}>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>Alert Delivery Deadline</td>
                <td className="mono" style={{ padding: 'var(--s2) var(--s1)' }}>8.0 minutes</td>
                <td style={{ padding: 'var(--s2) var(--s1)', color: 'var(--ink-mid)' }}>Synthetic mesh propagation threshold</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--line-hair)' }}>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>Action Budget</td>
                <td className="mono" style={{ padding: 'var(--s2) var(--s1)' }}>1 action per f1</td>
                <td style={{ padding: 'var(--s2) var(--s1)', color: 'var(--ink-mid)' }}>Strict resource scarcity constraint</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 2. Three-Way Decomposition */}
        <section style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--line-hair)', borderRadius: 'var(--r-panel)', padding: 'var(--s5)', marginBottom: 'var(--s5)' }}>
          <h2 style={{ fontSize: 'var(--fs-ui)', marginBottom: 'var(--s3)', color: 'var(--accent)', margin: 0 }}>
            2. Three-Way Case Decomposition & Denominators
          </h2>
          <p style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)', lineHeight: 'var(--lh-prose)', marginBottom: 'var(--s3)' }}>
            To avoid inflating headline claims, Jaal decomposes all 182 scenario pairs into three disjoint classes before any policy comparison:
          </p>
          <ul style={{ fontSize: 'var(--fs-cap)', lineHeight: 'var(--lh-prose)', paddingLeft: 'var(--s5)', color: 'var(--ink-hi)' }}>
            <li>
              <strong>f1-alone cases:</strong> Breaches that occur under the initial failure alone. No preventive action can avert these.
            </li>
            <li>
              <strong>f2-alone cases:</strong> Breaches that occur under the second failure alone regardless of f1.
            </li>
            <li>
              <strong style={{ color: 'var(--accent)' }}>Interaction-only cases (The Headline Denominator):</strong> Breaches that occur only when both f1 and f2 occur jointly. This is the only region where conditioning on f1 changes the optimal action!
            </li>
          </ul>
        </section>

        {/* 3. Provenance & Attribution */}
        <section style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--line-hair)', borderRadius: 'var(--r-panel)', padding: 'var(--s5)', marginBottom: 'var(--s5)' }}>
          <h2 style={{ fontSize: 'var(--fs-ui)', marginBottom: 'var(--s3)', color: 'var(--accent)', margin: 0 }}>
            3. Dataset Provenance & Attribution
          </h2>
          <table style={{ width: '100%', fontSize: 'var(--fs-cap)', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--ink-lo)', borderBottom: '1px solid var(--line-hair)', textAlign: 'left', backgroundColor: 'var(--bg-header)' }}>
                <th style={{ padding: 'var(--s2) var(--s1)' }}>Layer</th>
                <th style={{ padding: 'var(--s2) var(--s1)' }}>Source</th>
                <th style={{ padding: 'var(--s2) var(--s1)' }}>License</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--line-hair)' }}>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>Delhi Road Network</td>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>CityGraph (OpenStreetMap Delhi Central)</td>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>MIT License</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--line-hair)' }}>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>Flood Inundation Polygons</td>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>CityGraph (Delhi July 2023 Historic Flood Event)</td>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>Reference Record</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--line-hair)' }}>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>Power & Telecom Layers</td>
                <td style={{ padding: 'var(--s2) var(--s1)' }}>Synthetic layered specification (power_and_alert.json)</td>
                <td style={{ padding: 'var(--s2) var(--s1)', color: 'var(--synthetic)' }}>Synthetic Benchmark</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 4. Design System & Encodings Reference (U1 #design) */}
        <section id="design" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--line-hair)', borderRadius: 'var(--r-panel)', padding: 'var(--s5)', marginBottom: 'var(--s5)' }}>
          <h2 style={{ fontSize: 'var(--fs-ui)', marginBottom: 'var(--s3)', color: 'var(--accent)', margin: 0 }}>
            4. Design System & Status Encodings Gallery
          </h2>
          <p style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)', marginBottom: 'var(--s4)' }}>
            Single source of truth for semantic encodings (<code className="mono">encodings.ts</code>). Every status carries colour, text badge, shape/stroke difference, and distinct icon.
          </p>

          {/* Encodings Gallery Container for U1-03 Greyscale Check */}
          <div
            id="encodings-gallery"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--s3)',
              marginBottom: 'var(--s5)',
              padding: 'var(--s3)',
              backgroundColor: 'var(--bg-sunken)',
              borderRadius: 'var(--r-ctl)',
              border: '1px solid var(--line-hair)'
            }}
          >
            {ALL_ENCODING_CONCEPTS.map(item => {
              const enc = getStatusEncoding(item.status);
              return (
                <div
                  key={item.id}
                  className="encoding-card"
                  style={{
                    backgroundColor: 'var(--bg-raised)',
                    border: '1px solid var(--line-hair)',
                    borderRadius: 'var(--r-ctl)',
                    padding: 'var(--s3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--s2)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--fs-cap)', fontWeight: 600, color: 'var(--ink-hi)' }}>{enc.concept}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
                    <svg width="80" height="20" style={{ overflow: 'visible' }}>
                      <line
                        x1="0"
                        y1="10"
                        x2="80"
                        y2="10"
                        stroke={enc.colorVar}
                        strokeWidth={enc.strokeWidth}
                        strokeDasharray={enc.strokeDasharray || 'none'}
                      />
                      {enc.iconGlyph === 'cross' && (
                        <text x="40" y="14" textAnchor="middle" fill={enc.colorVar} fontSize="12" fontWeight="bold">✕</text>
                      )}
                    </svg>
                    <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }} className="mono">
                      {enc.shape}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>
                    {enc.label}
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
                    backgroundColor: 'var(--branch-wash)',
                    border: '1px solid var(--branch)',
                    boxShadow: 'var(--branch-glow)',
                    borderRadius: 'var(--r-ctl)',
                    padding: 'var(--s3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--s2)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--fs-cap)', fontWeight: 600, color: 'var(--branch)' }}>{bEnc.concept}</span>
                    <StatusBadge status="BRANCH" label={bEnc.badgeText} />
                  </div>
                  <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-hi)' }}>
                    1px boundary + --branch-glow (the only sanctioned glow)
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 19 Hand-authored SVG Icons Gallery (U1-10) */}
          <h3 style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-hi)', marginBottom: 'var(--s3)', margin: 0 }}>
            Hand-Authored Domain SVG Icons (19 Items on 16px Grid)
          </h3>
          <div
            id="icons-gallery"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 'var(--s2)',
              marginBottom: 'var(--s5)',
              padding: 'var(--s3)',
              backgroundColor: 'var(--bg-sunken)',
              borderRadius: 'var(--r-ctl)',
              border: '1px solid var(--line-hair)'
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
                  padding: 'var(--s2)',
                  backgroundColor: 'var(--bg-raised)',
                  border: '1px solid var(--line-hair)',
                  borderRadius: 'var(--r-chip)',
                  gap: 'var(--s1)'
                }}
              >
                <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Component size={16} />
                </div>
                <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }} className="mono">
                  {name}
                </span>
              </div>
            ))}
          </div>

          {/* U1-05 Tabular Numeral Verification Test Element */}
          <div style={{ padding: 'var(--s3)', backgroundColor: 'var(--bg-sunken)', borderRadius: 'var(--r-ctl)', marginBottom: 'var(--s3)', border: '1px solid var(--line-hair)' }}>
            <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)', textTransform: 'uppercase' }}>U1-05 Tabular Numerals Verification Slot: </span>
            <button
              id="cycle-digit-btn"
              type="button"
              onClick={() => setTabularDigit(d => (d === 0 ? 8 : 0))}
              style={{ padding: '2px var(--s2)', marginLeft: 'var(--s2)', cursor: 'pointer', fontSize: 'var(--fs-micro)' }}
            >
              Toggle Digit
            </button>
            <span
              id="tabular-test-element"
              className="mono tabular"
              style={{ display: 'inline-block', marginLeft: 'var(--s3)', fontSize: 'var(--fs-h2)', fontWeight: 600, color: 'var(--ink-hi)' }}
            >
              {tabularDigit}
            </span>
          </div>

          {/* U1-06 MetricTile Null Safety Verification Slot */}
          <div style={{ padding: 'var(--s3)', backgroundColor: 'var(--bg-sunken)', borderRadius: 'var(--r-ctl)', border: '1px solid var(--line-hair)' }}>
            <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--s2)' }}>
              U1-06 MetricTile Null Safety Verification Slot:
            </span>
            <div id="null-metric-test" style={{ maxWidth: '240px' }}>
              <MetricTile label="Unreachable Facilities" value={null} unit="facilities" />
            </div>
          </div>
        </section>

        {/* 5. Explicit Limits */}
        <section style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--line-hair)', borderRadius: 'var(--r-panel)', padding: 'var(--s5)', marginBottom: 'var(--s5)' }}>
          <h2 style={{ fontSize: 'var(--fs-ui)', marginBottom: 'var(--s3)', color: 'var(--fail)', margin: 0 }}>
            5. Explicit Limitations & Boundaries
          </h2>
          <ul style={{ fontSize: 'var(--fs-cap)', lineHeight: 'var(--lh-prose)', paddingLeft: 'var(--s5)', color: 'var(--ink-mid)' }}>
            <li>Zero probability or stochastic claims: Jaal evaluates deterministic conditional worst-case reachability.</li>
            <li>No population density data or live emergency dispatch integration.</li>
            <li>
              <code className="mono">wtp_wazirabad</code> is excluded from access SLA metrics because it sits 3.53 km from any modeled road node; snapping it would fabricate false connectivity.
            </li>
          </ul>
        </section>

        {/* 6. Accessibility & Reset Deck */}
        <section style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--line-hair)', borderRadius: 'var(--r-panel)', padding: 'var(--s5)' }}>
          <h2 style={{ fontSize: 'var(--fs-ui)', marginBottom: 'var(--s3)', color: 'var(--ink-hi)', margin: 0 }}>
            6. Deck Settings & Verification Reset
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s4)' }}>
            <div>
              <strong style={{ fontSize: 'var(--fs-body)' }}>Reduced Motion Mode</strong>
              <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>
                Disables animated sever and route transitions for WCAG 2.1 AA compliance
              </div>
            </div>
            <button
              onClick={toggleReducedMotion}
              style={{
                padding: 'var(--s2) var(--s4)',
                backgroundColor: reducedMotion ? 'var(--ok)' : 'var(--bg-raised)',
                color: reducedMotion ? 'var(--bg-void)' : 'var(--ink-hi)',
                border: '1px solid var(--line-hair)',
                borderRadius: 'var(--r-ctl)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 'var(--fs-cap)',
              }}
            >
              {reducedMotion ? 'Reduced Motion: ON' : 'Reduced Motion: OFF'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--line-hair)', paddingTop: 'var(--s4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ fontSize: 'var(--fs-body)' }}>Reset Incident Demo</strong>
              <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>
                Clears memory, sweeps orphan branches, reloads pristine world
              </div>
            </div>
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              style={{
                padding: 'var(--s2) var(--s4)',
                backgroundColor: 'var(--fail-wash)',
                color: 'var(--fail)',
                border: '1px solid var(--fail)',
                borderRadius: 'var(--r-ctl)',
                cursor: resetting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 'var(--fs-cap)',
              }}
            >
              {resetting ? 'Resetting…' : 'Reset Demo Sequence'}
            </button>
          </div>
          {resetMessage && (
            <div style={{ marginTop: 'var(--s3)', fontSize: 'var(--fs-cap)', color: 'var(--accent)' }}>
              {resetMessage}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
