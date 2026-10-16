import React from 'react';
import { StatusBadge } from './primitives';

interface HeaderProps {
  worldDigest: string;
  configHash: string;
  isDbHealthy: boolean;
  onOpenHistory: () => void;
  onNavigate: (route: string) => void;
  currentRoute: string;
  onOpenShortcuts?: () => void;
  onStartTour?: () => void;
  isTourActive?: boolean;
  onToggleAgent?: () => void;
  isAgentOpen?: boolean;
}

type ThemeMode = 'light' | 'dark' | 'system';

function getStoredTheme(): ThemeMode {
  try {
    const val = localStorage.getItem('keystone-theme');
    if (val === 'light' || val === 'dark' || val === 'system') return val;
  } catch (_) {}
  return 'light';
}

export const Header: React.FC<HeaderProps> = ({
  worldDigest,
  configHash,
  isDbHealthy,
  onOpenHistory,
  onNavigate,
  currentRoute,
  onOpenShortcuts,
  onStartTour,
  isTourActive,
  onToggleAgent,
  isAgentOpen,
}) => {
  const [theme, setTheme] = React.useState<ThemeMode>(getStoredTheme);

  React.useEffect(() => {
    try {
      localStorage.setItem('keystone-theme', theme);
    } catch (_) {}
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const [reducedMotion, setReducedMotion] = React.useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.getAttribute('data-reduced-motion') === 'true';
  });
  const [copiedTarget, setCopiedTarget] = React.useState<'config' | 'digest' | null>(null);

  const toggleMotion = () => {
    const nextVal = !reducedMotion;
    setReducedMotion(nextVal);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-reduced-motion', nextVal ? 'true' : 'false');
    }
  };

  return (
    <header
      style={{
        height: 'var(--h-header)',
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--line-hair)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--s4)',
        userSelect: 'none',
        boxShadow: 'var(--elevation-sticky)',
      }}
      role="banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
        <button
          onClick={() => onNavigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-hi)',
            fontSize: 'var(--fs-ui)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s2)',
          }}
          aria-label="Jaal Pre-Mortem Home"
        >
          <span style={{ color: 'var(--accent)' }}>JAAL</span> PRE-MORTEM
          <span
            style={{
              fontSize: 'var(--fs-micro)',
              fontWeight: 400,
              color: 'var(--ink-lo)',
              borderLeft: '1px solid var(--line-hair)',
              paddingLeft: 'var(--s2)',
            }}
          >
            Delhi Arterial · District Scale
          </span>
        </button>

        <span
          id="provenance-badge"
          title="Contains both real-world OSM Delhi roads and synthetic power/alert layers"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('/method')}
        >
          <StatusBadge status="SYNTHETIC" label="REFERENCE + SYNTHETIC ▸" />
        </span>
      </div>

      {/* Center meta badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s3)',
          fontSize: 'var(--fs-micro)',
          color: 'var(--ink-mid)',
        }}
        className="mono"
      >
        <button
          id="copy-config-btn"
          onClick={() => {
            if (configHash) {
              try { navigator?.clipboard?.writeText(configHash); } catch (_) {}
              setCopiedTarget('config');
              setTimeout(() => setCopiedTarget(null), 1200);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            font: 'inherit',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s1)',
          }}
          title="Click to copy full Config SHA-256"
        >
          <span>CONFIG: <strong style={{ color: 'var(--ink-hi)' }}>{configHash ? configHash.slice(0, 8) : '—'}</strong></span>
          {copiedTarget === 'config' && (
            <span style={{ backgroundColor: 'var(--ok)', color: 'var(--bg-void)', padding: '1px 4px', borderRadius: 'var(--r-chip)', fontSize: 'var(--fs-micro)', fontWeight: 700 }}>
              COPIED
            </span>
          )}
        </button>
        <span style={{ color: 'var(--line-hair)' }}>•</span>
        <button
          id="copy-digest-btn"
          onClick={() => {
            if (worldDigest) {
              try { navigator?.clipboard?.writeText(worldDigest); } catch (_) {}
              setCopiedTarget('digest');
              setTimeout(() => setCopiedTarget(null), 1200);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            font: 'inherit',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s1)',
          }}
          title="Click to copy full World Content Digest"
        >
          <span>DIGEST: <strong style={{ color: 'var(--ink-hi)' }}>{worldDigest ? worldDigest.slice(0, 8) : '—'}</strong></span>
          {copiedTarget === 'digest' && (
            <span style={{ backgroundColor: 'var(--ok)', color: 'var(--bg-void)', padding: '1px 4px', borderRadius: 'var(--r-chip)', fontSize: 'var(--fs-micro)', fontWeight: 700 }}>
              COPIED
            </span>
          )}
        </button>
        <span style={{ color: 'var(--line-hair)' }}>•</span>
        <button
          id="health-dot"
          onClick={() => onNavigate('/method')}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            font: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s1)',
            padding: 0,
          }}
          title={isDbHealthy ? 'FalkorDB 6.0.2 Live — Click for Methodology' : 'FalkorDB Unavailable'}
        >
          <span
            className={`health-dot ${isDbHealthy ? 'alive' : 'down'}`}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isDbHealthy ? 'var(--ok)' : 'var(--fail)',
              display: 'inline-block',
            }}
          />
          FalkorDB 6.0.2
        </button>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
        <button
          id="theme-toggle"
          onClick={cycleTheme}
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--line-hair)',
            color: 'var(--ink-hi)',
            padding: 'var(--s1) var(--s2)',
            borderRadius: 'var(--r-ctl)',
            cursor: 'pointer',
            fontSize: 'var(--fs-micro)',
            fontWeight: 700,
            letterSpacing: '0.03em',
          }}
          title={`Current Theme: ${theme.toUpperCase()} (Click to toggle Light / Dark / System)`}
          aria-label={`Theme: ${theme.toUpperCase()}`}
        >
          {theme === 'light' ? '☀ LIGHT' : theme === 'dark' ? '☾ DARK' : '⚙ SYSTEM'}
        </button>

        <button
          id="reduced-motion-toggle"
          onClick={toggleMotion}
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--line-hair)',
            color: reducedMotion ? 'var(--accent)' : 'var(--ink-lo)',
            padding: 'var(--s1) var(--s2)',
            borderRadius: 'var(--r-ctl)',
            cursor: 'pointer',
            fontSize: 'var(--fs-micro)',
            fontWeight: 600,
          }}
          title="Toggle Reduced Motion"
          aria-label="Toggle Reduced Motion"
        >
          {reducedMotion ? '⊘ MOTION' : '◎ MOTION'}
        </button>

        {onStartTour && (
          <button
            id="start-tour-btn"
            onClick={onStartTour}
            style={{
              background: isTourActive ? 'var(--accent)' : 'var(--bg-raised)',
              border: '1px solid var(--accent)',
              color: isTourActive ? 'var(--bg-void)' : 'var(--accent)',
              padding: 'var(--s1) var(--s3)',
              borderRadius: 'var(--r-ctl)',
              cursor: 'pointer',
              fontSize: 'var(--fs-cap)',
              fontWeight: 700,
            }}
            title="Guided Tour Walkthrough (?tour=1)"
          >
            Guided tour
          </button>
        )}

        {onToggleAgent && (
          <button
            id="toggle-agent-panel"
            onClick={onToggleAgent}
            style={{
              background: isAgentOpen ? 'var(--branch)' : 'var(--bg-raised)',
              border: '1px solid var(--branch)',
              color: isAgentOpen ? 'var(--bg-void)' : 'var(--branch)',
              padding: 'var(--s1) var(--s3)',
              borderRadius: 'var(--r-ctl)',
              cursor: 'pointer',
              fontSize: 'var(--fs-cap)',
              fontWeight: 700,
            }}
            title="Track 01 Copilot Agent (Grounded Narration over Deterministic Tools)"
            aria-label="Toggle Agent Panel"
          >
            ⚡ Copilot
          </button>
        )}

        <button
          id="open-history-btn"
          onClick={onOpenHistory}
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--line-hair)',
            color: 'var(--ink-mid)',
            padding: 'var(--s1) var(--s3)',
            borderRadius: 'var(--r-ctl)',
            cursor: 'pointer',
            fontSize: 'var(--fs-cap)',
          }}
          title="Past Run History"
        >
          Run History
        </button>

        {onOpenShortcuts && (
          <button
            id="shortcuts-help-btn"
            onClick={onOpenShortcuts}
            style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--line-hair)',
              color: 'var(--ink-lo)',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--r-ctl)',
              cursor: 'pointer',
              fontSize: 'var(--fs-cap)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard Shortcuts"
          >
            ?
          </button>
        )}

        <button
          onClick={() => onNavigate(currentRoute === '/method' ? '/' : '/method')}
          style={{
            background: currentRoute === '/method' ? 'var(--accent)' : 'var(--bg-raised)',
            border: '1px solid var(--line-hair)',
            color: currentRoute === '/method' ? 'var(--bg-void)' : 'var(--ink-hi)',
            padding: 'var(--s1) var(--s3)',
            borderRadius: 'var(--r-ctl)',
            cursor: 'pointer',
            fontSize: 'var(--fs-cap)',
            fontWeight: 600,
          }}
        >
          {currentRoute === '/method' ? 'Back to Deck' : 'Methodology'}
        </button>
      </div>
    </header>
  );
};
