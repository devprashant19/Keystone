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

  useEffect(() => {
    if (isOpen) {
      setRationale('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isRationaleValid = rationale.trim().length >= 10;

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
      aria-labelledby="decision-title"
    >
      <div
        style={{
          width: '460px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <h2 id="decision-title" style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '8px' }}>
          Confirm Incident Command Decision: {verdict}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.45, marginBottom: '16px' }}>
          This action will commit a permanent decision record into the graph memory (
          <code className="mono">jaal_memory</code>). An operational rationale of at least 10 characters is mandatory.
        </p>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>
            Commander / Authorized Officer Name
          </label>
          <input
            type="text"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>
            Operational Justification & Rationale (Minimum 10 Characters) *
          </label>
          <textarea
            ref={inputRef}
            rows={4}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Document why this contingency recommendation is accepted or rejected..."
            style={{
              width: '100%',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              resize: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px' }}>
            <span style={{ color: isRationaleValid ? 'var(--ok)' : 'var(--warn)' }}>
              {rationale.trim().length} / 10 min characters
            </span>
            <span style={{ color: 'var(--text-3)' }}>Recorded in memory</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--line)',
              color: 'var(--text-2)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Cancel
          </button>

          <button
            onClick={() => onSubmit(rationale, actor)}
            disabled={!isRationaleValid || isSubmitting}
            style={{
              padding: '8px 16px',
              backgroundColor: verdict === 'APPROVE' ? 'var(--ok)' : 'var(--fail)',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              borderRadius: '4px',
              cursor: !isRationaleValid || isSubmitting ? 'not-allowed' : 'pointer',
              opacity: !isRationaleValid || isSubmitting ? 0.5 : 1,
              fontSize: '12px',
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
