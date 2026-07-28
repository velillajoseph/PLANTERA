'use client';

import Link from 'next/link';
import { useCart } from '../../lib/cart';
import { useLang } from '../../lib/i18n';
import { formatMoney } from '../../lib/format';
import { resolveImageUrl, type CatalogItem } from '../../lib/catalog';

const COPY = {
  es: {
    add: 'Añadir al carrito',
    added: 'Añadido ✓',
    soldOut: 'Agotado',
    lastUnits: (n: number) => `Últimas ${n}`,
  },
  en: {
    add: 'Add to cart',
    added: 'Added ✓',
    soldOut: 'Sold out',
    lastUnits: (n: number) => `Only ${n} left`,
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
  const { add, lines } = useCart();

  const inCart = lines.some((line) => line.id === item.id);
  const soldOut = item.stock <= 0;

  return (
    <article
      className={`product-card${stagger ? ' stagger-in' : ''}`}
      style={{ '--i': index } as React.CSSProperties}
    >
      <div style={{ position: 'relative' }}>
        <Link href={`/plant/${item.id}`} className="frame frame--45" style={{ display: 'block' }}>
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

        {soldOut ? (
          <span
            className="badge badge--out"
            style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', background: 'var(--surface)' }}
          >
            {copy.soldOut}
          </span>
        ) : (
          item.stock < 8 && (
            <span
              className="badge badge--low"
              style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', background: 'var(--surface)' }}
            >
              {copy.lastUnits(item.stock)}
            </span>
          )
        )}

        {!soldOut && (
          <button
            type="button"
            className="btn btn--small product-card__add"
            style={{ justifyContent: 'center' }}
            onClick={() => add(item)}
          >
            {inCart ? copy.added : copy.add}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gap: '0.25rem' }}>
        <span className="product-card__vivero">{item.store_name}</span>
        <Link href={`/plant/${item.id}`}>
          <h3 className="product-card__name">{item.plant_name}</h3>
        </Link>
        <span className="product-card__price">{formatMoney(item.price)}</span>
      </div>
    </article>
  );
}
