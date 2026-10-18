import React, { useState, useEffect, useRef } from 'react';

interface DecisionModalProps {
  isOpen: boolean;
  verdict: 'APPROVE' | 'REJECT';
  onClose: () => void;
  onSubmit: (rationale: string, actor: string) => void;
  isSubmitting: boolean;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  isOpen,
  verdict,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [rationale, setRationale] = useState<string>('');
  const [actor, setActor] = useState<string>('Commander Inc-01');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = (document.activeElement as HTMLElement) || null;
      setRationale('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isRationaleValid = rationale.trim().length >= 10;

  return (
    <div
      id="decision-modal"
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
      aria-labelledby="decision-title"
    >
      <div
        style={{
          width: 'min(460px, calc(100vw - 32px))',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--line-hair)',
          borderRadius: 'var(--r-panel)',
          padding: 'var(--s5)',
          boxShadow: 'var(--elevation-sticky)',
        }}
      >
        <h2 id="decision-title" style={{ fontSize: 'var(--fs-ui)', color: 'var(--ink-hi)', marginBottom: 'var(--s2)', margin: 0 }}>
          Confirm Incident Command Decision: {verdict}
        </h2>
        <p style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)', lineHeight: 'var(--lh-data)', marginBottom: 'var(--s4)' }}>
          This action will commit a permanent decision record into the graph memory (
          <code className="mono">keystone_memory</code>). An operational rationale of at least 10 characters is mandatory.
        </p>

        <div style={{ marginBottom: 'var(--s3)' }}>
          <label style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)', marginBottom: 'var(--s1)' }}>
            Commander / Authorized Officer Name
          </label>
          <input
            type="text"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-sunken)',
              border: '1px solid var(--line-hair)',
              color: 'var(--ink-hi)',
              padding: 'var(--s2)',
              borderRadius: 'var(--r-ctl)',
              fontSize: 'var(--fs-cap)',
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--s4)' }}>
          <label style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)', marginBottom: 'var(--s1)' }}>
            Operational Justification & Rationale (Minimum 10 Characters) *
          </label>
          <textarea
            id="rationale-input"
            ref={inputRef}
            rows={4}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Document why this contingency recommendation is accepted or rejected..."
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-sunken)',
              border: '1px solid var(--line-hair)',
              color: 'var(--ink-hi)',
              padding: 'var(--s2)',
              borderRadius: 'var(--r-ctl)',
              fontSize: 'var(--fs-cap)',
              resize: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--s1)', fontSize: 'var(--fs-micro)' }}>
            <span style={{ color: isRationaleValid ? 'var(--ok)' : 'var(--warn)' }}>
              {rationale.trim().length} / 10 min characters
            </span>
            <span style={{ color: 'var(--ink-lo)' }}>Recorded in memory</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--s2)' }}>
          <button
            id="decision-cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: 'var(--s2) var(--s4)',
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--line-hair)',
              color: 'var(--ink-mid)',
              borderRadius: 'var(--r-ctl)',
              cursor: 'pointer',
              fontSize: 'var(--fs-cap)',
            }}
          >
            Cancel
          </button>

          <button
            onClick={() => onSubmit(rationale, actor)}
            disabled={!isRationaleValid || isSubmitting}
            style={{
              padding: 'var(--s2) var(--s4)',
              backgroundColor: verdict === 'APPROVE' ? 'var(--ok)' : 'var(--fail)',
              color: 'var(--bg-void)',
              fontWeight: 700,
              border: 'none',
              borderRadius: 'var(--r-ctl)',
              cursor: !isRationaleValid || isSubmitting ? 'not-allowed' : 'pointer',
              opacity: !isRationaleValid || isSubmitting ? 0.5 : 1,
              fontSize: 'var(--fs-cap)',
            }}
            id="confirm-decision-btn"
          >
            {isSubmitting ? 'Recording…' : `Confirm ${verdict}`}
          </button>
        </div>
      </div>
    </div>
  );
};
