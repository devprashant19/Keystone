import React, { useEffect, useState, useRef, useCallback } from 'react';

export interface TourStep {
  stepNumber: number;
  title: string;
  narration: string;
  targetSelector: string;
  applyState: () => void;
}

interface PresenterTourProps {
  isOpen: boolean;
  currentStep: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
  onApplyStepState: (stepIndex: number) => void;
}

export const TOUR_STEPS_DEF = [
  {
    stepNumber: 1,
    title: 'The Question',
    narration: 'When primary corridor Monastery–Chandgiram fails during a monsoon surge, which secondary route failures actually matter?',
    targetSelector: '#corridor-select',
  },
  {
    stepNumber: 2,
    title: 'The Graph Does the Work',
    narration: 'Switching to Schematic exposes cross-layer infrastructure: road carriers, power feeders, and telecom telemetry arcs.',
    targetSelector: '#tab-schematic',
  },
  {
    stepNumber: 3,
    title: 'Conditional N-1 Pre-Mortem',
    narration: 'KEYSTONE forks 13 isolated counterfactual branches in FalkorDB to evaluate every potential second corridor failure ahead of time.',
    targetSelector: '#run-sweep-btn',
  },
  {
    stepNumber: 4,
    title: 'Evidence-Backed Causal Chains',
    narration: 'Every latency and breach is mathematically decomposed along the dependency chain, summing exactly to the total.',
    targetSelector: '#policy-row-C',
  },
  {
    stepNumber: 5,
    title: 'Fair Baseline Comparison',
    narration: 'Policies A, B, and C are evaluated over identical denominators; wins in single-failure regions receive zero pre-mortem credit.',
    targetSelector: '#policy-row-C',
  },
  {
    stepNumber: 6,
    title: 'The Honest Finding',
    narration: 'At the frozen 6.8 km SLA, exactly 0 interaction-only cases exist among 182 scenarios—reported openly as a null interaction finding.',
    targetSelector: '#null-result-panel',
  },
  {
    stepNumber: 7,
    title: 'Abstention and Audit Memory',
    narration: 'When no robust plan exists KEYSTONE abstains and disables approval; otherwise commander decisions commit immutably to keystone_memory.',
    targetSelector: '#decision-action-block',
  },
];

export const PresenterTour: React.FC<PresenterTourProps> = ({
  isOpen,
  currentStep,
  onStepChange,
  onClose,
  onApplyStepState,
}) => {
  const [targetRect, setTargetRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [cardAnimationClass, setCardAnimationClass] = useState<'incoming' | 'outgoing'>('incoming');
  const cardRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = Math.max(1, Math.min(currentStep, 7));
  const currentDef = TOUR_STEPS_DEF[activeIndex - 1];

  // Measure target element position
  const updateTargetBounds = useCallback(() => {
    if (!isOpen) return;
    const el = document.querySelector(currentDef.targetSelector);
    if (el) {
      const r = el.getBoundingClientRect();
      const padding = 6;
      setTargetRect({
        x: Math.max(0, r.left - padding),
        y: Math.max(0, r.top - padding),
        w: r.width + padding * 2,
        h: r.height + padding * 2,
      });
    } else {
      // Default center viewport fallback if target is not currently rendered
      setTargetRect({
        x: window.innerWidth / 2 - 150,
        y: window.innerHeight / 2 - 100,
        w: 300,
        h: 200,
      });
    }
  }, [isOpen, currentDef.targetSelector]);

  // Apply real state and update target bounds on step change
  useEffect(() => {
    if (!isOpen) return;
    onApplyStepState(activeIndex);

    // M7 animation sequence
    setCardAnimationClass('outgoing');
    const timer = setTimeout(() => {
      updateTargetBounds();
      setCardAnimationClass('incoming');
    }, 120);

    return () => clearTimeout(timer);
  }, [isOpen, activeIndex, onApplyStepState, updateTargetBounds]);

  // Sync window resize
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', updateTargetBounds);
    return () => window.removeEventListener('resize', updateTargetBounds);
  }, [isOpen, updateTargetBounds]);

  // Keyboard navigation: ArrowRight / Enter for Next, ArrowLeft for Prev, Escape for Exit
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (activeIndex < 7) {
          e.preventDefault();
          onStepChange(activeIndex + 1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (activeIndex > 1) {
          e.preventDefault();
          onStepChange(activeIndex - 1);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, activeIndex, onStepChange, onClose]);

  if (!isOpen) return null;

  // Calculate anchored narration card coordinates
  // Position either below target, or above target if target is low on screen
  let cardTop = (targetRect?.y || 200) + (targetRect?.h || 60) + 12;
  let cardLeft = targetRect?.x || 100;
  const cardWidth = 360;

  if (cardTop + 220 > window.innerHeight) {
    // Flip above target
    cardTop = Math.max(16, (targetRect?.y || 200) - 220);
  }
  if (cardLeft + cardWidth > window.innerWidth - 20) {
    cardLeft = Math.max(16, window.innerWidth - cardWidth - 20);
  }

  return (
    <div
      id="presenter-tour-root"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 900,
        pointerEvents: 'none',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Presenter Walkthrough"
    >
      {/* 1. Spotlight SVG Overlay: dims background to 55% with continuous traveling cutout */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                className="tour-spotlight-rect"
                x={targetRect.x}
                y={targetRect.y}
                width={targetRect.w}
                height={targetRect.h}
                rx="4"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* 55% Darkened deck overlay */}
        <rect
          width="100%"
          height="100%"
          fill="var(--bg-spotlight)"
          mask="url(#tour-spotlight-mask)"
        />

        {/* Focus ring around raised target element */}
        {targetRect && (
          <rect
            className="tour-spotlight-rect"
            x={targetRect.x}
            y={targetRect.y}
            width={targetRect.w}
            height={targetRect.h}
            rx="4"
            fill="none"
            stroke="var(--line-focus)"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* 2. Anchored Narration Card (Never covers the target element) */}
      <div
        ref={cardRef}
        id="tour-narration-card"
        className={`tour-card ${cardAnimationClass}`}
        style={{
          position: 'absolute',
          top: `${cardTop}px`,
          left: `${cardLeft}px`,
          width: `${cardWidth}px`,
          backgroundColor: 'var(--bg-raised)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--r-panel)',
          boxShadow: 'var(--elevation-sticky)',
          padding: 'var(--s4)',
          pointerEvents: 'auto',
          boxSizing: 'border-box',
          zIndex: 950,
        }}
      >
        {/* Card Header: Step counter and Close button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s2)' }}>
          <span
            id="tour-step-counter"
            className="mono"
            style={{
              fontSize: 'var(--fs-micro)',
              color: 'var(--accent)',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            STEP {activeIndex} / 7
          </span>
          <button
            id="tour-close-btn"
            onClick={onClose}
            aria-label="Exit Walkthrough"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-lo)',
              fontSize: 'var(--fs-body)',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <h3
          id="tour-step-title"
          style={{
            fontSize: 'var(--fs-ui)',
            color: 'var(--ink-hi)',
            margin: '0 0 var(--s2) 0',
            fontWeight: 700,
          }}
        >
          {currentDef.title}
        </h3>

        {/* Narration sentence */}
        <p
          id="tour-step-narration"
          style={{
            fontSize: 'var(--fs-cap)',
            color: 'var(--ink-mid)',
            lineHeight: 'var(--lh-prose)',
            margin: '0 0 var(--s3) 0',
          }}
        >
          {currentDef.narration}
        </p>

        {/* 7-Segment Progress Rail */}
        <div
          id="tour-progress-rail"
          style={{
            display: 'flex',
            gap: '4px',
            marginBottom: 'var(--s3)',
            height: '4px',
          }}
          aria-label={`Progress: step ${activeIndex} of 7`}
        >
          {TOUR_STEPS_DEF.map((s) => {
            const isCompletedOrCurrent = s.stepNumber <= activeIndex;
            return (
              <div
                key={s.stepNumber}
                style={{
                  flex: 1,
                  height: '100%',
                  borderRadius: '2px',
                  backgroundColor: isCompletedOrCurrent ? 'var(--accent)' : 'var(--line-hair)',
                }}
              />
            );
          })}
        </div>

        {/* Navigation Controls: Back / Next / Exit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            id="tour-back-btn"
            onClick={() => onStepChange(activeIndex - 1)}
            disabled={activeIndex <= 1}
            style={{
              padding: 'var(--s1) var(--s3)',
              backgroundColor: activeIndex <= 1 ? 'var(--line-hair)' : 'var(--bg-sunken)',
              color: activeIndex <= 1 ? 'var(--ink-lo)' : 'var(--ink-mid)',
              border: '1px solid var(--line-hair)',
              borderRadius: 'var(--r-ctl)',
              fontSize: 'var(--fs-cap)',
              cursor: activeIndex <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ◀ Back
          </button>

          <div style={{ display: 'flex', gap: 'var(--s2)' }}>
            <button
              id="tour-exit-btn"
              onClick={onClose}
              style={{
                padding: 'var(--s1) var(--s2)',
                backgroundColor: 'transparent',
                color: 'var(--ink-lo)',
                border: 'none',
                fontSize: 'var(--fs-micro)',
                cursor: 'pointer',
              }}
            >
              Exit (Esc)
            </button>

            <button
              id="tour-next-btn"
              onClick={() => {
                if (activeIndex < 7) {
                  onStepChange(activeIndex + 1);
                } else {
                  onClose();
                }
              }}
              style={{
                padding: 'var(--s1) var(--s3)',
                backgroundColor: 'var(--accent)',
                color: 'var(--bg-void)',
                border: 'none',
                borderRadius: 'var(--r-ctl)',
                fontWeight: 700,
                fontSize: 'var(--fs-cap)',
                cursor: 'pointer',
              }}
            >
              {activeIndex === 7 ? 'Finish ✓' : 'Next ▶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
