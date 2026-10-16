import React from 'react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '◀ / ▶', action: 'Step between counterfactual frames 0 through 4' },
    { key: 'Esc', action: 'Close any active modal or clear selection' },
    { key: '?', action: 'Toggle this keyboard shortcut sheet' },
    { key: 'Tab', action: 'Navigate focus through accessible controls' },
    { key: 'Enter / Space', action: 'Activate focused button or select corridor' },
  ];

  return (
    <div
      id="shortcuts-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--overlay-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        style={{
          width: '420px',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--line-hair)',
          borderRadius: 'var(--r-panel)',
          padding: 'var(--s5)',
          boxShadow: 'var(--elevation-sticky)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s4)' }}>
          <h2 id="shortcuts-title" style={{ fontSize: 'var(--fs-ui)', color: 'var(--ink-hi)', margin: 0 }}>
            Keyboard Shortcuts
          </h2>
          <button
            id="close-shortcuts-btn"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--ink-lo)', cursor: 'pointer', fontSize: 'var(--fs-ui)' }}
            aria-label="Close shortcuts sheet"
          >
            ✕
          </button>
        </div>

        <table style={{ width: '100%', fontSize: 'var(--fs-cap)', borderCollapse: 'collapse' }}>
          <tbody>
            {shortcuts.map((s) => (
              <tr key={s.key} style={{ borderBottom: '1px solid var(--line-hair)' }}>
                <td style={{ padding: 'var(--s2) 0', width: '110px' }}>
                  <kbd
                    style={{
                      padding: '2px var(--s2)',
                      backgroundColor: 'var(--bg-raised)',
                      border: '1px solid var(--line-hair)',
                      borderRadius: 'var(--r-chip)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--fs-micro)',
                      color: 'var(--accent)',
                    }}
                  >
                    {s.key}
                  </kbd>
                </td>
                <td style={{ padding: 'var(--s2) 0', color: 'var(--ink-mid)' }}>{s.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
