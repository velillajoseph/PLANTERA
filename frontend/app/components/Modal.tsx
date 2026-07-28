'use client';

import { useEffect, type ReactNode } from 'react';

export default function Modal({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <h2 style={{ fontSize: '1.4rem' }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '1.3rem',
              color: 'var(--muted)',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
