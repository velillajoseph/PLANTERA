'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Price from './Price';
import { CheckIcon, HeartIcon, PlusIcon } from './Icons';
import { useCart } from '../../lib/cart';
import { useCustomer } from '../../lib/customer-auth';
import { useLang } from '../../lib/i18n';
import { discountLabel, isOnSale } from '../../lib/pricing';
import { resolveImageUrl, type CatalogItem } from '../../lib/catalog';

/** How long the check mark stays before the button offers "add" again. */
const ADDED_FEEDBACK_MS = 1400;

const COPY = {
  es: {
    add: 'Añadir al carrito',
    added: 'Añadido al carrito',
    soldOut: 'Agotado',
    lastUnits: (n: number) => `Últimas ${n}`,
    save: 'Guardar en favoritos',
    unsave: 'Quitar de favoritos',
  },
  en: {
    add: 'Add to cart',
    added: 'Added to cart',
    soldOut: 'Sold out',
    lastUnits: (n: number) => `Only ${n} left`,
    save: 'Save to favorites',
    unsave: 'Remove from favorites',
  },
};

export default function ProductCard({
  item,
  index = 0,
  stagger = false,
}: {
  item: CatalogItem;
  index?: number;
  stagger?: boolean;
}) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const { add } = useCart();
  const { isFavorite, toggleFavorite } = useCustomer();

  // Transient, not derived from the cart: a permanent "Added ✓" leaves the
  // shopper with no way to add a second one and no sense the tap registered.
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const soldOut = item.stock <= 0;
  const saved = isFavorite(item.id);
  const onSale = isOnSale(item);

  const quickAdd = () => {
    add(item);
    setJustAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);
  };

  return (
    <article
      className={`product-card${stagger ? ' stagger-in' : ''}`}
      style={{ '--i': index } as React.CSSProperties}
    >
      <div style={{ position: 'relative' }}>
        <Link
          href={`/product/${item.id}`}
          className="frame frame--45"
          style={{ display: 'block' }}
        >
          {item.image_url ? (
            <img
              src={resolveImageUrl(item.image_url) ?? undefined}
              alt={item.plant_name}
              loading="lazy"
            />
          ) : (
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                height: '100%',
                color: 'var(--sage)',
                fontSize: '2rem',
              }}
            >
              {item.plant_name.charAt(0)}
            </span>
          )}
        </Link>

        {/* Opposite corners: the markdown is the reason to look, so it leads
            top-left, while availability is a footnote and sits out of the way
            at the bottom. Stacking them read as one confused block. */}
        {onSale && (
          <span className="badge badge--sale product-card__sale">
            {discountLabel(item.discount_percent as number)}
          </span>
        )}

        {soldOut ? (
          <span className="badge badge--out product-card__stock">{copy.soldOut}</span>
        ) : (
          item.stock < 8 && (
            <span className="badge badge--low product-card__stock">
              {copy.lastUnits(item.stock)}
            </span>
          )
        )}

        {/* Corner actions: hover-revealed on a mouse, always visible on touch. */}
        <div className="product-card__actions">
          <button
            type="button"
            className={`product-card__action${saved ? ' product-card__action--on' : ''}`}
            aria-label={saved ? copy.unsave : copy.save}
            aria-pressed={saved}
            onClick={() => void toggleFavorite(item.id)}
          >
            <HeartIcon filled={saved} />
          </button>

          {!soldOut && (
            <button
              type="button"
              className={`product-card__action product-card__action--add${
                justAdded ? ' product-card__action--done' : ''
              }`}
              aria-label={justAdded ? copy.added : copy.add}
              onClick={quickAdd}
            >
              {justAdded ? <CheckIcon /> : <PlusIcon />}
            </button>
          )}
        </div>

        <span className="visually-hidden" aria-live="polite">
          {justAdded ? `${item.plant_name}: ${copy.added}` : ''}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '0.25rem' }}>
        <span className="product-card__vivero">{item.store_name}</span>
        <Link href={`/product/${item.id}`}>
          <h3 className="product-card__name">{item.plant_name}</h3>
        </Link>
        <Price
          price={item.price}
          original={item.original_price}
          className="product-card__price"
        />
      </div>
    </article>
  );
}
