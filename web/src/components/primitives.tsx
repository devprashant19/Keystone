import React, { useState, useEffect } from 'react';
import { getStatusEncoding } from '../lib/encodings';

/* --- Panel --- */
interface PanelProps {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ title, meta, children, className = '', action }) => (
  <section className={`panel ${className}`} style={{
    background: 'var(--bg-panel)',
    border: '1px solid var(--line-hair)',
    borderRadius: 'var(--r-panel)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }}>
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--s3) var(--s4)',
      borderBottom: '1px solid var(--line-hair)',
      background: 'var(--bg-header)',
      minHeight: '36px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
        <h2 style={{
          fontSize: 'var(--fs-ui)',
          fontWeight: 600,
          color: 'var(--ink-hi)',
          margin: 0,
          letterSpacing: '0.02em'
        }}>{title}</h2>
        {meta && <span style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)' }}>{meta}</span>}
      </div>
      {action && <div>{action}</div>}
    </header>
    <div style={{ padding: 'var(--s4)', flex: 1, overflow: 'auto' }}>
      {children}
    </div>
  </section>
);

/* --- MetricTile --- */
export interface MetricTileProps {
  label: string;
  value: number | string | null;
  unit?: string;
  denominator?: string;
  onDrill?: () => void;
  status?: string;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  unit,
  denominator,
  onDrill,
  status
}) => {
  const isNull = value === null || value === undefined;
  const displayValue = isNull ? '—' : String(value);
  const encoding = status ? getStatusEncoding(status) : null;

  return (
    <div
      className={`metric-tile ${onDrill && !isNull ? 'clickable' : ''}`}
      onClick={!isNull && onDrill ? onDrill : undefined}
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--line-hair)',
        borderLeft: encoding ? `3px solid ${encoding.colorVar}` : '1px solid var(--line-hair)',
        borderRadius: 'var(--r-ctl)',
        padding: 'var(--s3) var(--s4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s1)',
        cursor: onDrill && !isNull ? 'pointer' : 'default'
      }}
      role={onDrill && !isNull ? 'button' : undefined}
      tabIndex={onDrill && !isNull ? 0 : undefined}
      onKeyDown={e => {
        if (onDrill && !isNull && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onDrill();
        }
      }}
    >
      <div style={{
        fontSize: 'var(--fs-cap)',
        color: 'var(--ink-mid)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>{label}</span>
        {denominator && <span style={{ color: 'var(--ink-lo)', fontSize: 'var(--fs-micro)' }}>{denominator}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s2)' }}>
        <span
          data-testid="metric-value"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-h2)',
            fontWeight: 600,
            lineHeight: 'var(--lh-tight)',
            color: isNull ? 'var(--ink-lo)' : (encoding ? encoding.colorVar : 'var(--ink-hi)'),
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {displayValue}
        </span>
        {unit && !isNull && (
          <span style={{ fontSize: 'var(--fs-cap)', color: 'var(--ink-mid)' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

/* --- StatusBadge --- */
interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  const enc = getStatusEncoding(status);
  const text = label || enc.badgeText;

  return (
    <span
      className={`status-badge status-${enc.badgeText.toLowerCase()}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--s1)',
        padding: size === 'sm' ? '2px 6px' : '4px 8px',
        borderRadius: 'var(--r-chip)',
        background: enc.washVar ? enc.washVar : 'var(--bg-sunken)',
        color: enc.colorVar,
        border: `1px solid ${enc.colorVar}`,
        fontSize: size === 'sm' ? 'var(--fs-micro)' : 'var(--fs-cap)',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        letterSpacing: '0.04em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      {enc.iconGlyph === 'filled-dot' && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: enc.colorVar, flexShrink: 0 }} />
      )}
      {enc.iconGlyph === 'hollow-ring' && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', border: `1.5px solid ${enc.colorVar}`, flexShrink: 0 }} />
      )}
      {enc.iconGlyph === 'half-dot' && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: enc.colorVar, opacity: 0.7, flexShrink: 0 }} />
      )}
      {enc.iconGlyph === 'cross' && (
        <span style={{ fontSize: 'var(--fs-micro)', fontWeight: 'bold', flexShrink: 0 }}>✕</span>
      )}
      <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
    </span>
  );
};

/* --- Chip --- */
interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}

export const Chip: React.FC<ChipProps> = ({ label, active = false, onClick, count }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--s1)',
      padding: '3px 8px',
      borderRadius: 'var(--r-chip)',
      background: active ? 'var(--accent-wash)' : 'var(--bg-raised)',
      color: active ? 'var(--accent)' : 'var(--ink-mid)',
      border: `1px solid ${active ? 'var(--accent-edge)' : 'var(--line-hair)'}`,
      fontSize: 'var(--fs-cap)',
      fontFamily: 'var(--font-mono)',
      cursor: onClick ? 'pointer' : 'default'
    }}
  >
    <span>{label}</span>
    {count !== undefined && (
      <span style={{
        background: 'var(--bg-sunken)',
        padding: '0 4px',
        borderRadius: 'var(--r-chip)',
        color: 'var(--ink-hi)',
        fontSize: 'var(--fs-micro)'
      }}>
        {count}
      </span>
    )}
  </button>
);

/* --- IconButton --- */
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, label, disabled, onClick, ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: 'var(--bg-raised)',
      border: '1px solid var(--line-hair)',
      borderRadius: 'var(--r-ctl)',
      color: disabled ? 'var(--ink-lo)' : 'var(--ink-hi)',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }}
    {...props}
  >
    {icon}
  </button>
);

/* --- TabStrip --- */
interface TabStripProps {
  tabs: { id: string; label: string; count?: number }[];
  activeId: string;
  onChange: (id: string) => void;
}

export const TabStrip: React.FC<TabStripProps> = ({ tabs, activeId, onChange }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--s4)',
    borderBottom: '1px solid var(--line-hair)',
    background: 'var(--bg-header)',
    padding: '0 var(--s4)'
  }}>
    {tabs.map(t => {
      const active = t.id === activeId;
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
            color: active ? 'var(--ink-hi)' : 'var(--ink-mid)',
            padding: 'var(--s3) var(--s2)',
            fontSize: 'var(--fs-ui)',
            fontWeight: active ? 600 : 400,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--s1)'
          }}
        >
          <span>{t.label}</span>
          {t.count !== undefined && (
            <span style={{
              fontSize: 'var(--fs-cap)',
              color: active ? 'var(--accent)' : 'var(--ink-lo)',
              fontFamily: 'var(--font-mono)'
            }}>
              ({t.count})
            </span>
          )}
        </button>
      );
    })}
  </div>
);

/* --- Tooltip --- */
interface TooltipProps {
  content: string;
  children: React.ReactElement;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);

  const handleMouseEnter = () => {
    const t = window.setTimeout(() => setOpen(true), 400);
    setTimer(t);
  };

  const handleMouseLeave = () => {
    if (timer) window.clearTimeout(timer);
    setTimeout(() => setOpen(false), 100);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {open && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 'var(--s2)',
          background: 'var(--bg-raised)',
          border: '1px solid var(--line-firm)',
          color: 'var(--ink-hi)',
          padding: 'var(--s1) var(--s2)',
          fontSize: 'var(--fs-cap)',
          borderRadius: 'var(--r-ctl)',
          whiteSpace: 'nowrap',
          zIndex: 1000
        }}>
          {content}
        </div>
      )}
    </div>
  );
};

/* --- Banner --- */
interface BannerProps {
  type: 'stale' | 'partial' | 'error' | 'abstain' | 'info';
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

export const Banner: React.FC<BannerProps> = ({ type, title, message, action }) => {
  let borderColor = 'var(--line-hair)';
  let wash = 'var(--bg-raised)';

  if (type === 'error') {
    borderColor = 'var(--fail)';
    wash = 'var(--fail-wash)';
  } else if (type === 'abstain' || type === 'partial' || type === 'stale') {
    borderColor = 'var(--warn)';
    wash = 'var(--warn-wash)';
  }

  return (
    <div style={{
      background: wash,
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--r-panel)',
      padding: 'var(--s3) var(--s4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--s4)'
    }}>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--ink-hi)', fontSize: 'var(--fs-body)' }}>{title}</div>
        <div style={{ color: 'var(--ink-mid)', fontSize: 'var(--fs-cap)' }}>{message}</div>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            background: 'var(--bg-sunken)',
            border: '1px solid var(--line-firm)',
            color: 'var(--ink-hi)',
            borderRadius: 'var(--r-ctl)',
            padding: 'var(--s2) var(--s3)',
            fontSize: 'var(--fs-cap)',
            cursor: 'pointer'
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

/* --- EmptyState --- */
interface EmptyStateProps {
  headline: string;
  explanation: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ headline, explanation, action }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--s6) var(--s4)',
    textAlign: 'center',
    gap: 'var(--s2)'
  }}>
    <h3 style={{ fontSize: 'var(--fs-h3)', color: 'var(--ink-hi)', margin: 0 }}>{headline}</h3>
    <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-mid)', maxWidth: '420px', margin: 0 }}>{explanation}</p>
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        style={{
          marginTop: 'var(--s3)',
          background: 'var(--accent)',
          border: 'none',
          color: 'var(--bg-void)',
          fontWeight: 600,
          borderRadius: 'var(--r-ctl)',
          padding: 'var(--s2) var(--s4)',
          cursor: 'pointer',
          fontSize: 'var(--fs-body)'
        }}
      >
        {action.label}
      </button>
    )}
  </div>
);
