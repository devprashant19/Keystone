import React, { useState, useEffect, useRef } from 'react';
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
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('keystone-theme', theme);
    } catch (_) {}
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Auto-close menu and dropdown on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [currentRoute]);

  // Close menu and dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (headerRef.current && !headerRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.getAttribute('data-reduced-motion') === 'true';
  });
  const [copiedTarget, setCopiedTarget] = useState<'config' | 'digest' | null>(null);

  const toggleMotion = () => {
    const nextVal = !reducedMotion;
    setReducedMotion(nextVal);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-reduced-motion', nextVal ? 'true' : 'false');
    }
  };

  return (
    <header
      ref={headerRef}
      style={{
        height: 'var(--h-header, 64px)',
        minHeight: 'var(--h-header, 64px)',
        backgroundColor: 'var(--bg-header)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--line-hair)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(18px, 3.2vw, 36px)',
        userSelect: 'none',
        boxShadow: 'var(--elevation-sticky)',
        gap: '16px',
        zIndex: 50,
        position: 'sticky',
        top: 0,
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: 'border-box',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
      role="banner"
    >
      {/* 1. Left: Brand Lockup & Context Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <button
          onClick={() => onNavigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-hi)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: 0,
            textDecoration: 'none',
          }}
          aria-label="KEYSTONE Pre-Mortem Home"
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #0891b2 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              boxShadow: '0 3px 10px rgba(2, 132, 199, 0.35)',
              flexShrink: 0,
            }}
          >
            K
          </span>
          <span
            style={{
              color: 'var(--ink-hi)',
              fontWeight: 800,
              fontSize: '17px',
              letterSpacing: '0.04em',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            KEYSTONE
          </span>
        </button>

        <span
          className="hdr-brand-context"
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--ink-mid)',
            backgroundColor: 'var(--bg-sunken)',
            padding: '3px 10px',
            borderRadius: '999px',
            border: '1px solid var(--line-hair)',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Delhi Arterial
        </span>

        <span
          id="provenance-badge"
          className="hdr-brand-context"
          title="Contains both real-world OSM Delhi roads and synthetic power/alert layers"
          style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
          onClick={() => onNavigate('/method')}
        >
          <StatusBadge status="SYNTHETIC" label="REFERENCE + SYNTHETIC ▸" />
        </span>
      </div>

      {/* 2. Center: Segmented Navigation Pill (Desktop only) */}
      <nav
        className="hdr-desktop-nav"
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-sunken)',
          border: '1px solid var(--line-hair)',
          borderRadius: '999px',
          padding: '4px',
          gap: '4px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
        }}
        aria-label="Deck and Landing Navigation"
      >
        <button
          id="nav-landing-btn"
          onClick={() => onNavigate('/')}
          style={{
            background: currentRoute === '/' ? 'var(--bg-panel)' : 'transparent',
            border: currentRoute === '/' ? '1px solid var(--line-hair)' : '1px solid transparent',
            padding: '6px 18px',
            fontSize: '13px',
            fontWeight: currentRoute === '/' ? 700 : 500,
            color: currentRoute === '/' ? 'var(--accent)' : 'var(--ink-mid)',
            cursor: 'pointer',
            borderRadius: '999px',
            boxShadow: currentRoute === '/' ? 'var(--sh-1)' : 'none',
            fontFamily: "'Poppins', sans-serif",
            transition: 'all var(--dur-state) var(--ease-out)',
          }}
          title="KEYSTONE Landing Page"
        >
          Landing
        </button>
        <button
          id="nav-deck-btn"
          onClick={() => onNavigate('/deck')}
          style={{
            background: currentRoute === '/deck' ? 'var(--bg-panel)' : 'transparent',
            border: currentRoute === '/deck' ? '1px solid var(--line-hair)' : '1px solid transparent',
            padding: '6px 18px',
            fontSize: '13px',
            fontWeight: currentRoute === '/deck' ? 700 : 500,
            color: currentRoute === '/deck' ? 'var(--accent)' : 'var(--ink-mid)',
            cursor: 'pointer',
            borderRadius: '999px',
            boxShadow: currentRoute === '/deck' ? 'var(--sh-1)' : 'none',
            fontFamily: "'Poppins', sans-serif",
            transition: 'all var(--dur-state) var(--ease-out)',
          }}
          title="Incident Command Deck"
        >
          Command Deck
        </button>
      </nav>

      {/* 3. Right: Desktop Tools & Dropdown (Visible on >= 960px) */}
      <div className="hdr-desktop-tools" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Compact Cryptographic Telemetry Capsule */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-sunken)',
            border: '1px solid var(--line-hair)',
            borderRadius: '999px',
            padding: '5px 12px',
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
          }}
        >
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
              gap: '6px',
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
                boxShadow: isDbHealthy ? '0 0 8px rgba(74, 222, 128, 0.6)' : 'none',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--ink-hi)' }}>FalkorDB</span>
          </button>

          <span style={{ color: 'var(--line-hair)' }}>|</span>

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
              color: 'var(--ink-lo)',
              font: 'inherit',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Click to copy full Config SHA-256"
          >
            <span>cfg:</span>
            <strong style={{ color: 'var(--ink-mid)' }}>{configHash ? configHash.slice(0, 6) : '—'}</strong>
            {copiedTarget === 'config' && (
              <span style={{ backgroundColor: 'var(--ok)', color: '#ffffff', padding: '0 4px', borderRadius: '3px', fontSize: '9px', fontWeight: 700 }}>
                COPIED
              </span>
            )}
          </button>

          <span style={{ color: 'var(--line-hair)' }}>|</span>

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
              color: 'var(--ink-lo)',
              font: 'inherit',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Click to copy full World Content Digest"
          >
            <span>wld:</span>
            <strong style={{ color: 'var(--ink-mid)' }}>{worldDigest ? worldDigest.slice(0, 6) : '—'}</strong>
            {copiedTarget === 'digest' && (
              <span style={{ backgroundColor: 'var(--ok)', color: '#ffffff', padding: '0 4px', borderRadius: '3px', fontSize: '9px', fontWeight: 700 }}>
                COPIED
              </span>
            )}
          </button>
        </div>

        {/* ⚡ Copilot Button */}
        {onToggleAgent && (
          <button
            id="toggle-agent-panel"
            onClick={onToggleAgent}
            style={{
              background: isAgentOpen ? 'var(--branch)' : 'rgba(168, 85, 247, 0.1)',
              border: isAgentOpen ? '1px solid var(--branch)' : '1px solid rgba(168, 85, 247, 0.35)',
              color: isAgentOpen ? '#ffffff' : '#a855f7',
              padding: '7px 15px',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isAgentOpen ? 'var(--branch-glow)' : 'var(--sh-1)',
              fontFamily: "'Poppins', sans-serif",
              transition: 'all var(--dur-feedback) var(--ease-out)',
            }}
            title="Track 01 Copilot Agent"
            aria-label="Toggle Agent Panel"
          >
            <span>⚡</span>
            <span>Copilot</span>
          </button>
        )}

        {/* History Button */}
        <button
          id="open-history-btn"
          onClick={onOpenHistory}
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--line-hair)',
            color: 'var(--ink-hi)',
            padding: '7px 15px',
            borderRadius: '999px',
            cursor: 'pointer',
            fontSize: '12.5px',
            fontWeight: 600,
            boxShadow: 'var(--sh-1)',
            fontFamily: "'Poppins', sans-serif",
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          title="Past Run History"
        >
          <span>📜</span>
          <span>History</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          id="theme-toggle"
          onClick={cycleTheme}
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--line-hair)',
            color: 'var(--ink-hi)',
            padding: '7px 14px',
            borderRadius: '999px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: 'var(--sh-1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontFamily: "'Poppins', sans-serif",
            transition: 'all 0.15s ease',
          }}
          title={`Current Theme: ${theme.toUpperCase()} (Click to toggle Light / Dark / System)`}
          aria-label={`Theme: ${theme.toUpperCase()}`}
        >
          <span>{theme === 'light' ? '☀' : theme === 'dark' ? '☾' : '⚙'}</span>
          <span>{theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto'}</span>
        </button>

        {/* Unified Tools Dropdown (Guided tour, Methodology, Shortcuts, Motion) */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              background: isDropdownOpen ? 'var(--bg-sunken)' : 'var(--bg-raised)',
              border: isDropdownOpen ? '1px solid var(--accent)' : '1px solid var(--line-hair)',
              color: isDropdownOpen ? 'var(--accent)' : 'var(--ink-hi)',
              padding: '7px 15px',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 600,
              boxShadow: 'var(--sh-1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'Poppins', sans-serif",
              transition: 'all 0.15s ease',
            }}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            title="Additional Tools and Documentation"
          >
            <span>Tools</span>
            <span
              style={{
                fontSize: '10px',
                transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            >
              ▾
            </span>
          </button>

          {/* Frosted Dropdown Popover */}
          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '270px',
                backgroundColor: 'var(--bg-panel)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--line-hair)',
                borderRadius: '16px',
                boxShadow: '0 18px 40px rgba(0, 0, 0, 0.18)',
                padding: '8px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                animation: 'drawer-slide-down 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              {/* Dropdown Item 1: Guided Tour */}
              {onStartTour && (
                <button
                  id="start-tour-btn"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onStartTour();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isTourActive ? 'var(--accent-wash)' : 'transparent',
                    color: isTourActive ? 'var(--accent)' : 'var(--ink-hi)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontFamily: "'Poppins', sans-serif",
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-sunken)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isTourActive ? 'var(--accent-wash)' : 'transparent')}
                >
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>🧭</span>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Guided Tour</span>
                    <span style={{ fontSize: '11px', color: 'var(--ink-lo)' }}>Interactive walkthrough</span>
                  </div>
                </button>
              )}

              {/* Dropdown Item 2: Verification Methodology */}
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onNavigate('/method');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: currentRoute === '/method' ? 'var(--accent-wash)' : 'transparent',
                  color: currentRoute === '/method' ? 'var(--accent)' : 'var(--ink-hi)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: "'Poppins', sans-serif",
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-sunken)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentRoute === '/method' ? 'var(--accent-wash)' : 'transparent')}
              >
                <span style={{ fontSize: '16px', flexShrink: 0 }}>🔬</span>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Methodology & Audit</span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-lo)' }}>Mathematical N-1 proof</span>
                </div>
              </button>

              {/* Dropdown Item 3: Keyboard Shortcuts */}
              {onOpenShortcuts && (
                <button
                  id="shortcuts-help-btn"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenShortcuts();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--ink-hi)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontFamily: "'Poppins', sans-serif",
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-sunken)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>⌨️</span>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Shortcuts</span>
                      <span style={{ fontSize: '11px', color: 'var(--ink-lo)' }}>Command keys</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      background: 'var(--bg-sunken)',
                      border: '1px solid var(--line-hair)',
                      borderRadius: '5px',
                      color: 'var(--ink-mid)',
                    }}
                  >
                    ?
                  </span>
                </button>
              )}

              <div style={{ height: '1px', backgroundColor: 'var(--line-hair)', margin: '4px 0' }} />

              {/* Dropdown Item 4: Reduced Motion Preference */}
              <button
                id="reduced-motion-toggle"
                onClick={toggleMotion}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ink-hi)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: "'Poppins', sans-serif",
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-sunken)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '15px', flexShrink: 0 }}>{reducedMotion ? '⊘' : '◎'}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 500 }}>Reduced Motion</span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: reducedMotion ? 'var(--accent)' : 'var(--ink-lo)',
                  }}
                >
                  {reducedMotion ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Right Mobile Hamburger Toggle Button (Visible on < 960px) */}
      <button
        type="button"
        className="hdr-menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        title="Menu"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'var(--bg-raised)',
          border: '1px solid var(--line-hair)',
          color: 'var(--ink-hi)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--sh-1)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {isMenuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {/* 5. Mobile Drawer (Refined styling with glassmorphism & Poppins) */}
      {isMenuOpen && (
        <div
          className="hdr-mobile-drawer"
          style={{
            position: 'absolute',
            top: 'var(--h-header, 64px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-panel)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--line-firm)',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.28)',
            borderBottomLeftRadius: '24px',
            borderBottomRightRadius: '24px',
            padding: '20px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 100,
            maxHeight: 'calc(100vh - var(--h-header, 64px))',
            overflowY: 'auto',
            fontFamily: "'Poppins', sans-serif",
            animation: 'drawer-slide-down 0.2s var(--ease-out)',
          }}
        >
          {/* Segmented Navigation */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-sunken)',
              border: '1px solid var(--line-hair)',
              borderRadius: '999px',
              padding: '4px',
              gap: '4px',
              width: '100%',
            }}
            aria-label="Mobile Navigation"
          >
            <button
              id="nav-landing-btn"
              onClick={() => {
                onNavigate('/');
                setIsMenuOpen(false);
              }}
              style={{
                flex: 1,
                background: currentRoute === '/' ? 'var(--bg-panel)' : 'transparent',
                border: currentRoute === '/' ? '1px solid var(--line-hair)' : '1px solid transparent',
                padding: '9px 14px',
                fontSize: '13.5px',
                fontWeight: currentRoute === '/' ? 700 : 500,
                color: currentRoute === '/' ? 'var(--accent)' : 'var(--ink-mid)',
                cursor: 'pointer',
                borderRadius: '999px',
                boxShadow: currentRoute === '/' ? 'var(--sh-1)' : 'none',
                textAlign: 'center',
                fontFamily: "'Poppins', sans-serif",
                transition: 'all var(--dur-state) var(--ease-out)',
              }}
            >
              Landing
            </button>
            <button
              id="nav-deck-btn"
              onClick={() => {
                onNavigate('/deck');
                setIsMenuOpen(false);
              }}
              style={{
                flex: 1,
                background: currentRoute === '/deck' ? 'var(--bg-panel)' : 'transparent',
                border: currentRoute === '/deck' ? '1px solid var(--line-hair)' : '1px solid transparent',
                padding: '9px 14px',
                fontSize: '13.5px',
                fontWeight: currentRoute === '/deck' ? 700 : 500,
                color: currentRoute === '/deck' ? 'var(--accent)' : 'var(--ink-mid)',
                cursor: 'pointer',
                borderRadius: '999px',
                boxShadow: currentRoute === '/deck' ? 'var(--sh-1)' : 'none',
                textAlign: 'center',
                fontFamily: "'Poppins', sans-serif",
                transition: 'all var(--dur-state) var(--ease-out)',
              }}
            >
              Command Deck
            </button>
          </nav>

          {/* Telemetry Status Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: 'var(--bg-sunken)',
              border: '1px solid var(--line-hair)',
              borderRadius: '14px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <button
                id="health-dot"
                onClick={() => {
                  onNavigate('/method');
                  setIsMenuOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  font: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: 0,
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <span
                  className={`health-dot ${isDbHealthy ? 'alive' : 'down'}`}
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: isDbHealthy ? 'var(--ok)' : 'var(--fail)',
                    boxShadow: isDbHealthy ? '0 0 8px rgba(74, 222, 128, 0.6)' : 'none',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink-hi)' }}>
                  FalkorDB 6.0.2 {isDbHealthy ? 'Live' : 'Offline'}
                </span>
              </button>

              <span
                id="provenance-badge"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onNavigate('/method');
                  setIsMenuOpen(false);
                }}
              >
                <StatusBadge status="SYNTHETIC" label="REFERENCE + SYNTHETIC" />
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', paddingTop: '6px', borderTop: '1px solid var(--line-hair)' }} className="mono">
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
                  color: 'var(--ink-lo)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>cfg:</span>
                <strong style={{ color: 'var(--ink-mid)' }}>{configHash ? configHash.slice(0, 8) : '—'}</strong>
                {copiedTarget === 'config' && (
                  <span style={{ backgroundColor: 'var(--ok)', color: '#ffffff', padding: '0 4px', borderRadius: '3px', fontSize: '9px', fontWeight: 700 }}>
                    COPIED
                  </span>
                )}
              </button>

              <span style={{ color: 'var(--line-hair)' }}>|</span>

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
                  color: 'var(--ink-lo)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>wld:</span>
                <strong style={{ color: 'var(--ink-mid)' }}>{worldDigest ? worldDigest.slice(0, 8) : '—'}</strong>
                {copiedTarget === 'digest' && (
                  <span style={{ backgroundColor: 'var(--ok)', color: '#ffffff', padding: '0 4px', borderRadius: '3px', fontSize: '9px', fontWeight: 700 }}>
                    COPIED
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Action Links Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {onStartTour && (
              <button
                id="start-tour-btn"
                onClick={() => {
                  onStartTour();
                  setIsMenuOpen(false);
                }}
                style={{
                  background: isTourActive ? 'var(--accent-wash)' : 'var(--bg-raised)',
                  border: '1px solid var(--line-hair)',
                  color: isTourActive ? 'var(--accent)' : 'var(--ink-hi)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: 'var(--sh-1)',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <span>🧭</span>
                <span>Guided Tour</span>
              </button>
            )}

            {onToggleAgent && (
              <button
                id="toggle-agent-panel"
                onClick={() => {
                  onToggleAgent();
                  setIsMenuOpen(false);
                }}
                style={{
                  background: isAgentOpen ? 'var(--branch)' : 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  color: isAgentOpen ? '#ffffff' : '#a855f7',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: 'var(--sh-1)',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <span>⚡</span>
                <span>Copilot Agent</span>
              </button>
            )}

            <button
              id="open-history-btn"
              onClick={() => {
                onOpenHistory();
                setIsMenuOpen(false);
              }}
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--line-hair)',
                color: 'var(--ink-hi)',
                padding: '12px 14px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--sh-1)',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <span>📜</span>
              <span>Past Runs</span>
            </button>

            <button
              onClick={() => {
                onNavigate(currentRoute === '/method' ? '/' : '/method');
                setIsMenuOpen(false);
              }}
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--line-hair)',
                color: 'var(--accent)',
                padding: '12px 14px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--sh-1)',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <span>🔬</span>
              <span>Methodology</span>
            </button>
          </div>

          {/* Preferences Bottom Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--line-hair)' }}>
            <button
              id="theme-toggle"
              onClick={cycleTheme}
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--line-hair)',
                color: 'var(--ink-hi)',
                padding: '8px 16px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--sh-1)',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <span>{theme === 'light' ? '☀' : theme === 'dark' ? '☾' : '⚙'}</span>
              <span>Theme: {theme.toUpperCase()}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                id="reduced-motion-toggle"
                onClick={toggleMotion}
                style={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--line-hair)',
                  color: reducedMotion ? 'var(--accent)' : 'var(--ink-lo)',
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--sh-1)',
                }}
                title="Toggle Reduced Motion"
              >
                {reducedMotion ? '⊘' : '◎'}
              </button>

              {onOpenShortcuts && (
                <button
                  id="shortcuts-help-btn"
                  onClick={() => {
                    onOpenShortcuts();
                    setIsMenuOpen(false);
                  }}
                  style={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--line-hair)',
                    color: 'var(--ink-lo)',
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--sh-1)',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                  title="Keyboard Shortcuts (?)"
                >
                  ?
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
