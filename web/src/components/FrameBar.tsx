import React from 'react';
import { StatusBadge } from './primitives';

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
        height: 'var(--h-framebar)',
        backgroundColor: 'var(--bg-panel)',
        borderTop: '1px solid var(--line-hair)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--s5)',
        userSelect: 'none',
      }}
      role="region"
      aria-label="Counterfactual Frame Stepper"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
        <span style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', fontWeight: 600 }}>
          FRAMES (◀ / ▶):
        </span>
        <div style={{ display: 'flex', gap: 'var(--s1)' }}>
          {FRAMES.map((f) => {
            const isActive = currentFrame === f.index;
            return (
              <button
                key={f.index}
                onClick={() => onSelectFrame(f.index)}
                style={{
                  padding: 'var(--s2) var(--s3)',
                  borderRadius: 'var(--r-ctl)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--accent)' : 'var(--line-hair)',
                  backgroundColor: isActive ? 'var(--accent-wash)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--ink-mid)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 'var(--fs-cap)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--s1)',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }} className="mono">
        <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>GRAPH STATE:</span>
        <StatusBadge
          status={currentFrame >= 2 ? 'BRANCH' : 'OK'}
          label={currentFrame >= 2 ? (branchName || 'jaal_branch_counterfactual') : 'jaal_world (base)'}
        />
      </div>
    </footer>
  );
};
