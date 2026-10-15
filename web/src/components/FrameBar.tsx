import React from 'react';

interface FrameBarProps {
  currentFrame: number;
  onSelectFrame: (frame: number) => void;
  branchName: string;
}

const FRAMES = [
  { index: 0, label: '0 Baseline', desc: 'No failure · World baseline state' },
  { index: 1, label: '1 Observed f1', desc: 'Observed primary corridor failure + cascade' },
  { index: 2, label: '2 Action', desc: 'Candidate preventive action in lead window' },
  { index: 3, label: '3 Second f2', desc: 'Evaluated second failure scenario' },
  { index: 4, label: '4 Outcome', desc: 'Terminal state & SLA comparison' },
];

export const FrameBar: React.FC<FrameBarProps> = ({
  currentFrame,
  onSelectFrame,
  branchName,
}) => {
  return (
    <footer
      style={{
        height: '56px',
        backgroundColor: 'var(--panel)',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        userSelect: 'none',
      }}
      role="region"
      aria-label="Counterfactual Frame Stepper"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>
          FRAMES (◀ / ▶):
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {FRAMES.map((f) => {
            const isActive = currentFrame === f.index;
            return (
              <button
                key={f.index}
                onClick={() => onSelectFrame(f.index)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--accent)' : 'var(--line)',
                  backgroundColor: isActive ? 'var(--panel-2)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-2)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title={f.desc}
                aria-pressed={isActive}
              >
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Display active branch graph ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="mono">
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>GRAPH STATE:</span>
        <span
          className={`badge ${currentFrame >= 2 ? 'badge-branch' : 'badge-ok'}`}
          style={{ fontSize: '11px' }}
        >
          {currentFrame >= 2 ? branchName || 'jaal_branch_counterfactual' : 'jaal_world (base)'}
        </span>
      </div>
    </footer>
  );
};
