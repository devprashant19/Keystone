import React from 'react';
import { StatusBadge } from './primitives';

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
        height: 'var(--h-header)',
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--line-hair)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--s4)',
        userSelect: 'none',
        boxShadow: 'var(--elevation-sticky)'
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
        <span>
          CONFIG: <strong style={{ color: 'var(--ink-hi)' }}>{configHash ? configHash.slice(0, 8) : '—'}</strong>
        </span>
        <span style={{ color: 'var(--line-hair)' }}>•</span>
        <span>
          DIGEST: <strong style={{ color: 'var(--ink-hi)' }}>{worldDigest ? worldDigest.slice(0, 8) : '—'}</strong>
        </span>
        <span style={{ color: 'var(--line-hair)' }}>•</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--s1)' }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
        <button
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
