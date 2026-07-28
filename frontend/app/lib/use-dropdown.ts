'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

/**
 * Dropdown behaviour shared by the mega-menu, cart, and account menus.
 *
 * The close delay is deliberate: without it, moving the mouse diagonally from
 * the trigger toward the panel crosses a dead gap and snaps the panel shut.
 */
export function useDropdown({ closeDelay = 160 } = {}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // A panel rendered through a portal lives outside containerRef, so it needs
  // its own ref — otherwise taps inside it register as "outside" and close it.
  const panelRef = useRef<HTMLDivElement | null>(null);
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

    const isInside = (target: Node | null) =>
      Boolean(
        target &&
          (containerRef.current?.contains(target) ||
            panelRef.current?.contains(target)),
      );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!isInside(event.target as Node)) setOpen(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!isInside(event.target as Node)) setOpen(false);
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

  /**
   * iOS fires mouseenter on tap *before* the click, so a hover-to-open handler
   * opens the panel and the click then toggles it straight back shut — the
   * classic "have to tap twice" bug. Restricting hover to real mice fixes it.
   */
  const hoverProps = {
    onPointerEnter: (event: ReactPointerEvent) => {
      if (event.pointerType === 'mouse') openNow();
    },
    onPointerLeave: (event: ReactPointerEvent) => {
      if (event.pointerType === 'mouse') closeSoon();
    },
  };

  return {
    open,
    setOpen,
    openNow,
    closeSoon,
    closeNow,
    containerRef,
    panelRef,
    hoverProps,
  };
}
