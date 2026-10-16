import React, { useEffect, useState } from 'react';
import { StatusBadge } from '../components/primitives';
import { DependencyChain } from '../graph/DependencyChain';

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
    if (!caseId) return;
    setLoading(true);

    const loadEvidence = async () => {
      try {
        let activeRunId = runId;
        if (!activeRunId) {
          const runsRes = await fetch('/api/runs?limit=1');
          if (runsRes.ok) {
            const runsData = await runsRes.json();
            if (runsData.runs && runsData.runs.length > 0) {
              activeRunId = runsData.runs[0].run_id;
            }
          }
        }
        if (!activeRunId) {
          throw new Error('No benchmark run found. Please trigger a sweep first.');
        }

        const res = await fetch(`/api/run/${activeRunId}/case/${caseId}`);
        if (!res.ok) throw new Error(`Evidence fetch failed: ${res.statusText}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadEvidence();
  }, [caseId, runId]);

  // Compute arithmetic from first facility evidence if available
  const firstFacility = data?.facility_evidence ? (Object.values(data.facility_evidence)[0] as any) : null;
  const dispatchDelay = firstFacility?.best_depot && firstFacility.depot_breakdown?.[firstFacility.best_depot]
    ? firstFacility.depot_breakdown[firstFacility.best_depot].dispatch_delay_min
    : 3.0;
  const roadTime = firstFacility?.road_time_min || 0;
  const offsetTime = firstFacility?.offset_km ? (firstFacility.offset_km / 24.0) * 60 : 0;
  const totalTime = firstFacility?.total_time_min ?? (dispatchDelay + roadTime + offsetTime);

  const arithmetic = firstFacility ? {
    dispatch_min: dispatchDelay,
    transit_min: roadTime,
    offset_min: offsetTime,
    total_min: totalTime,
    deadline_min: 20.0,
    is_breach: Boolean(firstFacility.is_breach),
  } : undefined;

  return (
    <div
      style={{
        height: 'calc(100vh - var(--h-header))',
        backgroundColor: 'var(--bg-void)',
        color: 'var(--ink-hi)',
        padding: 'var(--s5) var(--s6)',
        overflowY: 'auto',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s4)' }}>
        <div>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: 'var(--fs-cap)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--s1)',
              marginBottom: 'var(--s2)',
            }}
          >
            ◀ Back to Command Deck
          </button>
          <h1 style={{ fontSize: 'var(--fs-h3)', fontWeight: 700, margin: 0 }}>
            Case Evidence: <span className="mono" style={{ color: 'var(--accent)' }}>{caseId.replace('__', ' ➔ ')}</span>
          </h1>
        </div>

        {data && (
          <div className="mono" style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-lo)' }}>
            BRANCH GRAPH: <StatusBadge status="BRANCH" label={data.branch_name} />
          </div>
        )}
      </div>

      {loading && <div style={{ color: 'var(--ink-lo)', fontSize: 'var(--fs-cap)' }}>Loading evidence from FalkorDB branch…</div>}
      {error && <div style={{ color: 'var(--fail)', fontSize: 'var(--fs-cap)' }}>Error: {error}</div>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
          {/* Hero: Dependency Chain View */}
          {data.dependency_chain && (
            <DependencyChain
              steps={data.dependency_chain}
              arithmetic={arithmetic}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s4)' }}>
          {/* Left Column: Mutation Ledger */}
          <div
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderRadius: 'var(--r-panel)',
              padding: 'var(--s4)',
            }}
          >
            <h2 style={{ fontSize: 'var(--fs-cap)', textTransform: 'uppercase', color: 'var(--ink-lo)', marginBottom: 'var(--s3)', margin: 0 }}>
              Staged Mutation Ledger ({data.mutation_ledger.length} events)
            </h2>
            <p style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)', marginBottom: 'var(--s3)' }}>
              Written to <code className="mono">jaal_memory</code> before physical deletion to preserve cause attribution.
            </p>

            <table style={{ width: '100%', fontSize: 'var(--fs-micro)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--ink-lo)', borderBottom: '1px solid var(--line-hair)', textAlign: 'left', backgroundColor: 'var(--bg-header)' }}>
                  <th style={{ padding: 'var(--s2) var(--s1)' }}>Entity</th>
                  <th style={{ padding: 'var(--s2) var(--s1)' }}>Reason Code</th>
                  <th style={{ padding: 'var(--s2) var(--s1)' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.mutation_ledger.map((item: any) => (
                  <tr key={item.mutation_id} style={{ borderBottom: '1px solid var(--line-hair)' }}>
                    <td className="mono" style={{ padding: 'var(--s2) var(--s1)', color: 'var(--ink-hi)' }}>
                      {item.entity_id}
                    </td>
                    <td style={{ padding: 'var(--s2) var(--s1)' }}>
                      <StatusBadge status="SEVERED" label={item.reason_code} />
                    </td>
                    <td className="mono" style={{ padding: 'var(--s2) var(--s1)', color: 'var(--ink-lo)' }}>
                      {item.at.slice(11, 19)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Column: Road Access Arithmetic & Alert Hop Chains */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
            {/* 1. Road Access Arithmetic */}
            <div
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--line-hair)',
                borderRadius: 'var(--r-panel)',
                padding: 'var(--s4)',
              }}
            >
              <h2 style={{ fontSize: 'var(--fs-cap)', textTransform: 'uppercase', color: 'var(--ink-lo)', marginBottom: 'var(--s3)', margin: 0 }}>
                Component Travel Arithmetic (UI-09 Check)
              </h2>
              <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)', marginBottom: 'var(--s3)' }}>
                Assumed speed: <strong className="mono">24.0 km/h</strong> • Access Deadline: <strong className="mono">20.0 min</strong>
              </div>

              {Object.entries(data.facility_evidence).map(([fid, metric]: [string, any]) => (
                <div
                  key={fid}
                  style={{
                    backgroundColor: 'var(--bg-raised)',
                    padding: 'var(--s3)',
                    borderRadius: 'var(--r-ctl)',
                    marginBottom: 'var(--s2)',
                    border: '1px solid var(--line-hair)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s1)' }}>
                    <strong style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-hi)' }}>{metric.name}</strong>
                    <StatusBadge status={metric.is_breach ? 'BREACH' : metric.is_degraded ? 'DEGRADED' : 'OK'} />
                  </div>

                  {metric.unreachable ? (
                    <div style={{ color: 'var(--fail)', fontSize: 'var(--fs-micro)' }}>UNREACHABLE — No surviving road path from any depot</div>
                  ) : (
                    <div className="mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>
                      <div>Best Depot: <span style={{ color: 'var(--accent)' }}>{metric.best_depot}</span></div>
                      <div>
                        Equation: Dispatch ({metric.depot_breakdown[metric.best_depot]?.dispatch_delay_min.toFixed(1)}m) + Road ({metric.road_time_min?.toFixed(1)}m, {metric.road_dist_km?.toFixed(1)}km) + Offset ({((metric.offset_km / 24.0) * 60).toFixed(1)}m)
                      </div>
                      <div style={{ color: 'var(--ink-hi)', fontWeight: 600, marginTop: '2px' }}>
                        = Total Response Time: {metric.total_time_min?.toFixed(1)} min
                      </div>
                      <div style={{ marginTop: 'var(--s1)', color: 'var(--ink-lo)' }}>
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
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--line-hair)',
                borderRadius: 'var(--r-panel)',
                padding: 'var(--s4)',
              }}
            >
              <h2 style={{ fontSize: 'var(--fs-cap)', textTransform: 'uppercase', color: 'var(--ink-lo)', marginBottom: 'var(--s3)', margin: 0 }}>
                Alert Network Backhaul & Hops (EV-06 Check)
              </h2>
              <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)', marginBottom: 'var(--s3)' }}>
                Max Hops Bound: <strong className="mono">12</strong> • Delivery Deadline: <strong className="mono">8.0 min</strong>
              </div>

              {Object.entries(data.alert_evidence).map(([rid, alert]: [string, any]) => (
                <div
                  key={rid}
                  style={{
                    backgroundColor: 'var(--bg-raised)',
                    padding: 'var(--s3)',
                    borderRadius: 'var(--r-ctl)',
                    marginBottom: 'var(--s2)',
                    border: '1px solid var(--line-hair)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s1)' }}>
                    <strong style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-hi)' }}>Relay Target: <span className="mono">{rid}</span></strong>
                    <StatusBadge status={alert.is_breach ? 'BREACH' : 'OK'} label={alert.is_breach ? 'ALERT BREACH' : 'DELIVERED'} />
                  </div>

                  {alert.unreachable ? (
                    <div style={{ color: 'var(--fail)', fontSize: 'var(--fs-micro)' }}>ALERT BACKHAUL SEVERED — No surviving alert arc route</div>
                  ) : (
                    <div className="mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>
                      <div>Source Tower: {alert.source_tower}</div>
                      <div>Path: {alert.path?.join(' ➔ ')}</div>
                      <div style={{ color: 'var(--ink-hi)', fontWeight: 600, marginTop: '2px' }}>
                        Latency: {alert.latency_min?.toFixed(1)} min ({alert.hops} hops)
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};
