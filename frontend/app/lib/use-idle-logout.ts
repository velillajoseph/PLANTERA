'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { onSessionWindow } from './http';

/** Persist activity at most this often; the in-memory ref updates every time. */
const ACTIVITY_WRITE_MS = 5_000;

const WARN_MS = 60_000;

/**
 * Events that count as presence. `mousemove` is deliberately absent: a cursor
 * resting over a forgotten tab is not someone being there, and the warning
 * modal is the escape hatch for a person who really is just reading.
 */
const ACTIVITY_EVENTS = [
  'pointerdown',
  'keydown',
  'wheel',
  'touchstart',
  'scroll',
] as const;

export type IdleLogoutOptions = {
  /** False when signed out — otherwise the interval runs forever on public pages. */
  enabled: boolean;
  idleMs: number;
  warnMs?: number;
  /** localStorage key used to share activity across tabs. */
  activityKey: string;
  tokenKey: string;
  onIdle: () => void;
  onExtend?: () => Promise<unknown>;
};

export type IdleLogoutState = {
  warning: boolean;
  secondsLeft: number;
  staySignedIn: () => void;
};

export function useIdleLogout({
  enabled,
  idleMs,
  warnMs = WARN_MS,
  activityKey,
  tokenKey,
  onIdle,
  onExtend,
}: IdleLogoutOptions): IdleLogoutState {
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // A ref, not state: activity fires constantly and must never re-render.
  const lastActivityRef = useRef(Date.now());
  const lastWriteRef = useRef(0);
  const firedRef = useRef(false);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  const bump = useCallback(
    (force = false) => {
      const now = Date.now();
      lastActivityRef.current = now;
      if (force || now - lastWriteRef.current > ACTIVITY_WRITE_MS) {
        lastWriteRef.current = now;
        try {
          window.localStorage.setItem(activityKey, String(now));
        } catch {
          // Private mode or a full quota; the in-memory timer still works.
        }
      }
    },
    [activityKey],
  );

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the warning when the session ends
      setWarning(false);
      firedRef.current = false;
      return;
    }

    firedRef.current = false;
    lastActivityRef.current = Date.now();

    const handler = () => bump();
    ACTIVITY_EVENTS.forEach((name) =>
      window.addEventListener(name, handler, { passive: true, capture: true }),
    );

    // Activity in any tab keeps every tab alive.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== activityKey || !event.newValue) return;
      const stamp = Number(event.newValue);
      if (!Number.isNaN(stamp)) {
        lastActivityRef.current = Math.max(lastActivityRef.current, stamp);
      }
    };
    window.addEventListener('storage', onStorage);

    const tick = () => {
      if (firedRef.current) return;
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= idleMs) {
        firedRef.current = true;
        setWarning(false);
        onIdleRef.current();
        return;
      }

      const remaining = idleMs - elapsed;
      if (remaining <= warnMs) {
        setWarning(true);
        setSecondsLeft(Math.ceil(remaining / 1000));
      } else {
        // Only touch state when it would actually change, so the quiet minutes
        // before the warning cost zero renders.
        setWarning((current) => (current ? false : current));
      }
    };

    const interval = window.setInterval(tick, 1000);

    // Comparing wall-clock timestamps rather than accumulated ticks is what
    // makes this correct after the laptop sleeps: setTimeout would fire late
    // or not at all, but a timestamp difference cannot lie. Run it on
    // tab-restore too, so a long sleep logs out before stale content paints.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // The server's window is the client's plus a grace margin, so this
    // normally does nothing — it matters when the two clocks disagree.
    const unsubscribe = onSessionWindow((key, expiresAt) => {
      if (key !== tokenKey) return;
      const projected = lastActivityRef.current + idleMs;
      const serverDeadline = expiresAt.getTime();
      if (serverDeadline < projected) {
        lastActivityRef.current = serverDeadline - idleMs;
      }
    });

    return () => {
      ACTIVITY_EVENTS.forEach((name) =>
        window.removeEventListener(name, handler, { capture: true }),
      );
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setWarning/setSecondsLeft are stable setters
  }, [enabled, idleMs, warnMs, activityKey, tokenKey, bump]);

  const staySignedIn = useCallback(() => {
    bump(true);
    setWarning(false);
    void onExtend?.();
  }, [bump, onExtend]);

  return { warning, secondsLeft, staySignedIn };
}
