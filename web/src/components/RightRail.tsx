import React from 'react';

interface PolicySummary {
  name: string;
  chosen_action?: {
    action_id: string;
    action_kind: string;
    target_id: string;
    cost: number;
    description: string;
  } | null;
  abstain?: boolean;
  exposed_count: number;
  total_breaches: number;
  cost: number;
}

interface RunData {
  run_id: string;
  f1_corridor_id: string;
  decomposition: {
    f1_alone_cases: string[];
    f2_alone_cases: string[];
    interaction_only_cases: string[];
    headline_interaction_only_count: number;
    total_cases: number;
  };
  policies: {
    A: PolicySummary;
    B: PolicySummary;
    C: PolicySummary;
  };
  recommendation: {
    verdict: string;
    abstain: boolean;
    reason?: string;
    action?: {
      id: string;
      kind: string;
      target: string;
      cost: number;
      description: string;
    } | null;
    exposed_cases: string[];
    exposed_count: number;
  };
  decision?: {
    decision_id: string;
    verdict: string;
    rationale: string;
    actor: string;
    recorded_at: string;
  } | null;
}

interface RightRailProps {
  runData: RunData | null;
  selectedCaseId: string;
  onOpenDecisionModal: (verdict: 'APPROVE' | 'REJECT') => void;
  onNavigateToEvidence: (caseId: string) => void;
}

export const RightRail: React.FC<RightRailProps> = ({
  runData,
  selectedCaseId,
  onOpenDecisionModal,
  onNavigateToEvidence,
}) => {
  if (!runData) {
    return (
      <aside
        style={{
          width: '380px',
          backgroundColor: 'var(--panel)',
          borderLeft: '1px solid var(--line)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: 'var(--text-3)',
          height: 'calc(100vh - 48px - 56px)',
        }}
        role="region"
        aria-label="Policy Comparison"
      >
        <div style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '8px', fontWeight: 600 }}>
          No Active Scenario Run
        </div>
        <p style={{ fontSize: '12px', lineHeight: 1.5, maxWidth: '280px' }}>
          Select an observed failure corridor on the left rail and run the pre-mortem sweep to compare Policies A, B, and C.
        </p>
      </aside>
    );
  }

  const { policies, decomposition, recommendation, decision } = runData;
  const isAbstained = recommendation.abstain;
  const isDecided = Boolean(decision);

  return (
    <aside
      style={{
        width: '380px',
        backgroundColor: 'var(--panel)',
        borderLeft: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 48px - 56px)',
        overflowY: 'auto',
      }}
      role="region"
      aria-label="Policy Comparison and Recommendation"
    >
      {/* 1. Policy Comparison Section */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--line)' }}>
        <h2 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: '12px' }}>
          Policy Comparison (182-Case Foundation)
        </h2>

        {/* Policy Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Policy A */}
          <div style={{ padding: '10px', backgroundColor: 'var(--panel-2)', borderRadius: '4px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ fontSize: '12px' }}>Policy A: No Action (Baseline)</strong>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>Budget: 0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-2)' }}>Exposed Cases:</span>
              <span className="mono" style={{ color: 'var(--fail)', fontWeight: 600 }}>
                {policies.A.exposed_count} / {decomposition.total_cases}
              </span>
            </div>
          </div>

          {/* Policy B */}
          <div style={{ padding: '10px', backgroundColor: 'var(--panel-2)', borderRadius: '4px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ fontSize: '12px' }}>Policy B: Static Heuristic</strong>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>Degree Centrality</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '4px' }}>
              Action: {policies.B.chosen_action?.target_id || 'Static Depot Selection'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-2)' }}>Exposed Cases:</span>
              <span className="mono" style={{ color: policies.B.exposed_count > 0 ? 'var(--fail)' : 'var(--ok)', fontWeight: 600 }}>
                {policies.B.exposed_count} / {decomposition.total_cases}
              </span>
            </div>
          </div>

          {/* Policy C */}
          <div
            style={{
              padding: '10px',
              backgroundColor: 'rgba(79, 179, 255, 0.08)',
              borderRadius: '4px',
              border: '1px solid var(--accent)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ fontSize: '12px', color: 'var(--accent)' }}>Policy C: Pre-Mortem Conditional N-1</strong>
              <span className="badge badge-branch">FalkorDB Branches</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '4px' }}>
              {policies.C.chosen_action ? policies.C.chosen_action.description : 'Evaluated all 13 second-failures'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-2)' }}>Residual Exposed Cases:</span>
              <span className="mono" style={{ color: policies.C.exposed_count > 0 ? 'var(--fail)' : 'var(--ok)', fontWeight: 700 }}>
                {policies.C.exposed_count} / {decomposition.total_cases}
              </span>
            </div>
          </div>
        </div>

        {/* Headline Denominator Note */}
        <div
          style={{
            marginTop: '10px',
            padding: '8px',
            backgroundColor: 'var(--panel-2)',
            borderRadius: '4px',
            fontSize: '11px',
            color: 'var(--text-2)',
          }}
        >
          <strong style={{ color: 'var(--accent)' }}>Headline Denominator: </strong>
          <span className="mono">{decomposition.headline_interaction_only_count}</span> interaction-only cases where neither corridor breaches alone.
        </div>
      </div>

      {/* 2. Recommendation or Abstention Card */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--line)' }}>
        <h2 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: '10px' }}>
          Decision Output
        </h2>

        {isAbstained ? (
          <div
            style={{
              padding: '14px',
              backgroundColor: 'rgba(229, 84, 75, 0.1)',
              border: '1px solid var(--fail)',
              borderRadius: '4px',
            }}
            role="status"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>⛔</span>
              <strong style={{ color: 'var(--fail)', fontSize: '13px' }}>ABSTAIN — NO ROBUST PLAN</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.45, marginBottom: '8px' }}>
              No single allowed action preserves all critical SLAs across every evaluated second failure. Jaal refuses to recommend a plan that leaves known breaches.
            </p>
            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              Uncovered second failures ({recommendation.exposed_count}):
              <div className="mono" style={{ marginTop: '4px', color: 'var(--fail)' }}>
                {recommendation.exposed_cases.join(', ')}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '14px',
              backgroundColor: 'rgba(63, 191, 143, 0.1)',
              border: '1px solid var(--ok)',
              borderRadius: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>✓</span>
              <strong style={{ color: 'var(--ok)', fontSize: '13px' }}>ROBUST RECOMMENDATION AVAILABLE</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.45, marginBottom: '8px' }}>
              {recommendation.action?.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)' }}>
              <span>Action Cost: {recommendation.action?.cost} units</span>
              <span>Residual Breaches: 0 / 13</span>
            </div>
          </div>
        )}

        {/* Decision Banner if already decided */}
        {isDecided && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--line)',
              borderRadius: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className={`badge ${decision?.verdict === 'APPROVE' ? 'badge-ok' : 'badge-fail'}`}>
                {decision?.verdict}D BY COMMANDER
              </span>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                {decision?.recorded_at.slice(11, 19)} UTC
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-2)', fontStyle: 'italic' }}>
              "{decision?.rationale}"
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>
              Recorded by {decision?.actor} in jaal_memory.
            </div>
          </div>
        )}

        {/* Commander Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <button
            onClick={() => onOpenDecisionModal('APPROVE')}
            disabled={isAbstained || isDecided}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '4px',
              backgroundColor: isAbstained || isDecided ? 'var(--line)' : 'var(--ok)',
              color: isAbstained || isDecided ? 'var(--text-3)' : '#000',
              fontWeight: 700,
              border: 'none',
              cursor: isAbstained || isDecided ? 'not-allowed' : 'pointer',
              fontSize: '12px',
            }}
            id="approve-action-btn"
          >
            APPROVE PLAN
          </button>
          <button
            onClick={() => onOpenDecisionModal('REJECT')}
            disabled={isDecided}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '4px',
              backgroundColor: isDecided ? 'var(--line)' : 'var(--panel-2)',
              color: isDecided ? 'var(--text-3)' : 'var(--fail)',
              border: '1px solid var(--line)',
              fontWeight: 700,
              cursor: isDecided ? 'not-allowed' : 'pointer',
              fontSize: '12px',
            }}
            id="reject-action-btn"
          >
            REJECT PLAN
          </button>
        </div>
      </div>

      {/* 3. Deep Drill-Through Evidence Link */}
      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Case Evidence & Verification
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.45, marginBottom: '10px' }}>
          Inspect the exact branch mutation ledger, route node sequences, arc cost arithmetic, and alert hop chains.
        </p>
        <button
          onClick={() => onNavigateToEvidence(selectedCaseId)}
          disabled={!selectedCaseId}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: !selectedCaseId ? 'not-allowed' : 'pointer',
          }}
        >
          {selectedCaseId ? `Open Evidence for ${selectedCaseId.replace('__', ' + ')} ▸` : 'Select a Case to Inspect Evidence'}
        </button>
      </div>
    </aside>
  );
};
