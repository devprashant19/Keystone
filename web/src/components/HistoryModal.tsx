import React from 'react';
import { StatusBadge } from './primitives';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastRuns: Array<{
    run_id: string;
    f1_corridor_id: string;
    created_at: string;
    verdict: string;
  }>;
  onSelectRun: (runId: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  pastRuns,
  onSelectRun,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="history-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--overlay-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
    >
      <div
        style={{
          width: '540px',
          maxHeight: '480px',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--line-hair)',
          borderRadius: 'var(--r-panel)',
          padding: 'var(--s5)',
          boxShadow: 'var(--elevation-sticky)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s3)' }}>
          <h2 id="history-title" style={{ fontSize: 'var(--fs-ui)', color: 'var(--ink-hi)', margin: 0 }}>
            Run History (Auditable Graph Memory)
          </h2>
          <button
            id="close-history-btn"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--ink-lo)', cursor: 'pointer', fontSize: 'var(--fs-ui)' }}
            aria-label="Close history modal"
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)', marginBottom: 'var(--s4)', lineHeight: 'var(--lh-data)' }}>
          Past evaluation runs loaded from graph memory. Click a run to inspect its counterfactual branches and verdicts in read-only mode.
        </p>

        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--line-hair)', borderRadius: 'var(--r-ctl)' }}>
          {pastRuns.length === 0 ? (
            <div style={{ padding: 'var(--s5)', textAlign: 'center', color: 'var(--ink-lo)', fontSize: 'var(--fs-cap)' }}>
              No previous runs recorded in this session.
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 'var(--fs-cap)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--ink-lo)', borderBottom: '1px solid var(--line-hair)', textAlign: 'left', backgroundColor: 'var(--bg-header)' }}>
                  <th style={{ padding: 'var(--s2) var(--s3)' }}>Run ID</th>
                  <th style={{ padding: 'var(--s2) var(--s3)' }}>f1 Failure</th>
                  <th style={{ padding: 'var(--s2) var(--s3)' }}>Outcome</th>
                  <th style={{ padding: 'var(--s2) var(--s3)', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pastRuns.map((r) => (
                  <tr key={r.run_id} style={{ borderBottom: '1px solid var(--line-hair)' }}>
                    <td className="mono" style={{ padding: 'var(--s2) var(--s3)', color: 'var(--ink-hi)' }}>{r.run_id}</td>
                    <td style={{ padding: 'var(--s2) var(--s3)', color: 'var(--ink-mid)' }}>{r.f1_corridor_id.replace('road_', '')}</td>
                    <td style={{ padding: 'var(--s2) var(--s3)' }}>
                      <StatusBadge status={r.verdict.includes('ABSTAIN') ? 'BREACH' : 'OK'} label={r.verdict} />
                    </td>
                    <td style={{ padding: 'var(--s2) var(--s3)', textAlign: 'right' }}>
                      <button
                        className="history-open-btn"
                        id={`history-open-${r.run_id}`}
                        onClick={() => { onSelectRun(r.run_id); onClose(); }}
                        style={{
                          padding: '2px var(--s2)',
                          backgroundColor: 'var(--bg-raised)',
                          border: '1px solid var(--accent-edge)',
                          color: 'var(--accent)',
                          borderRadius: 'var(--r-chip)',
                          cursor: 'pointer',
                          fontSize: 'var(--fs-micro)',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
