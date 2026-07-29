import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIdleLogout, type IdleLogoutOptions } from '../app/lib/use-idle-logout';

const IDLE_MS = 20 * 60 * 1000;
const WARN_MS = 60 * 1000;

/**
 * The hook's state is rendered into the DOM and read back from there, rather
 * than captured into a module variable — mutating one during render is exactly
 * the impurity the react-hooks lint rules exist to catch.
 */
function Probe(props: Partial<IdleLogoutOptions> & { onIdle: () => void }) {
  const { warning, secondsLeft, staySignedIn } = useIdleLogout({
    enabled: true,
    idleMs: IDLE_MS,
    warnMs: WARN_MS,
    activityKey: 'test-activity',
    tokenKey: 'test-token',
    ...props,
  });

  return (
    <button type="button" data-testid="probe" data-warning={warning} onClick={staySignedIn}>
      {secondsLeft}
    </button>
  );
}

const probe = () => screen.getByTestId('probe');
const isWarning = () => probe().getAttribute('data-warning') === 'true';
const secondsLeft = () => Number(probe().textContent);
const clickStay = () => act(() => probe().click());

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-28T12:00:00Z'));
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Advance both the clock and the interval, the way real time does. */
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('useIdleLogout', () => {
  it('warns exactly once the remaining time drops under warnMs', () => {
    const onIdle = vi.fn();
    render(<Probe onIdle={onIdle} />);

    advance(IDLE_MS - WARN_MS - 2000);
    expect(isWarning()).toBe(false);

    advance(3000);
    expect(isWarning()).toBe(true);
    expect(secondsLeft()).toBeLessThanOrEqual(60);
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('logs out at idleMs', () => {
    const onIdle = vi.fn();
    render(<Probe onIdle={onIdle} />);

    advance(IDLE_MS - 1000);
    expect(onIdle).not.toHaveBeenCalled();

    advance(2000);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('only fires once even if time keeps running', () => {
    const onIdle = vi.fn();
    render(<Probe onIdle={onIdle} />);

    advance(IDLE_MS + 30_000);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('resets the countdown on a keypress', () => {
    const onIdle = vi.fn();
    render(<Probe onIdle={onIdle} />);

    advance(IDLE_MS - 30_000);
    expect(isWarning()).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      vi.advanceTimersByTime(1000);
    });
    expect(isWarning()).toBe(false);

    advance(IDLE_MS - 5000);
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('staySignedIn clears the warning and calls the extend endpoint', () => {
    const onIdle = vi.fn();
    const onExtend = vi.fn().mockResolvedValue(undefined);
    render(<Probe onIdle={onIdle} onExtend={onExtend} />);

    advance(IDLE_MS - 30_000);
    expect(isWarning()).toBe(true);

    clickStay();
    expect(isWarning()).toBe(false);
    expect(onExtend).toHaveBeenCalledTimes(1);

    advance(IDLE_MS - 5000);
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('logs out immediately when the machine wakes from a long sleep', () => {
    // The real failure this guards: setTimeout does not fire on a sleeping
    // laptop, so anything counting ticks would still think the session is
    // fresh. Comparing wall-clock timestamps cannot be fooled that way.
    const onIdle = vi.fn();
    render(<Probe onIdle={onIdle} />);

    act(() => {
      // Jump the clock three hours without running any timers at all.
      vi.setSystemTime(new Date('2026-07-28T15:00:00Z'));
      vi.advanceTimersByTime(1000);
    });

    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('does nothing at all when disabled', () => {
    const onIdle = vi.fn();
    render(<Probe enabled={false} onIdle={onIdle} />);

    advance(IDLE_MS * 2);
    expect(onIdle).not.toHaveBeenCalled();
    expect(isWarning()).toBe(false);
  });

  it('treats activity from another tab as its own', () => {
    const onIdle = vi.fn();
    render(<Probe onIdle={onIdle} />);

    advance(IDLE_MS - 30_000);
    expect(isWarning()).toBe(true);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'test-activity',
          newValue: String(Date.now()),
        }),
      );
      vi.advanceTimersByTime(1000);
    });

    expect(isWarning()).toBe(false);
    expect(onIdle).not.toHaveBeenCalled();
  });
});
