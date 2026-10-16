import React from 'react';
import { DependencyChainStep } from './types';
import { StatusBadge } from '../components/primitives';

interface DependencyChainProps {
  steps?: DependencyChainStep[];
  onSelectEntity?: (entityId: string) => void;
  arithmetic?: {
    dispatch_min: number;
    transit_min: number;
    offset_min: number;
    total_min: number;
    deadline_min: number;
    is_breach: boolean;
  };
}

export const DependencyChain: React.FC<DependencyChainProps> = ({
  steps = [],
  onSelectEntity,
  arithmetic,
}) => {
  return (
    <div
      className="dependency-chain-panel"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--line-hair)',
        borderRadius: 'var(--r-panel)',
        padding: 'var(--s4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s4)',
      }}
      role="region"
      aria-label="Cross-Layer Causal Dependency Chain"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3
            style={{
              fontSize: 'var(--fs-cap)',
              textTransform: 'uppercase',
              color: 'var(--ink-hi)',
              margin: 0,
              fontWeight: 700,
            }}
          >
            Cross-Layer Causal Chain
          </h3>
          <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)', marginTop: '2px' }}>
            Root trigger propagation across physical and cyber-physical dependencies
          </div>
        </div>
      </div>

      {/* Stepper Columns */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          paddingBottom: 'var(--s2)',
          gap: 'var(--s2)',
        }}
      >
        {steps.map((step, idx) => {
          const reasonText = step.reason_code ? step.reason_code : 'cause not recorded';
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={`${step.entity_id}-${idx}`}>
              <div
                onClick={() => onSelectEntity?.(step.entity_id)}
                style={{
                  minWidth: '130px',
                  backgroundColor: 'var(--bg-raised)',
                  border: '1px solid var(--line-hair)',
                  borderRadius: 'var(--r-ctl)',
                  padding: 'var(--s3)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--s1)',
                }}
                className="chain-step-card"
              >
                <div
                  style={{
                    fontSize: '8px',
                    textTransform: 'uppercase',
                    color: 'var(--ink-lo)',
                    fontWeight: 700,
                  }}
                >
                  {step.kind.replace('_', ' ')}
                </div>

                <div
                  className="mono"
                  style={{
                    fontSize: 'var(--fs-micro)',
                    color: 'var(--ink-hi)',
                    fontWeight: 600,
                    wordBreak: 'break-all',
                  }}
                >
                  {step.entity_id}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <StatusBadge status={step.status === 'SEVERED' || step.status === 'BREACH' ? 'SEVERED' : 'OPERATIONAL'} label={step.status} />
                </div>

                {/* Reason code or explicit cause not recorded */}
                <div
                  className="mono reason-code-text"
                  style={{
                    fontSize: '9px',
                    color: step.reason_code ? 'var(--fail)' : 'var(--ink-lo)',
                    marginTop: '2px',
                  }}
                >
                  {reasonText}
                </div>
              </div>

              {/* Relationship connector between columns */}
              {!isLast && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '0 4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '8px',
                      color: 'var(--synthetic)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                    }}
                  >
                    {step.relationship_to_next || 'couples'}
                  </span>
                  <span style={{ color: 'var(--ink-lo)', fontSize: 'var(--fs-cap)' }}>➔</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Arithmetic Section */}
      {arithmetic && (
        <div
          className="chain-arithmetic-card"
          style={{
            backgroundColor: 'var(--bg-raised)',
            borderRadius: 'var(--r-ctl)',
            padding: 'var(--s3)',
            border: '1px solid var(--line-hair)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--s1)',
          }}
        >
          <div style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--ink-lo)', fontWeight: 700 }}>
            Response Time Equation (Verification U2-07)
          </div>
          <div
            className="mono arithmetic-line"
            style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}
          >
            dispatch <span className="val-dispatch">{arithmetic.dispatch_min.toFixed(1)}</span> + travel <span className="val-travel">{arithmetic.transit_min.toFixed(1)}</span> + offset <span className="val-offset">{arithmetic.offset_min.toFixed(1)}</span> = <strong className="val-total" style={{ color: 'var(--ink-hi)' }}>{arithmetic.total_min.toFixed(1)}</strong> min vs deadline <span className="val-deadline">{arithmetic.deadline_min.toFixed(1)}</span> →{' '}
            <strong
              style={{
                color: arithmetic.is_breach ? 'var(--fail)' : 'var(--ok)',
              }}
            >
              {arithmetic.is_breach ? 'BREACH' : 'MET'}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
