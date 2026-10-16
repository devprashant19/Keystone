import React from 'react';
import { StatusBadge } from './primitives';

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
  if (!runData || !runData.recommendation || !runData.policies || !runData.decomposition) {
    return (
      <aside
        className="right-rail"
        style={{
          width: 'var(--w-rail-r)',
          backgroundColor: 'var(--bg-panel)',
          borderLeft: '1px solid var(--line-hair)',
          padding: 'var(--s5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: 'var(--ink-lo)',
          height: 'calc(100vh - var(--h-header) - var(--h-framebar))',
        }}
        role="region"
        aria-label="Policy Comparison"
      >
        <div style={{ fontSize: 'var(--fs-ui)', color: 'var(--ink-mid)', marginBottom: 'var(--s2)', fontWeight: 600 }}>
          No Active Scenario Run
        </div>
        <p style={{ fontSize: 'var(--fs-cap)', lineHeight: 'var(--lh-prose)', maxWidth: '280px' }}>
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
      className="right-rail"
      style={{
        width: 'var(--w-rail-r)',
        backgroundColor: 'var(--bg-panel)',
        borderLeft: '1px solid var(--line-hair)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--h-header) - var(--h-framebar))',
        overflowY: 'auto',
      }}
      role="region"
      aria-label="Policy Comparison and Recommendation"
    >
      {/* 1. Policy Comparison Section */}
      <div style={{ padding: 'var(--s4)', borderBottom: '1px solid var(--line-hair)' }}>
        <h2 style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', letterSpacing: '0.04em', marginBottom: 'var(--s3)' }}>
          Policy Comparison (182-Case Foundation)
        </h2>

        {/* Policy Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
          {/* Policy A */}
          <div style={{ padding: 'var(--s3)', backgroundColor: 'var(--bg-raised)', borderRadius: 'var(--r-ctl)', border: '1px solid var(--line-hair)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s1)' }}>
              <strong style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-hi)' }}>Policy A: No Action (Baseline)</strong>
              <span className="mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>Budget: 0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-cap)' }}>
              <span style={{ color: 'var(--ink-mid)' }}>Exposed Cases:</span>
              <span className="mono" style={{ color: 'var(--fail)', fontWeight: 600 }}>
                {policies.A.exposed_count} / {decomposition.total_cases}
              </span>
            </div>
          </div>

          {/* Policy B */}
          <div style={{ padding: 'var(--s3)', backgroundColor: 'var(--bg-raised)', borderRadius: 'var(--r-ctl)', border: '1px solid var(--line-hair)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s1)' }}>
              <strong style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-hi)' }}>Policy B: Static Heuristic</strong>
              <span className="mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>Degree Centrality</span>
            </div>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)', marginBottom: 'var(--s1)' }}>
              Action: {policies.B.chosen_action?.target_id || 'Static Depot Selection'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-cap)' }}>
              <span style={{ color: 'var(--ink-mid)' }}>Exposed Cases:</span>
              <span className="mono" style={{ color: policies.B.exposed_count > 0 ? 'var(--fail)' : 'var(--ok)', fontWeight: 600 }}>
                {policies.B.exposed_count} / {decomposition.total_cases}
              </span>
            </div>
          </div>

          {/* Policy C */}
          <div
            style={{
              padding: 'var(--s3)',
              backgroundColor: 'var(--accent-wash)',
              borderRadius: 'var(--r-ctl)',
              border: '1px solid var(--accent)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s1)' }}>
              <strong style={{ fontSize: 'var(--fs-cap)', color: 'var(--accent)' }}>Policy C: Pre-Mortem Conditional N-1</strong>
              <StatusBadge status="BRANCH" label="FalkorDB Branches" />
            </div>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-hi)', marginBottom: 'var(--s1)' }}>
              {policies.C.chosen_action ? policies.C.chosen_action.description : 'Evaluated all 13 second-failures'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-cap)' }}>
              <span style={{ color: 'var(--ink-mid)' }}>Residual Exposed Cases:</span>
              <span className="mono" style={{ color: policies.C.exposed_count > 0 ? 'var(--fail)' : 'var(--ok)', fontWeight: 700 }}>
                {policies.C.exposed_count} / {decomposition.total_cases}
              </span>
            </div>
          </div>
        </div>

        {/* Headline Denominator Note */}
        <div
          style={{
            marginTop: 'var(--s2)',
            padding: 'var(--s2)',
            backgroundColor: 'var(--bg-sunken)',
            borderRadius: 'var(--r-ctl)',
            fontSize: 'var(--fs-micro)',
            color: 'var(--ink-mid)',
            border: '1px solid var(--line-hair)'
          }}
        >
          <strong style={{ color: 'var(--accent)' }}>Headline Denominator: </strong>
          <span className="mono">{decomposition.headline_interaction_only_count}</span> interaction-only cases where neither corridor breaches alone.
        </div>
      </div>

      {/* 2. Recommendation or Abstention Card */}
      <div style={{ padding: 'var(--s4)', borderBottom: '1px solid var(--line-hair)' }}>
        <h2 style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', letterSpacing: '0.04em', marginBottom: 'var(--s2)' }}>
          Decision Output
        </h2>

        {isAbstained ? (
          <div
            style={{
              padding: 'var(--s3)',
              backgroundColor: 'var(--fail-wash)',
              border: '1px solid var(--fail)',
              borderRadius: 'var(--r-ctl)',
            }}
            role="status"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginBottom: 'var(--s1)' }}>
              <strong style={{ color: 'var(--fail)', fontSize: 'var(--fs-body)' }}>ABSTAIN — NO ROBUST PLAN</strong>
            </div>
            <p style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-hi)', lineHeight: 'var(--lh-data)', marginBottom: 'var(--s2)' }}>
              No single allowed action preserves all critical SLAs across every evaluated second failure. Jaal refuses to recommend a plan that leaves known breaches.
            </p>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>
              Uncovered second failures ({recommendation.exposed_count}):
              <div className="mono" style={{ marginTop: 'var(--s1)', color: 'var(--fail)' }}>
                {recommendation.exposed_cases.join(', ')}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 'var(--s3)',
              backgroundColor: 'var(--ok-wash)',
              border: '1px solid var(--ok)',
              borderRadius: 'var(--r-ctl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginBottom: 'var(--s1)' }}>
              <strong style={{ color: 'var(--ok)', fontSize: 'var(--fs-body)' }}>ROBUST RECOMMENDATION AVAILABLE</strong>
            </div>
            <p style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-hi)', lineHeight: 'var(--lh-data)', marginBottom: 'var(--s2)' }}>
              {recommendation.action?.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>
              <span>Action Cost: {recommendation.action?.cost} units</span>
              <span>Residual Breaches: 0 / 13</span>
            </div>
          </div>
        )}

        {/* Decision Banner if already decided */}
        {isDecided && (
          <div
            style={{
              marginTop: 'var(--s3)',
              padding: 'var(--s2) var(--s3)',
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--line-hair)',
              borderRadius: 'var(--r-ctl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s1)' }}>
              <StatusBadge
                status={decision?.verdict === 'APPROVE' ? 'OK' : 'BREACH'}
                label={`${decision?.verdict}D BY COMMANDER`}
              />
              <span className="mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>
                {decision?.recorded_at.slice(11, 19)} UTC
              </span>
            </div>
            <div style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)', fontStyle: 'italic' }}>
              "{decision?.rationale}"
            </div>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)', marginTop: 'var(--s1)' }}>
              Recorded by {decision?.actor} in jaal_memory.
            </div>
          </div>
        )}

        {/* Commander Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 'var(--s3)' }}>
          <button
            onClick={() => onOpenDecisionModal('APPROVE')}
            disabled={isAbstained || isDecided}
            style={{
              flex: 1,
              padding: 'var(--s2)',
              borderRadius: 'var(--r-ctl)',
              backgroundColor: isAbstained || isDecided ? 'var(--line-hair)' : 'var(--ok)',
              color: isAbstained || isDecided ? 'var(--ink-lo)' : 'var(--bg-void)',
              fontWeight: 700,
              border: 'none',
              cursor: isAbstained || isDecided ? 'not-allowed' : 'pointer',
              fontSize: 'var(--fs-cap)',
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
              padding: 'var(--s2)',
              borderRadius: 'var(--r-ctl)',
              backgroundColor: isDecided ? 'var(--line-hair)' : 'var(--bg-raised)',
              color: isDecided ? 'var(--ink-lo)' : 'var(--fail)',
              border: '1px solid var(--line-hair)',
              fontWeight: 700,
              cursor: isDecided ? 'not-allowed' : 'pointer',
              fontSize: 'var(--fs-cap)',
            }}
            id="reject-action-btn"
          >
            REJECT PLAN
          </button>
        </div>
      </div>

      {/* 3. Deep Drill-Through Evidence Link */}
      <div style={{ padding: 'var(--s4)' }}>
        <h2 style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', letterSpacing: '0.04em', marginBottom: 'var(--s2)' }}>
          Case Evidence & Verification
        </h2>
        <p style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)', lineHeight: 'var(--lh-data)', marginBottom: 'var(--s3)' }}>
          Inspect the exact branch mutation ledger, route node sequences, arc cost arithmetic, and alert hop chains.
        </p>
        <button
          onClick={() => onNavigateToEvidence(selectedCaseId)}
          disabled={!selectedCaseId}
          style={{
            width: '100%',
            padding: 'var(--s2)',
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--accent-edge)',
            color: 'var(--accent)',
            borderRadius: 'var(--r-ctl)',
            fontSize: 'var(--fs-cap)',
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
