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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 14, 20, 0.85)',
        backdropFilter: 'blur(2px)',
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
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 id="shortcuts-title" style={{ fontSize: '15px', color: 'var(--text)' }}>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>

        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <tbody>
            {shortcuts.map((s) => (
              <tr key={s.key} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '8px 0', width: '100px' }}>
                  <kbd
                    style={{
                      padding: '3px 8px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--line)',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--accent)',
                    }}
                  >
                    {s.key}
                  </kbd>
                </td>
                <td style={{ padding: '8px 0', color: 'var(--text-2)' }}>{s.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
