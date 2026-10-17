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
  source?: 'precomputed' | 'live';
  digest?: string;
  world_content_digest?: string;
  elapsed_ms?: number;
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
  runData: (RunData & { isStale?: boolean; isReadOnly?: boolean }) | null;
  selectedCaseId: string;
  onOpenDecisionModal: (verdict: 'APPROVE' | 'REJECT') => void;
  onNavigateToEvidence: (caseId: string) => void;
  onRecomputeLive?: () => void;
  isStale?: boolean;
  isReadOnly?: boolean;
}

export const RightRail: React.FC<RightRailProps> = ({
  runData,
  selectedCaseId,
  onOpenDecisionModal,
  onNavigateToEvidence,
  onRecomputeLive,
  isStale: propIsStale,
  isReadOnly: propIsReadOnly,
}) => {
  const [expandedPolicy, setExpandedPolicy] = React.useState<'A' | 'B' | 'C' | null>(null);
  const [copiedCaseId, setCopiedCaseId] = React.useState<string | null>(null);

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
          Select an observed corridor failure to begin.
        </p>
      </aside>
    );
  }

  const { policies, decomposition, recommendation, decision } = runData;
  const isAbstained = recommendation.abstain;
  const isDecided = Boolean(decision);
  const isStale = Boolean(propIsStale || runData.isStale);
  const isReadOnly = Boolean(propIsReadOnly || runData.isReadOnly);

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
        overflow: 'hidden',
      }}
      role="region"
      aria-label="Policy Comparison and Recommendation"
    >
      <div
        tabIndex={0}
        role="region"
        aria-label="Policy list and decision details"
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
      {/* Stale World Notice */}
      {isStale && (
        <div
          id="stale-world-banner"
          style={{
            margin: 'var(--s3) var(--s4) 0',
            padding: 'var(--s2) var(--s3)',
            backgroundColor: 'var(--warn-wash)',
            color: 'var(--warn)',
            border: '1px solid var(--warn)',
            borderRadius: 'var(--r-ctl)',
            fontSize: 'var(--fs-micro)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s2)',
          }}
        >
          <span>⚠</span>
          <span>world reloaded — results stale (approval disabled)</span>
        </div>
      )}

      {/* Read-Only History Notice */}
      {isReadOnly && (
        <div
          id="history-readonly-banner"
          style={{
            margin: 'var(--s3) var(--s4) 0',
            padding: 'var(--s2) var(--s3)',
            backgroundColor: 'var(--bg-sunken)',
            color: 'var(--ink-mid)',
            border: '1px solid var(--line-hair)',
            borderRadius: 'var(--r-ctl)',
            fontSize: 'var(--fs-micro)',
            fontWeight: 600,
          }}
        >
          PAST RUN LOADED (READ ONLY) — DECISION LOCKED
        </div>
      )}

      {/* 1. Policy Comparison Section */}
      <div style={{ padding: 'var(--s4)', borderBottom: '1px solid var(--line-hair)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s3)', flexWrap: 'wrap', gap: 'var(--s2)' }}>
          <h2 style={{ fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--ink-lo)', letterSpacing: '0.04em', margin: 0 }}>
            Policy Comparison (182-Case Foundation)
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            <a
              id="scenario-provenance-chip"
              href="/method"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToEvidence('method');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--s1)',
                padding: '2px 8px',
                borderRadius: 'var(--r-chip)',
                fontSize: 'var(--fs-micro)',
                fontFamily: 'var(--font-mono)',
                textDecoration: 'none',
                border: '1px solid var(--line-hair)',
                backgroundColor: 'var(--bg-sunken)',
                color: 'var(--ink-hi)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="Provenance: link to /method methodology and frozen threshold"
            >
              <span style={{ color: runData.source === 'live' ? 'var(--warn)' : 'var(--accent)' }}>●</span>
              <span>
                {runData.source === 'live'
                  ? `live (${runData.elapsed_ms || 0}ms) · digest ${(runData.world_content_digest || runData.digest || '455712e8').slice(0, 8)}`
                  : `precomputed · digest ${(runData.world_content_digest || runData.digest || '455712e8').slice(0, 8)}`}
              </span>
            </a>
            {onRecomputeLive && (
              <button
                id="recompute-live-btn-right"
                onClick={onRecomputeLive}
                style={{
                  padding: '2px 8px',
                  fontSize: 'var(--fs-micro)',
                  borderRadius: 'var(--r-ctl)',
                  border: '1px solid var(--line-hair)',
                  backgroundColor: 'var(--bg-raised)',
                  color: 'var(--ink-hi)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title="Recompute this scenario live against FalkorDB"
              >
                Recompute live
              </button>
            )}
          </div>
        </div>

        {/* Dignified Null-Result / Main-Path Panel */}
        {decomposition.headline_interaction_only_count === 0 && (
          <div
            id="null-result-panel"
            style={{
              padding: 'var(--s3)',
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--line-hair)',
              borderRadius: 'var(--r-ctl)',
              marginBottom: 'var(--s3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginBottom: 'var(--s2)' }}>
              <span style={{ color: 'var(--accent)', fontSize: 'var(--fs-ui)' }}>◈</span>
              <strong style={{ color: 'var(--ink-hi)', fontSize: 'var(--fs-cap)', letterSpacing: '0.02em' }}>
                EMPIRICAL FINDING: NULL INTERACTION
              </strong>
            </div>
            <p style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)', lineHeight: 'var(--lh-data)', marginBottom: 'var(--s2)' }}>
              No two-failure interaction cases at this threshold. All 182 cases are explained by single-failure dynamics and baseline structure (104 f1-alone, 48 f2-alone, 30 unstressed).
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>
                Frozen SLA: 6.8 km
              </span>
              <button
                id="null-sweep-link"
                onClick={() => onNavigateToEvidence('method')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 'var(--fs-micro)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Inspect 8.0km sweep on /method →
              </button>
            </div>
          </div>
        )}

        {/* Policy Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
          {/* Policy A */}
          <div
            id="policy-row-A"
            className="policy-row"
            onClick={() => setExpandedPolicy(expandedPolicy === 'A' ? null : 'A')}
            style={{
              padding: 'var(--s3)',
              backgroundColor: 'var(--bg-raised)',
              borderRadius: 'var(--r-ctl)',
              border: '1px solid',
              borderColor: expandedPolicy === 'A' ? 'var(--accent)' : 'var(--line-hair)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s1)' }}>
              <strong style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-hi)' }}>Policy A: No Action (Baseline)</strong>
              <span className="mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>Budget: 0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-cap)' }}>
              <span style={{ color: 'var(--ink-mid)' }}>Exposed Cases:</span>
              <span className="mono" style={{ color: 'var(--fail)', fontWeight: 600 }}>
                {policies.A.exposed_count} / {decomposition.total_cases}
              </span>
            </div>
            {expandedPolicy === 'A' && (
              <div style={{ marginTop: 'var(--s2)', paddingTop: 'var(--s2)', borderTop: '1px solid var(--line-hair)', fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>
                <div>Total breaches across all scenarios: {policies.A.total_breaches}</div>
                <div style={{ marginTop: 'var(--s1)' }}>
                  <button
                    id="metric-drill-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToEvidence(selectedCaseId || 'road_ring_monastery_chandgiram__road_ring_kashmere_monastery');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Drill to Case Evidence ▸
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Policy B */}
          <div
            id="policy-row-B"
            className="policy-row"
            onClick={() => setExpandedPolicy(expandedPolicy === 'B' ? null : 'B')}
            style={{
              padding: 'var(--s3)',
              backgroundColor: 'var(--bg-raised)',
              borderRadius: 'var(--r-ctl)',
              border: '1px solid',
              borderColor: expandedPolicy === 'B' ? 'var(--accent)' : 'var(--line-hair)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s1)' }}>
              <strong style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-hi)' }}>Policy B: Static Heuristic</strong>
              <span className="mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>Degree Centrality</span>
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
            {expandedPolicy === 'B' && (
              <div style={{ marginTop: 'var(--s2)', paddingTop: 'var(--s2)', borderTop: '1px solid var(--line-hair)', fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>
                <div>Total breaches: {policies.B.total_breaches} | Cost: {policies.B.cost}</div>
                <div style={{ marginTop: 'var(--s1)' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToEvidence(selectedCaseId || 'road_ring_monastery_chandgiram__road_ring_kashmere_monastery');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Drill to Case Evidence ▸
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Policy C */}
          <div
            id="policy-row-C"
            className="policy-row"
            onClick={() => setExpandedPolicy(expandedPolicy === 'C' ? null : 'C')}
            style={{
              padding: 'var(--s3)',
              backgroundColor: 'var(--bg-raised)',
              borderRadius: 'var(--r-ctl)',
              border: '1px solid var(--accent)',
              cursor: 'pointer',
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
            {expandedPolicy === 'C' && (
              <div style={{ marginTop: 'var(--s2)', paddingTop: 'var(--s2)', borderTop: '1px solid var(--line-hair)', fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>
                <div>Objective: Lexicographic (Robust Feasibility &gt; Total Breaches &gt; Cost)</div>
                <div style={{ marginTop: 'var(--s1)' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToEvidence(selectedCaseId || 'road_ring_monastery_chandgiram__road_ring_kashmere_monastery');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Drill to Case Evidence ▸
                  </button>
                </div>
              </div>
            )}
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
            border: '1px solid var(--line-hair)',
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
            {recommendation.reason && (
              <div style={{ marginBottom: 'var(--s2)' }}>
                <span
                  id="abstention-reason-code"
                  className="mono"
                  style={{
                    fontSize: 'var(--fs-micro)',
                    color: 'var(--fail)',
                    backgroundColor: 'var(--bg-sunken)',
                    padding: '2px 6px',
                    borderRadius: 'var(--r-chip)',
                    border: '1px solid var(--line-hair)',
                  }}
                >
                  {recommendation.reason}
                </span>
              </div>
            )}
            <p
              id="abstention-body-text"
              style={{
                fontSize: 'var(--fs-cap)',
                color: 'var(--ink-hi)',
                lineHeight: 'var(--lh-data)',
                marginBottom: 'var(--s2)',
                wordBreak: 'normal',
                whiteSpace: 'normal',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
              }}
            >
              No single allowed action preserves all critical SLAs across every evaluated second failure. KEYSTONE refuses to recommend a plan that leaves known breaches.
            </p>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mid)' }}>
              Uncovered second failures ({recommendation.exposed_count}):
              <div
                id="abstention-exposed-cases"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginTop: 'var(--s1)',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                }}
              >
                {recommendation.exposed_cases.map((caseId: string) => (
                  <div
                    key={caseId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-sunken)',
                      padding: '2px 6px',
                      borderRadius: 'var(--r-chip)',
                      border: '1px solid var(--line-hair)',
                      gap: '4px',
                    }}
                  >
                    <span
                      className="mono"
                      title={caseId}
                      style={{
                        color: 'var(--fail)',
                        fontSize: 'var(--fs-micro)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {caseId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        try { navigator?.clipboard?.writeText(caseId); } catch (_) {}
                        setCopiedCaseId(caseId);
                        setTimeout(() => setCopiedCaseId(null), 1200);
                      }}
                      title={`Copy ${caseId}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedCaseId === caseId ? 'var(--ok)' : 'var(--accent)',
                        fontSize: 'var(--fs-micro)',
                        cursor: 'pointer',
                        padding: '1px 4px',
                        fontWeight: copiedCaseId === caseId ? 700 : 500,
                      }}
                    >
                      {copiedCaseId === caseId ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                ))}
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
                label={`${decision?.verdict === 'APPROVE' ? 'APPROVED' : 'REJECTED'} BY COMMANDER`}
              />
              <span className="mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>
                {decision?.recorded_at.slice(11, 19)} UTC
              </span>
            </div>
            <div style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)', fontStyle: 'italic' }}>
              "{decision?.rationale}"
            </div>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)', marginTop: 'var(--s1)' }}>
              Recorded by {decision?.actor} in keystone_memory.
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Pinned Decision and Evidence Block (Guaranteed visible at 1440x900 and 1280x800) */}
      <div
        id="decision-action-block"
        style={{
          borderTop: '1px solid var(--line-hair)',
          backgroundColor: 'var(--bg-panel)',
          padding: 'var(--s3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--s2)',
          zIndex: 5,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--s2)' }}>
          <button
            onClick={() => onOpenDecisionModal('APPROVE')}
            disabled={isAbstained || isDecided || isStale || isReadOnly}
            style={{
              flex: 1,
              padding: 'var(--s2)',
              borderRadius: 'var(--r-ctl)',
              backgroundColor: isAbstained || isDecided || isStale || isReadOnly ? 'var(--line-hair)' : 'var(--ok)',
              color: isAbstained || isDecided || isStale || isReadOnly ? 'var(--ink-lo)' : 'var(--bg-void)',
              fontWeight: 700,
              border: 'none',
              cursor: isAbstained || isDecided || isStale || isReadOnly ? 'not-allowed' : 'pointer',
              fontSize: 'var(--fs-cap)',
            }}
            id="approve-action-btn"
          >
            APPROVE PLAN
          </button>
          <button
            onClick={() => onOpenDecisionModal('REJECT')}
            disabled={isDecided || isReadOnly}
            style={{
              flex: 1,
              padding: 'var(--s2)',
              borderRadius: 'var(--r-ctl)',
              backgroundColor: isDecided || isReadOnly ? 'var(--line-hair)' : 'var(--bg-raised)',
              color: isDecided || isReadOnly ? 'var(--ink-lo)' : 'var(--fail)',
              border: '1px solid var(--line-hair)',
              fontWeight: 700,
              cursor: isDecided || isReadOnly ? 'not-allowed' : 'pointer',
              fontSize: 'var(--fs-cap)',
            }}
            id="reject-action-btn"
          >
            REJECT PLAN
          </button>
        </div>

        <button
          id="open-evidence-btn"
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
