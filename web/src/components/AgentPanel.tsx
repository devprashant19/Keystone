import React, { useState } from 'react';

export interface ToolCallTrace {
  tool: string;
  arguments: Record<string, any>;
  entities_returned: string[];
  metrics_returned: Record<string, any>;
}

export interface AgentResponseData {
  prompt: string;
  answer: string;
  tool_trace: ToolCallTrace[];
  grounded: boolean;
  citations: string[];
  abstain?: boolean;
  abstain_reason?: string | null;
}

interface AgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState<string>('What fails if monastery_chandgiram floods?');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<AgentResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async (customQuery?: string) => {
    const q = (customQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      });

      if (!res.ok) {
        throw new Error(`Agent query failed with HTTP ${res.status}`);
      }

      const data: AgentResponseData = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to communicate with agent');
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'What fails if monastery_chandgiram floods?',
    'Inspect causal chain for monastery_chandgiram and kashmere_monastery',
    'Show corridor inventory',
    'Check system health and database status',
  ];

  return (
    <section
      id="agent-panel"
      aria-label="Incident Copilot Agent Panel"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '380px',
        backgroundColor: 'var(--bg-panel)',
        borderTop: '1px solid var(--line-hair)',
        boxShadow: 'var(--elevation-sticky)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--s2) var(--s4)',
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--line-hair)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
          <span style={{ fontSize: '1.1rem' }}>⚡</span>
          <h2
            style={{
              margin: 0,
              fontSize: 'var(--fs-ui)',
              fontWeight: 700,
              color: 'var(--ink-hi)',
              letterSpacing: '0.03em',
            }}
          >
            Incident Copilot
          </h2>
          <span
            style={{
              fontSize: 'var(--fs-micro)',
              padding: '2px 8px',
              borderRadius: 'var(--r-badge)',
              backgroundColor: 'var(--branch-wash)',
              color: 'var(--branch)',
              fontWeight: 600,
              border: '1px solid var(--branch)',
            }}
          >
            Track 01 Agent — Grounded Narration over Deterministic Graph Tools
          </span>
        </div>

        <button
          id="close-agent-btn"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-mid)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1,
          }}
          aria-label="Close Agent Panel"
        >
          ✕
        </button>
      </div>

      {/* 2. Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--s3) var(--s4)',
          overflowY: 'auto',
          gap: 'var(--s3)',
        }}
      >
        {/* Sample queries pills */}
        <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)', fontWeight: 600 }}>
            SAMPLE PROMPTS:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              className="agent-sample-btn"
              onClick={() => {
                setQuery(p);
                handleSend(p);
              }}
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--line-hair)',
                color: 'var(--ink-mid)',
                padding: '2px 8px',
                borderRadius: 'var(--r-ctl)',
                fontSize: 'var(--fs-micro)',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: 'var(--s2)' }}>
          <input
            id="agent-query-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ask about network contingency, causal chain, or system health..."
            style={{
              flex: 1,
              backgroundColor: 'var(--bg-void)',
              border: '1px solid var(--line-hair)',
              color: 'var(--ink-hi)',
              padding: 'var(--s2) var(--s3)',
              borderRadius: 'var(--r-ctl)',
              fontSize: 'var(--fs-ui)',
            }}
          />
          <button
            id="agent-submit-btn"
            onClick={() => handleSend()}
            disabled={loading}
            style={{
              backgroundColor: 'var(--branch)',
              color: 'var(--bg-void)',
              border: 'none',
              padding: 'var(--s2) var(--s4)',
              borderRadius: 'var(--r-ctl)',
              fontWeight: 700,
              fontSize: 'var(--fs-ui)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Evaluating Tools...' : 'Ask Agent'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            id="agent-error-banner"
            style={{
              backgroundColor: 'var(--fail-wash)',
              border: '1px solid var(--fail)',
              color: 'var(--fail)',
              padding: 'var(--s2)',
              borderRadius: 'var(--r-ctl)',
              fontSize: 'var(--fs-cap)',
            }}
          >
            {error}
          </div>
        )}

        {/* Results display */}
        {response && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--s3)',
              backgroundColor: 'var(--bg-void)',
              border: '1px solid var(--line-hair)',
              borderRadius: 'var(--r-card)',
              padding: 'var(--s3)',
            }}
          >
            {/* Tool Trace and Grounding status header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--line-hair)',
                paddingBottom: 'var(--s2)',
              }}
            >
              <div id="agent-tool-trace" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
                <span style={{ fontSize: 'var(--fs-cap)', fontWeight: 700, color: 'var(--ink-mid)' }}>
                  TOOL SELECTION TRACE:
                </span>
                {response.tool_trace.map((t, idx) => (
                  <span
                    key={idx}
                    className="agent-tool-chip"
                    style={{
                      backgroundColor: 'var(--bg-raised)',
                      border: '1px solid var(--line-focus)',
                      color: 'var(--accent)',
                      padding: '1px 6px',
                      borderRadius: 'var(--r-badge)',
                      fontSize: 'var(--fs-micro)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {t.tool}({Object.entries(t.arguments).map(([k, v]) => `${k}=${v}`).join(', ')})
                  </span>
                ))}
              </div>

              <span
                id="agent-grounded-badge"
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--r-badge)',
                  fontSize: 'var(--fs-micro)',
                  fontWeight: 700,
                  backgroundColor: response.grounded ? 'var(--ok-wash)' : 'var(--fail-wash)',
                  color: response.grounded ? 'var(--ok)' : 'var(--fail)',
                  border: `1px solid ${response.grounded ? 'var(--ok)' : 'var(--fail)'}`,
                }}
              >
                {response.grounded ? 'GROUNDED (DETERMINISTIC)' : 'NARRATION UNAVAILABLE'}
              </span>
            </div>

            {/* Answer body */}
            <div>
              <p
                id="agent-answer-text"
                style={{
                  margin: 0,
                  fontSize: 'var(--fs-ui)',
                  lineHeight: '1.45',
                  color: 'var(--ink-hi)',
                }}
              >
                {response.answer}
              </p>
            </div>

            {/* Citations pill list */}
            {response.citations && response.citations.length > 0 && (
              <div
                id="agent-citations"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--s2)',
                  flexWrap: 'wrap',
                  paddingTop: 'var(--s1)',
                }}
              >
                <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)', fontWeight: 600 }}>
                  CITATIONS & IDENTIFIERS:
                </span>
                {response.citations.map((c, idx) => (
                  <span
                    key={idx}
                    className="agent-citation-chip"
                    style={{
                      backgroundColor: 'var(--bg-raised)',
                      border: '1px solid var(--line-hair)',
                      color: 'var(--ink-mid)',
                      padding: '1px 6px',
                      borderRadius: 'var(--r-badge)',
                      fontSize: 'var(--fs-micro)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
