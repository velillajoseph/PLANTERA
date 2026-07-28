'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Dropdown behaviour shared by the mega-menu, cart, and account menus.
 *
 * The close delay is deliberate: without it, moving the mouse diagonally from
 * the trigger toward the panel crosses a dead gap and snaps the panel shut.
 */
export function useDropdown({ closeDelay = 160 } = {}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const openNow = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const closeSoon = useCallback(() => {
    cancelClose();
    timer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [cancelClose, closeDelay]);

  const closeNow = useCallback(() => {
    cancelClose();
    setOpen(false);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open]);

  return { open, setOpen, openNow, closeSoon, closeNow, containerRef };
}
