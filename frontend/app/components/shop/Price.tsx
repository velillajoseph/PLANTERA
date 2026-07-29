'use client';

import { useLang } from '../../lib/i18n';
import { formatMoney } from '../../lib/format';

const COPY = {
  es: { was: 'Precio anterior', now: 'Precio con descuento' },
  en: { was: 'Was', now: 'Now' },
};

/**
 * A price, struck through beside its sale price when a discount is live.
 *
 * Every money string in the app still goes through `formatMoney`; this only
 * decides how many of them to show.
 */
export default function Price({
  price,
  original,
  size = 'md',
  className = '',
}: {
  price: number;
  /** The pre-discount price, or null when nothing is on sale. */
  original?: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const onSale = original != null;

  return (
    <span className={`price price--${size} ${className}`.trim()}>
      {onSale && (
        // Labelled, or a screen reader reads two bare numbers with no hint
        // which one is being charged.
        <s className="price__was" aria-label={`${copy.was}: ${formatMoney(original)}`}>
          {formatMoney(original)}
        </s>
      )}
      <span className="price__now" aria-label={onSale ? `${copy.now}: ${formatMoney(price)}` : undefined}>
        {formatMoney(price)}
      </span>
    </span>
  );
}
