import React, { useEffect, useRef } from 'react';
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
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentFrame]);

  return (
    <footer
      className="framebar-root"
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
      <div className="framebar-stepper-wrap" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
        <button
          id="frame-prev-btn"
          onClick={() => onSelectFrame(Math.max(0, currentFrame - 1))}
          disabled={currentFrame <= 0}
          style={{
            padding: 'var(--s1) var(--s2)',
            borderRadius: 'var(--r-ctl)',
            border: '1px solid var(--line-hair)',
            backgroundColor: 'var(--bg-raised)',
            color: currentFrame <= 0 ? 'var(--ink-lo)' : 'var(--ink-hi)',
            cursor: currentFrame <= 0 ? 'not-allowed' : 'pointer',
            fontSize: 'var(--fs-micro)',
            flexShrink: 0,
          }}
          title="Previous Frame (ArrowLeft)"
          aria-label="Previous Frame"
        >
          ◀
        </button>
        <span
          className="framebar-label"
          style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', fontWeight: 600, flexShrink: 0 }}
        >
          FRAMES:
        </span>
        <div className="framebar-buttons-scroll" style={{ display: 'flex', gap: 'var(--s1)', overflowX: 'auto' }}>
          {FRAMES.map((f) => {
            const isActive = currentFrame === f.index;
            return (
              <button
                key={f.index}
                ref={isActive ? activeBtnRef : undefined}
                id={`frame-step-${f.index}`}
                className={`frame-step ${isActive ? 'active' : ''}`}
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
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                title={f.desc}
                aria-pressed={isActive}
              >
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
        <button
          id="frame-next-btn"
          onClick={() => onSelectFrame(Math.min(4, currentFrame + 1))}
          disabled={currentFrame >= 4}
          style={{
            padding: 'var(--s1) var(--s2)',
            borderRadius: 'var(--r-ctl)',
            border: '1px solid var(--line-hair)',
            backgroundColor: 'var(--bg-raised)',
            color: currentFrame >= 4 ? 'var(--ink-lo)' : 'var(--ink-hi)',
            cursor: currentFrame >= 4 ? 'not-allowed' : 'pointer',
            fontSize: 'var(--fs-micro)',
            flexShrink: 0,
          }}
          title="Next Frame (ArrowRight)"
          aria-label="Next Frame"
        >
          ▶
        </button>
      </div>

      {/* Display active branch graph ID */}
      <div className="framebar-status-wrap mono" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', flexShrink: 0 }}>
        <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>GRAPH STATE:</span>
        <StatusBadge
          status={currentFrame >= 2 ? 'BRANCH' : 'OK'}
          label={currentFrame >= 2 ? (branchName || 'keystone_branch_counterfactual') : 'keystone_world (base)'}
        />
      </div>
    </footer>
  );
};
