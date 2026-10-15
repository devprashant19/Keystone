import React, { useState } from 'react';

export interface Corridor {
  id: string;
  name: string;
  length_km: number;
  status: string;
  data_origin: string;
}

export interface CaseSummary {
  case_id: string;
  f1: string;
  f2: string;
  verdict: 'BREACH' | 'DEGRADED' | 'OK';
  interaction_only: boolean;
  breaches_a: number;
  breaches_c: number;
}

interface LeftRailProps {
  corridors: Corridor[];
  selectedF1: string;
  onSelectF1: (f1: string) => void;
  onRunSweep: () => void;
  isLoading: boolean;
  cases: CaseSummary[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  isDbDown: boolean;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  corridors,
  selectedF1,
  onSelectF1,
  onRunSweep,
  isLoading,
  cases,
  selectedCaseId,
  onSelectCase,
  isDbDown,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'f2' | 'verdict'>('verdict');

  // Filter cases
  const filteredCases = cases.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'breach') return c.verdict === 'BREACH';
    if (filter === 'degraded') return c.verdict === 'DEGRADED';
    if (filter === 'ok') return c.verdict === 'OK';
    if (filter === 'interaction') return c.interaction_only;
    return true;
  });

  // Sort cases
  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortBy === 'verdict') {
      const order = { BREACH: 0, DEGRADED: 1, OK: 2 };
      return order[a.verdict] - order[b.verdict];
    }
    return a.f2.localeCompare(b.f2);
  });

  const breachCount = cases.filter((c) => c.verdict === 'BREACH').length;
  const degradedCount = cases.filter((c) => c.verdict === 'DEGRADED').length;
  const interactionCount = cases.filter((c) => c.interaction_only).length;

  return (
    <aside
      style={{
        width: '320px',
        backgroundColor: 'var(--panel)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 48px - 56px)',
        overflow: 'hidden',
      }}
      role="region"
      aria-label="Observed Failure and Scenario Sweep"
    >
      {/* 1. Observed failure selector */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--line)' }}>
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          Observed Failure (f1)
        </label>
        <select
          value={selectedF1}
          onChange={(e) => onSelectF1(e.target.value)}
          disabled={isLoading || isDbDown}
          style={{
            width: '100%',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--line)',
            color: 'var(--text)',
            padding: '8px 10px',
            borderRadius: '4px',
            fontSize: '13px',
            marginBottom: '12px',
          }}
          className="mono"
          id="f1-select"
        >
          <option value="">— Select an observed corridor failure —</option>
          {corridors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.length_km.toFixed(1)} km)
            </option>
          ))}
        </select>

        <button
          onClick={onRunSweep}
          disabled={!selectedF1 || isLoading || isDbDown}
          style={{
            width: '100%',
            backgroundColor: isLoading ? 'var(--line)' : 'var(--accent)',
            color: isLoading ? 'var(--text-3)' : '#000',
            border: 'none',
            padding: '10px',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: !selectedF1 || isLoading || isDbDown ? 'not-allowed' : 'pointer',
            letterSpacing: '0.04em',
          }}
          id="run-sweep-btn"
        >
          {isLoading ? 'EVALUATING 13 SCENARIO BRANCHES…' : 'RUN PRE-MORTEM SWEEP'}
        </button>
      </div>

      {/* 2. Headline counters */}
      {cases.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--line)',
            backgroundColor: 'var(--panel-2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>CASES: 13 / 13 ✓</span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>100% COMPLETE</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-fail">BREACH {breachCount}</span>
            <span className="badge badge-warn">DEGRADED {degradedCount}</span>
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(79, 179, 255, 0.15)',
                color: 'var(--accent)',
                border: '1px solid rgba(79, 179, 255, 0.4)',
              }}
              title="Headline denominator: cases where neither corridor breaches alone"
            >
              INTERACTION {interactionCount}
            </span>
          </div>
        </div>
      )}

      {/* 3. Filter chips */}
      {cases.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            display: 'flex',
            gap: '6px',
            borderBottom: '1px solid var(--line)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'all', label: 'All (13)' },
            { id: 'breach', label: `Breach (${breachCount})` },
            { id: 'degraded', label: `Degraded (${degradedCount})` },
            { id: 'interaction', label: `Interaction (${interactionCount})` },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: filter === item.id ? 'var(--accent)' : 'var(--line)',
                backgroundColor: filter === item.id ? 'rgba(79, 179, 255, 0.15)' : 'transparent',
                color: filter === item.id ? 'var(--accent)' : 'var(--text-3)',
                fontSize: '11px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* 4. Cases list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {cases.length === 0 ? (
          <div style={{ padding: '24px 16px', color: 'var(--text-3)', textAlign: 'center' }}>
            Select an observed failure corridor and click Run Sweep to evaluate all 13 counterfactual second-failures.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--line)',
                  color: 'var(--text-3)',
                  textAlign: 'left',
                  fontSize: '11px',
                }}
              >
                <th
                  style={{ padding: '6px 12px', cursor: 'pointer' }}
                  onClick={() => setSortBy('f2')}
                  title="Sort by secondary corridor ID"
                >
                  f2 CORRIDOR
                </th>
                <th
                  style={{ padding: '6px 12px', cursor: 'pointer', textAlign: 'right' }}
                  onClick={() => setSortBy('verdict')}
                  title="Sort by verdict severity"
                >
                  VERDICT
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCases.map((c) => {
                const isSelected = c.case_id === selectedCaseId;
                const badgeClass =
                  c.verdict === 'BREACH'
                    ? 'badge-fail'
                    : c.verdict === 'DEGRADED'
                    ? 'badge-warn'
                    : 'badge-ok';

                return (
                  <tr
                    key={c.case_id}
                    onClick={() => onSelectCase(c.case_id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--panel-2)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                      borderBottom: '1px solid rgba(36, 48, 64, 0.4)',
                    }}
                  >
                    <td style={{ padding: '8px 12px' }}>
                      <div className="mono" style={{ color: 'var(--text)', fontWeight: 500 }}>
                        {c.f2.replace('road_', '')}
                      </div>
                      {c.interaction_only && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: 'var(--accent)',
                            display: 'inline-block',
                            marginTop: '2px',
                          }}
                        >
                          ⚡ Interaction Only
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <span className={`badge ${badgeClass}`}>{c.verdict}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </aside>
  );
};
