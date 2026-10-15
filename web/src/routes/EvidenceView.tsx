import React, { useEffect, useState } from 'react';

interface EvidenceViewProps {
  caseId: string;
  runId: string;
  onBack: () => void;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ caseId, runId, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId || !runId) return;
    setLoading(true);
    fetch(`/api/run/${runId}/case/${caseId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Evidence fetch failed: ${res.statusText}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [caseId, runId]);

  return (
    <div
      style={{
        height: 'calc(100vh - 48px)',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        padding: '24px 32px',
        overflowY: 'auto',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '6px',
            }}
          >
            ◀ Back to Command Deck
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 700 }}>
            Case Evidence: <span className="mono" style={{ color: 'var(--accent)' }}>{caseId.replace('__', ' ➔ ')}</span>
          </h1>
        </div>

        {data && (
          <div className="mono" style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            BRANCH GRAPH: <span className="badge badge-branch">{data.branch_name}</span>
          </div>
        )}
      </div>

      {loading && <div style={{ color: 'var(--text-3)' }}>Loading evidence from FalkorDB branch…</div>}
      {error && <div style={{ color: 'var(--fail)' }}>Error: {error}</div>}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Column: Mutation Ledger */}
          <div
            style={{
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              padding: '16px',
            }}
          >
            <h2 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '12px' }}>
              Staged Mutation Ledger ({data.mutation_ledger.length} events)
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '12px' }}>
              Written to <code className="mono">jaal_memory</code> before physical deletion to preserve cause attribution.
            </p>

            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 4px' }}>Entity</th>
                  <th style={{ padding: '6px 4px' }}>Reason Code</th>
                  <th style={{ padding: '6px 4px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.mutation_ledger.map((item: any) => (
                  <tr key={item.mutation_id} style={{ borderBottom: '1px solid rgba(36,48,64,0.4)' }}>
                    <td className="mono" style={{ padding: '6px 4px', color: 'var(--text)' }}>
                      {item.entity_id}
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      <span className="badge badge-fail" style={{ fontSize: '10px' }}>
                        {item.reason_code}
                      </span>
                    </td>
                    <td className="mono" style={{ padding: '6px 4px', color: 'var(--text-3)' }}>
                      {item.at.slice(11, 19)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Column: Road Access Arithmetic & Alert Hop Chains */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Road Access Arithmetic */}
            <div
              style={{
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '16px',
              }}
            >
              <h2 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '12px' }}>
                Component Travel Arithmetic (UI-09 Check)
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '10px' }}>
                Assumed speed: <strong className="mono">24.0 km/h</strong> • Access Deadline: <strong className="mono">20.0 min</strong>
              </div>

              {Object.entries(data.facility_evidence).map(([fid, metric]: [string, any]) => (
                <div
                  key={fid}
                  style={{
                    backgroundColor: 'var(--panel-2)',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>{metric.name}</strong>
                    <span className={`badge ${metric.is_breach ? 'badge-fail' : metric.is_degraded ? 'badge-warn' : 'badge-ok'}`}>
                      {metric.is_breach ? 'BREACH' : metric.is_degraded ? 'DEGRADED' : 'OK'}
                    </span>
                  </div>

                  {metric.unreachable ? (
                    <div style={{ color: 'var(--fail)', fontSize: '11px' }}>UNREACHABLE — No surviving road path from any depot</div>
                  ) : (
                    <div className="mono" style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                      <div>Best Depot: <span style={{ color: 'var(--accent)' }}>{metric.best_depot}</span></div>
                      <div>
                        Equation: Dispatch ({metric.depot_breakdown[metric.best_depot]?.dispatch_delay_min.toFixed(1)}m) + Road ({metric.road_time_min?.toFixed(1)}m, {metric.road_dist_km?.toFixed(1)}km) + Offset ({((metric.offset_km / 24.0) * 60).toFixed(1)}m)
                      </div>
                      <div style={{ color: 'var(--text)', fontWeight: 600, marginTop: '2px' }}>
                        = Total Response Time: {metric.total_time_min?.toFixed(1)} min
                      </div>
                      <div style={{ marginTop: '4px', color: 'var(--text-3)' }}>
                        Route: {metric.route?.join(' ➔ ')}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 2. Alert Chain Evidence */}
            <div
              style={{
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '16px',
              }}
            >
              <h2 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '12px' }}>
                Alert Network Backhaul & Hops (EV-06 Check)
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '10px' }}>
                Max Hops Bound: <strong className="mono">12</strong> • Delivery Deadline: <strong className="mono">8.0 min</strong>
              </div>

              {Object.entries(data.alert_evidence).map(([rid, alert]: [string, any]) => (
                <div
                  key={rid}
                  style={{
                    backgroundColor: 'var(--panel-2)',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>Relay Target: <span className="mono">{rid}</span></strong>
                    <span className={`badge ${alert.is_breach ? 'badge-fail' : 'badge-ok'}`}>
                      {alert.is_breach ? 'ALERT BREACH' : 'DELIVERED'}
                    </span>
                  </div>

                  {alert.unreachable ? (
                    <div style={{ color: 'var(--fail)', fontSize: '11px' }}>ALERT BACKHAUL SEVERED — No surviving alert arc route</div>
                  ) : (
                    <div className="mono" style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                      <div>Source Tower: {alert.source_tower}</div>
                      <div>Path: {alert.path?.join(' ➔ ')}</div>
                      <div style={{ color: 'var(--text)', fontWeight: 600, marginTop: '2px' }}>
                        Latency: {alert.latency_min?.toFixed(1)} min ({alert.hops} hops)
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
