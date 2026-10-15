import React, { useState } from 'react';

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
        height: 'calc(100vh - 48px)',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        padding: '32px 48px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Back navigation */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ◀ Return to Incident Command Deck
        </button>

        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          Methodology, Provenance & Scientific Integrity
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '24px' }}>
          Jaal Pre-Mortem is built under a strict pre-registration discipline. All constants, evaluators, and denominator definitions are frozen before runtime execution to prevent cherry-picking.
        </p>

        {/* 1. Frozen Config Card */}
        <section style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--accent)' }}>
            1. Frozen Configuration (SHA-256 Verified)
          </h2>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }} className="mono">
            <div>CONFIG HASH: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{configHash}</span></div>
            <div>WORLD DIGEST: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{worldDigest}</span></div>
          </div>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                <th style={{ padding: '6px 0' }}>Constant</th>
                <th style={{ padding: '6px 0' }}>Value</th>
                <th style={{ padding: '6px 0' }}>Methodological Label</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(36,48,64,0.4)' }}>
                <td style={{ padding: '6px 0' }}>Access Deadline</td>
                <td className="mono" style={{ padding: '6px 0' }}>20.0 minutes</td>
                <td style={{ padding: '6px 0', color: 'var(--text-2)' }}>Synthetic urban target band</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(36,48,64,0.4)' }}>
                <td style={{ padding: '6px 0' }}>Assumed Monsoon Arterial Speed</td>
                <td className="mono" style={{ padding: '6px 0' }}>24.0 km/h</td>
                <td style={{ padding: '6px 0', color: 'var(--warn)' }}>Synthetic planning assumption — NOT empirical</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(36,48,64,0.4)' }}>
                <td style={{ padding: '6px 0' }}>Effective Travel Allowance</td>
                <td className="mono" style={{ padding: '6px 0' }}>6.8 km</td>
                <td style={{ padding: '6px 0', color: 'var(--text-2)' }}>Derived: (20 - 3) / 60 * 24</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(36,48,64,0.4)' }}>
                <td style={{ padding: '6px 0' }}>Alert Delivery Deadline</td>
                <td className="mono" style={{ padding: '6px 0' }}>8.0 minutes</td>
                <td style={{ padding: '6px 0', color: 'var(--text-2)' }}>Synthetic mesh propagation threshold</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(36,48,64,0.4)' }}>
                <td style={{ padding: '6px 0' }}>Action Budget</td>
                <td className="mono" style={{ padding: '6px 0' }}>1 action per f1</td>
                <td style={{ padding: '6px 0', color: 'var(--text-2)' }}>Strict resource scarcity constraint</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 2. Three-Way Decomposition */}
        <section style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--accent)' }}>
            2. Three-Way Case Decomposition & Denominators
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: '12px' }}>
            To avoid inflating headline claims, Jaal decomposes all 182 scenario pairs into three disjoint classes before any policy comparison:
          </p>
          <ul style={{ fontSize: '12px', lineHeight: 1.6, paddingLeft: '20px', color: 'var(--text)' }}>
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
        <section style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--accent)' }}>
            3. Dataset Provenance & Attribution
          </h2>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                <th style={{ padding: '6px 0' }}>Layer</th>
                <th style={{ padding: '6px 0' }}>Source</th>
                <th style={{ padding: '6px 0' }}>License</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(36,48,64,0.4)' }}>
                <td style={{ padding: '6px 0' }}>Delhi Road Network</td>
                <td style={{ padding: '6px 0' }}>CityGraph (OpenStreetMap Delhi Central)</td>
                <td style={{ padding: '6px 0' }}>MIT License</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(36,48,64,0.4)' }}>
                <td style={{ padding: '6px 0' }}>Flood Inundation Polygons</td>
                <td style={{ padding: '6px 0' }}>CityGraph (Delhi July 2023 Historic Flood Event)</td>
                <td style={{ padding: '6px 0' }}>Reference Record</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(36,48,64,0.4)' }}>
                <td style={{ padding: '6px 0' }}>Power & Telecom Layers</td>
                <td style={{ padding: '6px 0' }}>Synthetic layered specification (power_and_alert.json)</td>
                <td style={{ padding: '6px 0', color: 'var(--synthetic)' }}>Synthetic Benchmark</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 4. Explicit Limits */}
        <section style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--fail)' }}>
            4. Explicit Limitations & Boundaries
          </h2>
          <ul style={{ fontSize: '12px', lineHeight: 1.6, paddingLeft: '20px', color: 'var(--text-2)' }}>
            <li>Zero probability or stochastic claims: Jaal evaluates deterministic conditional worst-case reachability.</li>
            <li>No population density data or live emergency dispatch integration.</li>
            <li>
              <code className="mono">wtp_wazirabad</code> is excluded from access SLA metrics because it sits 3.53 km from any modeled road node; snapping it would fabricate false connectivity.
            </li>
          </ul>
        </section>

        {/* 5. Accessibility & Reset Deck */}
        <section style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '20px' }}>
          <h2 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text)' }}>
            5. Deck Settings & Verification Reset
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <strong>Reduced Motion Mode</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                Disables animated sever and route transitions for WCAG 2.1 AA compliance
              </div>
            </div>
            <button
              onClick={toggleReducedMotion}
              style={{
                padding: '6px 14px',
                backgroundColor: reducedMotion ? 'var(--ok)' : 'var(--panel-2)',
                color: reducedMotion ? '#000' : 'var(--text)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              {reducedMotion ? 'Reduced Motion: ON' : 'Reduced Motion: OFF'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong>Reset Incident Demo</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                Clears memory, sweeps orphan branches, reloads pristine world
              </div>
            </div>
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              style={{
                padding: '6px 14px',
                backgroundColor: 'rgba(229, 84, 75, 0.15)',
                color: 'var(--fail)',
                border: '1px solid var(--fail)',
                borderRadius: '4px',
                cursor: resetting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              {resetting ? 'Resetting…' : 'Reset Demo Sequence'}
            </button>
          </div>
          {resetMessage && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--accent)' }}>
              {resetMessage}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
