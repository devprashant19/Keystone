import React, { useState } from 'react';
import { StatusBadge, Chip } from './primitives';

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
  onCancelRun?: () => void;
  isLoading?: boolean;
  runState?: 'idle' | 'running' | 'complete';
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
  onCancelRun,
  isLoading: propIsLoading,
  runState: propRunState,
  cases,
  selectedCaseId,
  onSelectCase,
  isDbDown,
}) => {
  const runState: 'idle' | 'running' | 'complete' =
    propRunState || (propIsLoading ? 'running' : cases.length > 0 ? 'complete' : 'idle');
  const isRunning = runState === 'running';
  const isComplete = runState === 'complete';
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
        width: 'var(--w-rail-l)',
        backgroundColor: 'var(--bg-panel)',
        borderRight: '1px solid var(--line-hair)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--h-header) - var(--h-framebar))',
        overflow: 'hidden',
      }}
      role="region"
      aria-label="Observed Failure and Scenario Sweep"
    >
      <div id="sweep-live-announcer" aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {isRunning ? 'Evaluating 13 scenario branches' : isComplete ? `${cases.length} cases evaluated` : 'Ready to evaluate'}
      </div>
      {/* 1. Observed failure selector */}
      <div style={{ padding: 'var(--s4)', borderBottom: '1px solid var(--line-hair)' }}>
        <label
          htmlFor="corridor-select"
          style={{
            display: 'block',
            fontSize: 'var(--fs-micro)',
            textTransform: 'uppercase',
            color: 'var(--ink-lo)',
            fontWeight: 600,
            marginBottom: 'var(--s2)',
            letterSpacing: '0.04em',
          }}
        >
          Observed Failure (f1)
        </label>
        <select
          value={selectedF1}
          onChange={(e) => onSelectF1(e.target.value)}
          disabled={isRunning || isDbDown}
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-sunken)',
            border: '1px solid var(--line-hair)',
            color: 'var(--ink-hi)',
            padding: 'var(--s2) var(--s3)',
            borderRadius: 'var(--r-ctl)',
            fontSize: 'var(--fs-body)',
            marginBottom: 'var(--s3)',
          }}
          className="mono"
          id="corridor-select"
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
          disabled={!selectedF1 || isRunning || isDbDown}
          style={{
            width: '100%',
            backgroundColor: isRunning ? 'var(--line-hair)' : 'var(--accent)',
            color: isRunning ? 'var(--ink-lo)' : 'var(--bg-void)',
            border: 'none',
            padding: 'var(--s2) var(--s3)',
            borderRadius: 'var(--r-ctl)',
            fontWeight: 700,
            fontSize: 'var(--fs-body)',
            cursor: !selectedF1 || isRunning || isDbDown ? 'not-allowed' : 'pointer',
            letterSpacing: '0.04em',
          }}
          id="run-sweep-btn"
        >
          {isRunning
            ? 'EVALUATING 13 SCENARIO BRANCHES…'
            : isComplete
            ? 'RUN AGAIN'
            : 'RUN PRE-MORTEM SWEEP'}
        </button>

        {isRunning && (
          <button
            id="cancel-run-btn"
            onClick={onCancelRun}
            style={{
              width: '100%',
              marginTop: 'var(--s2)',
              backgroundColor: 'var(--fail-wash)',
              color: 'var(--fail)',
              border: '1px solid var(--fail)',
              padding: 'var(--s1) var(--s2)',
              borderRadius: 'var(--r-ctl)',
              fontWeight: 600,
              fontSize: 'var(--fs-micro)',
              cursor: 'pointer',
            }}
          >
            CANCEL RUN (ABORT &amp; CLEAN)
          </button>
        )}
      </div>

      {/* 2. Headline counters */}
      {isComplete && cases.length > 0 && (
        <div
          id="sweep-complete-summary"
          style={{
            padding: 'var(--s3) var(--s4)',
            borderBottom: '1px solid var(--line-hair)',
            backgroundColor: 'var(--bg-raised)',
          }}
          aria-live="polite"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s2)' }}>
            <span style={{ fontSize: 'var(--fs-cap)', fontWeight: 600, color: 'var(--ink-hi)' }}>CASES: 13 / 13 ✓</span>
            <span id="sweep-complete-badge" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>100% COMPLETE</span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap' }}>
            <StatusBadge status="BREACH" label={`BREACH ${breachCount}`} />
            <StatusBadge status="DEGRADED" label={`DEGRADED ${degradedCount}`} />
            <span title="Headline denominator: cases where neither corridor breaches alone">
              <StatusBadge status="SYNTHETIC" label={`INTERACTION ${interactionCount}`} />
            </span>
          </div>
        </div>
      )}

      {/* 3. Filter chips */}
      {cases.length > 0 && (
        <div
          style={{
            padding: 'var(--s2) var(--s4)',
            display: 'flex',
            gap: 'var(--s1)',
            borderBottom: '1px solid var(--line-hair)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'all', label: 'All', count: 13 },
            { id: 'breach', label: 'Breach', count: breachCount },
            { id: 'degraded', label: 'Degraded', count: degradedCount },
            { id: 'interaction', label: 'Interaction', count: interactionCount },
          ].map((item) => (
            <div key={item.id} id={`filter-${item.id}`}>
              <Chip
                label={item.label}
                active={filter === item.id}
                count={item.count}
                onClick={() => setFilter(item.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* 4. Cases list */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Scenario Cases List"
        style={{ flex: 1, overflowY: 'auto' }}
      >
        {cases.length === 0 ? (
          <div style={{ padding: 'var(--s5) var(--s4)', color: 'var(--ink-lo)', textAlign: 'center', fontSize: 'var(--fs-cap)' }}>
            Select an observed corridor failure to begin.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-cap)' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--line-hair)',
                  color: 'var(--ink-lo)',
                  textAlign: 'left',
                  fontSize: 'var(--fs-micro)',
                  backgroundColor: 'var(--bg-header)',
                }}
              >
                <th
                  id="sort-f2-btn"
                  aria-sort={sortBy === 'f2' ? 'ascending' : 'none'}
                  style={{ padding: 'var(--s2) var(--s3)', cursor: 'pointer' }}
                  onClick={() => setSortBy('f2')}
                  title="Sort by secondary corridor ID"
                >
                  f2 CORRIDOR
                </th>
                <th
                  id="sort-verdict-btn"
                  aria-sort={sortBy === 'verdict' ? 'descending' : 'none'}
                  style={{ padding: 'var(--s2) var(--s3)', cursor: 'pointer', textAlign: 'right' }}
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
                return (
                  <tr
                    key={c.case_id}
                    className="case-row"
                    data-caseid={c.case_id}
                    id={`case-row-${c.case_id}`}
                    onClick={() => onSelectCase(c.case_id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--bg-raised)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                      borderBottom: '1px solid var(--line-hair)',
                      height: '28px',
                    }}
                  >
                    <td style={{ padding: 'var(--s2) var(--s3)' }}>
                      <div className="mono" style={{ color: 'var(--ink-hi)', fontWeight: 500 }}>
                        {c.f2.replace('road_', '')}
                      </div>
                      {c.interaction_only && (
                        <span
                          style={{
                            fontSize: 'var(--fs-micro)',
                            color: 'var(--accent)',
                            display: 'inline-block',
                          }}
                        >
                          ⚡ Interaction Only
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--s2) var(--s3)', textAlign: 'right' }}>
                      <StatusBadge status={c.verdict} />
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
