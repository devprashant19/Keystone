import React from 'react';

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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 14, 20, 0.85)',
        backdropFilter: 'blur(2px)',
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
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 id="history-title" style={{ fontSize: '15px', color: 'var(--text)' }}>
            Run History (Auditable Graph Memory)
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '16px', lineHeight: 1.45 }}>
          Past evaluation runs loaded from graph memory. Click a run to inspect its counterfactual branches and verdicts in read-only mode.
        </p>

        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '4px' }}>
          {pastRuns.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
              No previous runs recorded in this session.
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--line)', textAlign: 'left', backgroundColor: 'var(--panel-2)' }}>
                  <th style={{ padding: '8px 12px' }}>Run ID</th>
                  <th style={{ padding: '8px 12px' }}>f1 Failure</th>
                  <th style={{ padding: '8px 12px' }}>Outcome</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pastRuns.map((r) => (
                  <tr key={r.run_id} style={{ borderBottom: '1px solid rgba(36,48,64,0.4)' }}>
                    <td className="mono" style={{ padding: '8px 12px' }}>{r.run_id}</td>
                    <td style={{ padding: '8px 12px' }}>{r.f1_corridor_id.replace('road_', '')}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className={`badge ${r.verdict.includes('ABSTAIN') ? 'badge-fail' : 'badge-ok'}`}>
                        {r.verdict}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <button
                        onClick={() => { onSelectRun(r.run_id); onClose(); }}
                        style={{
                          padding: '3px 8px',
                          backgroundColor: 'var(--panel-2)',
                          border: '1px solid var(--accent)',
                          color: 'var(--accent)',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          fontSize: '11px',
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
