/**
 * Discount helpers shared by the storefront and the vendor portal.
 *
 * `applyPercent` mirrors `backend/app/pricing.py::apply_percent` exactly. The
 * server is the authority for what a shopper pays; this copy exists only so the
 * vendor's "final price" preview matches what will actually be charged. The two
 * are pinned to the same table of vectors in `__tests__/pricing.test.ts` and
 * `backend/tests/test_pricing.py` — change one, change both.
 */

/** Nothing may round to free. Matches MIN_PRICE_CENTS on the server. */
const MIN_PRICE_CENTS = 1;

export const MAX_DISCOUNT_PERCENT = 90;

/** The pricing fields every shopper-facing item carries. */
export type Priced = {
  price: number;
  original_price: number | null;
  discount_percent: number | null;
};

/**
 * `original_price` is null unless a discount is live — never 0 — so this one
 * check is the whole "is it on sale" question.
 */
export function isOnSale(item: Pick<Priced, 'original_price'>): boolean {
  return item.original_price != null;
}

/** "−20%" with a real minus sign, not a hyphen. */
export function discountLabel(percent: number): string {
  return `−${percent}%`;
}

/**
 * Is a discount window open right now? Mirrors `window_open` on the server; a
 * blank bound is open-ended and both edges are inclusive.
 */
export function windowLive(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  const asUtc = (value: string) => new Date(`${value.replace(/Z$/, '')}Z`).getTime();
  if (startsAt && now < asUtc(startsAt)) return false;
  if (endsAt && now > asUtc(endsAt)) return false;
  return true;
}

export function applyPercent(price: number, percent: number): number {
  const cents = Math.round(price * 100);
  const discounted = Math.floor((cents * (100 - percent) + 50) / 100);
  return Math.max(discounted, MIN_PRICE_CENTS) / 100;
}

/**
 * `<input type="datetime-local">` yields local wall time; the API stores naive
 * UTC. Without this conversion an Atlantic-time vivero's sale would end four
 * hours early — a silently wrong price for as long as nobody notices.
 */
export function toUtcNaive(local: string): string | null {
  if (!local) return null;
  const parsed = new Date(local);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 19);
}

/** The inverse, for populating the form from an API value. */
export function fromUtcNaive(naive: string | null | undefined): string {
  if (!naive) return '';
  // The API sends naive UTC; the trailing Z is what makes Date read it as UTC
  // rather than as local time.
  const parsed = new Date(`${naive.replace(/Z$/, '')}Z`);
  if (Number.isNaN(parsed.getTime())) return '';
  const offsetMs = parsed.getTime() - parsed.getTimezoneOffset() * 60_000;
  return new Date(offsetMs).toISOString().slice(0, 16);
}
