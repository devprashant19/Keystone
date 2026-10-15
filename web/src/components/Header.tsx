import React from 'react';

interface HeaderProps {
  worldDigest: string;
  configHash: string;
  isDbHealthy: boolean;
  onOpenHistory: () => void;
  onNavigate: (route: string) => void;
  currentRoute: string;
}

export const Header: React.FC<HeaderProps> = ({
  worldDigest,
  configHash,
  isDbHealthy,
  onOpenHistory,
  onNavigate,
  currentRoute,
}) => {
  return (
    <header
      style={{
        height: '48px',
        backgroundColor: 'var(--panel)',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        userSelect: 'none',
      }}
      role="banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => onNavigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          aria-label="Jaal Pre-Mortem Home"
        >
          <span style={{ color: 'var(--accent)' }}>JAAL</span> PRE-MORTEM
          <span
            style={{
              fontSize: '11px',
              fontWeight: 400,
              color: 'var(--text-3)',
              borderLeft: '1px solid var(--line)',
              paddingLeft: '8px',
            }}
          >
            Delhi Arterial · District Scale
          </span>
        </button>

        <span
          className="badge badge-synthetic"
          title="Contains both real-world OSM Delhi roads and synthetic power/alert layers"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('/method')}
        >
          REFERENCE + SYNTHETIC ▸
        </span>
      </div>

      {/* Center meta badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          color: 'var(--text-2)',
        }}
        className="mono"
      >
        <span>
          CONFIG: <strong style={{ color: 'var(--text)' }}>{configHash ? configHash.slice(0, 8) : '—'}</strong>
        </span>
        <span style={{ color: 'var(--line)' }}>•</span>
        <span>
          DIGEST: <strong style={{ color: 'var(--text)' }}>{worldDigest ? worldDigest.slice(0, 8) : '—'}</strong>
        </span>
        <span style={{ color: 'var(--line)' }}>•</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isDbHealthy ? 'var(--ok)' : 'var(--fail)',
              display: 'inline-block',
            }}
            title={isDbHealthy ? 'FalkorDB 6.0.2 Live' : 'FalkorDB Unavailable'}
          />
          FalkorDB 6.0.2
        </span>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenHistory}
          style={{
            background: 'var(--panel-2)',
            border: '1px solid var(--line)',
            color: 'var(--text-2)',
            padding: '4px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
          title="Past Run History"
        >
          Run History
        </button>

        <button
          onClick={() => onNavigate(currentRoute === '/method' ? '/' : '/method')}
          style={{
            background: currentRoute === '/method' ? 'var(--accent)' : 'var(--panel-2)',
            border: '1px solid var(--line)',
            color: currentRoute === '/method' ? '#000' : 'var(--text)',
            padding: '4px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {currentRoute === '/method' ? 'Back to Deck' : 'Methodology'}
        </button>
      </div>
    </header>
  );
};
