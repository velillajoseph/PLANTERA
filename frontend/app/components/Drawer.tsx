'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Locks the page behind a drawer.
 *
 * `overflow: hidden` alone does not hold on iOS Safari — the page still
 * rubber-bands and, worse, jumps to the top on release. Pinning the body with
 * `position: fixed` at a negative offset and restoring the scroll position on
 * unlock is the approach that actually behaves.
 */
function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.classList.add('is-locked');

    return () => {
      document.body.classList.remove('is-locked');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}

export default function Drawer({
  open,
  onClose,
  side = 'left',
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  label: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusTo = useRef<Element | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement;
    // Move focus into the drawer so screen readers and keyboards follow it.
    const focusTarget = panelRef.current?.querySelector<HTMLElement>(
      'button, a[href], input, select, textarea',
    );
    focusTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      (restoreFocusTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`drawer-backdrop${open ? ' drawer-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className={`drawer drawer--${side}${open ? ' drawer--open' : ''}`}
        role="dialog"
        aria-modal={open}
        aria-label={label}
        aria-hidden={!open}
      >
        {children}
      </div>
    </>
  );
}
