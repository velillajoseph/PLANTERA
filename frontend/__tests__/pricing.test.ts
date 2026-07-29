import { describe, expect, it } from 'vitest';
import {
  applyPercent,
  discountLabel,
  fromUtcNaive,
  isOnSale,
  toUtcNaive,
  windowLive,
} from '../app/lib/pricing';
import { formatMoney } from '../app/lib/format';

/**
 * These are the same vectors as ROUNDING_VECTORS in
 * backend/tests/test_pricing.py. The server decides what a shopper is charged;
 * this copy only drives the vendor's live preview, so any divergence shows the
 * vivero one number and bills another. Change one file, change both.
 */
const ROUNDING_VECTORS: Array<[number, number, number]> = [
  [42.0, 15, 35.7],
  [19.99, 33, 13.39],
  [0.15, 50, 0.08], // half-up: 7.5 cents rounds to 8
  [0.01, 90, 0.01], // floored at a cent, never free
  [100.0, 0, 100.0],
  [25.0, 90, 2.5],
];

describe('applyPercent', () => {
  it.each(ROUNDING_VECTORS)(
    '%s at %s%% off is %s — matching the Python implementation',
    (price, percent, expected) => {
      expect(applyPercent(price, percent)).toBe(expected);
    },
  );
});

describe('isOnSale', () => {
  it('keys off original_price being null, never zero', () => {
    expect(isOnSale({ original_price: null })).toBe(false);
    expect(isOnSale({ original_price: 42 })).toBe(true);
  });
});

describe('discountLabel', () => {
  it('uses a real minus sign', () => {
    expect(discountLabel(20)).toBe('−20%');
  });
});

describe('windowLive', () => {
  const now = Date.parse('2026-07-29T12:00:00Z');

  it('treats blank bounds as open-ended', () => {
    expect(windowLive(null, null, now)).toBe(true);
  });

  it('includes both edges', () => {
    expect(windowLive('2026-07-29T12:00:00', null, now)).toBe(true);
    expect(windowLive(null, '2026-07-29T12:00:00', now)).toBe(true);
  });

  it('is closed outside its bounds', () => {
    expect(windowLive('2026-07-29T13:00:00', null, now)).toBe(false);
    expect(windowLive(null, '2026-07-29T11:59:59', now)).toBe(false);
  });
});

describe('datetime-local conversion', () => {
  it('round-trips a local wall time through naive UTC', () => {
    // The vivero types local time; the API stores naive UTC. If these two
    // disagree, a sale ends hours early and nothing visibly breaks.
    const local = '2026-08-01T09:30';
    const roundTripped = fromUtcNaive(toUtcNaive(local));
    expect(roundTripped).toBe(local);
  });

  it('converts local to UTC rather than passing the string through', () => {
    const utc = toUtcNaive('2026-08-01T09:30');
    expect(utc).toBe(new Date('2026-08-01T09:30').toISOString().slice(0, 19));
  });

  it('treats blank and invalid input as no bound', () => {
    expect(toUtcNaive('')).toBeNull();
    expect(toUtcNaive('not a date')).toBeNull();
    expect(fromUtcNaive(null)).toBe('');
    expect(fromUtcNaive(undefined)).toBe('');
  });
});

describe('formatMoney', () => {
  it('formats whole and fractional amounts as USD', () => {
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(35.7)).toBe('$35.70');
    expect(formatMoney(1234.5)).toBe('$1,234.50');
  });
});
