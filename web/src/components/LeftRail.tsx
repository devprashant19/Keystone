import React, { useState } from 'react';
import { StatusBadge, Chip } from './primitives';

export interface Corridor {
  id: string;
  name: string;
  length_km: number;
  status: string;
  data_origin: string;
  breach_count?: number;
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
  onClear?: () => void;
  onRecomputeLive?: () => void;
  isLoading?: boolean;
  runState?: 'idle' | 'running' | 'complete';
  cases: CaseSummary[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  isDbDown: boolean;
  elapsedMs?: number | null;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  corridors,
  selectedF1,
  onSelectF1,
  onRunSweep,
  onCancelRun,
  onClear,
  onRecomputeLive,
  isLoading: propIsLoading,
  runState: propRunState,
  cases,
  selectedCaseId,
  onSelectCase,
  isDbDown,
  elapsedMs,
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
        width: '100%',
        backgroundColor: 'var(--bg-panel)',
        borderRight: '1px solid var(--line-hair)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s2)' }}>
          <label
            htmlFor="corridor-select"
            style={{
              display: 'block',
              fontSize: 'var(--fs-micro)',
              textTransform: 'uppercase',
              color: 'var(--ink-lo)',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            Observed Failure (f1)
          </label>
          {Boolean(selectedF1) && onClear && (
            <button
              id="clear-btn"
              onClick={onClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ink-lo)',
                fontSize: 'var(--fs-micro)',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '0 4px',
                fontWeight: 600,
              }}
              aria-label="Clear corridor selection"
              title="Reset selection and return to empty idle state"
            >
              Clear
            </button>
          )}
        </div>
        <div style={{ position: 'relative', marginBottom: 'var(--s3)' }}>
          <select
            value={selectedF1}
            onChange={(e) => onSelectF1(e.target.value)}
            disabled={isRunning || isDbDown}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-sunken)',
              border: '1px solid var(--line-hair)',
              color: 'var(--ink-hi)',
              padding: '10px 32px 10px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              cursor: isRunning || isDbDown ? 'not-allowed' : 'pointer',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              display: 'block',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
            id="corridor-select"
          >
            <option value="">— Select an observed corridor failure —</option>
            {corridors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.length_km.toFixed(1)} km{c.breach_count !== undefined ? ` · ${c.breach_count} breaches` : ''}
              </option>
            ))}
          </select>
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--ink-mid)',
              fontSize: '11px',
            }}
            aria-hidden="true"
          >
            ▼
          </div>
        </div>

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

        {onRecomputeLive && Boolean(selectedF1) && !isRunning && (
          <button
            id="recompute-live-btn"
            onClick={onRecomputeLive}
            style={{
              width: '100%',
              marginTop: 'var(--s2)',
              backgroundColor: 'var(--bg-sunken)',
              color: 'var(--ink-hi)',
              border: '1px solid var(--line-hair)',
              padding: 'var(--s1) var(--s2)',
              borderRadius: 'var(--r-ctl)',
              fontWeight: 600,
              fontSize: 'var(--fs-micro)',
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
            title="Recompute this scenario sweep live against FalkorDB"
          >
            {elapsedMs ? `RECOMPUTE LIVE (LAST: ${elapsedMs}ms)` : 'RECOMPUTE LIVE'}
          </button>
        )}

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

          <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap' }}>
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
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 'var(--fs-cap)' }}>
            <colgroup>
              <col style={{ width: 'calc(100% - 110px)' }} />
              <col style={{ width: '110px' }} />
            </colgroup>
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
                  style={{ padding: 'var(--s2) var(--s3)', cursor: 'pointer', overflow: 'hidden' }}
                  onClick={() => setSortBy('f2')}
                  title="Sort by secondary corridor ID"
                >
                  f2 CORRIDOR
                </th>
                <th
                  id="sort-verdict-btn"
                  aria-sort={sortBy === 'verdict' ? 'descending' : 'none'}
                  style={{ padding: 'var(--s2) var(--s3)', cursor: 'pointer', textAlign: 'right', width: '110px', whiteSpace: 'nowrap' }}
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
                    <td style={{ padding: 'var(--s2) var(--s3)', overflow: 'hidden' }}>
                      <div
                        className="mono"
                        title={c.f2}
                        style={{
                          color: 'var(--ink-hi)',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.f2.replace('road_', '')}
                      </div>
                      {c.interaction_only && (
                        <span
                          style={{
                            fontSize: 'var(--fs-micro)',
                            color: 'var(--accent)',
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ⚡ Interaction Only
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--s2) var(--s3)', textAlign: 'right', width: '110px', whiteSpace: 'nowrap' }}>
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
