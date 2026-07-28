'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProductCard from '../../../components/shop/ProductCard';
import { useCart } from '../../../lib/cart';
import { useLang } from '../../../lib/i18n';
import { formatMoney } from '../../../lib/format';
import { getCareGuide } from '../../../lib/care-guides';
import {
  getCatalogItem,
  resolveImageUrl,
  splitTags,
  type CatalogDetail,
} from '../../../lib/catalog';

const COPY = {
  es: {
    back: '← Volver a la tienda',
    loading: 'Cargando…',
    notFoundTitle: 'No encontramos esta planta',
    notFoundCopy: 'Puede que ya no esté disponible en el vivero.',
    backToShop: 'Volver a la tienda',
    soldOut: 'Agotado',
    lowStock: (n: number) => `Solo quedan ${n}`,
    inStock: (n: number) => `${n} disponibles`,
    quantity: 'Cantidad',
    add: 'Añadir al carrito',
    added: 'Añadido al carrito ✓',
    soldOutCta: 'No disponible',
    from: 'De',
    careEyebrow: 'Guía de cuidado',
    careTitle: (genus: string) => `Cómo cuidar tu ${genus}`,
    light: 'Luz',
    water: 'Riego',
    soil: 'Sustrato',
    issues: 'Problemas comunes',
    difficulty: 'Dificultad',
    petSafe: 'Segura para mascotas',
    petSafeYes: 'Sí',
    petSafeNo: 'Mantener fuera de alcance',
    fullGuide: 'Ver todas las guías',
    relatedTitle: 'También te puede gustar',
    shopVivero: 'Ver todo de este vivero →',
  },
  en: {
    back: '← Back to the shop',
    loading: 'Loading…',
    notFoundTitle: 'We could not find this plant',
    notFoundCopy: 'It may no longer be available at the vivero.',
    backToShop: 'Back to the shop',
    soldOut: 'Sold out',
    lowStock: (n: number) => `Only ${n} left`,
    inStock: (n: number) => `${n} available`,
    quantity: 'Quantity',
    add: 'Add to cart',
    added: 'Added to cart ✓',
    soldOutCta: 'Unavailable',
    from: 'From',
    careEyebrow: 'Care guide',
    careTitle: (genus: string) => `How to care for your ${genus}`,
    light: 'Light',
    water: 'Water',
    soil: 'Soil',
    issues: 'Common issues',
    difficulty: 'Difficulty',
    petSafe: 'Pet safe',
    petSafeYes: 'Yes',
    petSafeNo: 'Keep out of reach',
    fullGuide: 'See all care guides',
    relatedTitle: 'You may also like',
    shopVivero: 'See everything from this vivero →',
  },
};

export default function PlantDetailPage() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const params = useParams();
  const id = Number(params.id);
  const { add, lines } = useCart();

  const [data, setData] = useState<CatalogDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (Number.isNaN(id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- invalid route param resolves immediately to the not-found view
      setState('error');
      return;
    }
    let active = true;
    getCatalogItem(id)
      .then((result) => {
        if (!active) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- product fetch keyed to the route param
        setData(result);
        setState('ready');
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [id]);

  if (state === 'loading') {
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        <p className="lead">{copy.loading}</p>
      </div>
    );
  }

  if (state === 'error' || !data) {
    return (
      <div
        className="container section"
        style={{ display: 'grid', gap: '1rem', justifyItems: 'center', textAlign: 'center' }}
      >
        <h1 style={{ fontSize: '1.8rem' }}>{copy.notFoundTitle}</h1>
        <p className="lead">{copy.notFoundCopy}</p>
        <Link href="/shop" className="btn btn--small">
          {copy.backToShop}
        </Link>
      </div>
    );
  }

  const { item, related } = data;
  const guide = getCareGuide(item.genus);
  const tags = splitTags(item.tags);
  const soldOut = item.stock <= 0;
  const inCart = lines.some((line) => line.id === item.id);

  return (
    <div className="container section" style={{ display: 'grid', gap: '3.5rem' }}>
      <Link
        href="/shop"
        style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {copy.back}
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '3rem',
          alignItems: 'start',
        }}
      >
        <div className="frame frame--45">
          {item.image_url ? (
            <img src={resolveImageUrl(item.image_url) ?? undefined} alt={item.plant_name} />
          ) : (
            <span style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--sage)' }}>
              {item.plant_name.charAt(0)}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gap: '1.25rem', alignContent: 'start' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <Link href={`/shop?vivero=${item.store_id}`} className="eyebrow eyebrow--sage">
              {item.store_name}
              {item.store_location ? ` · ${item.store_location}` : ''}
            </Link>
            <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.7rem)' }}>{item.plant_name}</h1>
            {item.genus && (
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                {item.genus}
              </span>
            )}
          </div>

          <span className="display" style={{ fontSize: '1.9rem', color: 'var(--green-700)' }}>
            {formatMoney(item.price)}
          </span>

          {item.description && <p className="lead">{item.description}</p>}

          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <span key={tag} className="chip" style={{ cursor: 'default' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <hr className="hairline" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {soldOut ? (
              <span className="badge badge--out">{copy.soldOut}</span>
            ) : item.stock < 8 ? (
              <span className="badge badge--low">{copy.lowStock(item.stock)}</span>
            ) : (
              <span className="badge badge--ok">{copy.inStock(item.stock)}</span>
            )}
          </div>

          {!soldOut && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <label className="field" style={{ width: 110 }}>
                {copy.quantity}
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={item.stock}
                  value={qty}
                  onChange={(event) =>
                    setQty(
                      Math.min(Math.max(Number(event.target.value) || 1, 1), item.stock),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="btn"
                onClick={() => add(item, qty)}
                style={{ flex: '1 1 200px', justifyContent: 'center' }}
              >
                {inCart ? copy.added : copy.add}
              </button>
            </div>
          )}

          <Link
            href={`/shop?vivero=${item.store_id}`}
            style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--green-700)' }}
          >
            {copy.shopVivero}
          </Link>
        </div>
      </div>

      {guide && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <span className="eyebrow">{copy.careEyebrow}</span>
            <h2 style={{ fontSize: '1.9rem' }}>{copy.careTitle(guide.genus)}</h2>
            <p className="lead" style={{ maxWidth: '46rem' }}>
              {guide.summary[lang]}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0 2.5rem',
            }}
          >
            {(
              [
                ['light', copy.light],
                ['water', copy.water],
                ['soil', copy.soil],
                ['commonIssues', copy.issues],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                style={{
                  padding: '1.25rem 0',
                  borderTop: '1px solid var(--line)',
                  display: 'grid',
                  gap: '0.4rem',
                  alignContent: 'start',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--gold)',
                  }}
                >
                  {label}
                </span>
                <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>
                  {guide[key][lang]}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--ink)' }}>{copy.difficulty}:</strong>{' '}
              {guide.difficulty[lang]}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--ink)' }}>{copy.petSafe}:</strong>{' '}
              {guide.petSafe ? copy.petSafeYes : copy.petSafeNo}
            </span>
            <Link
              href="/care"
              style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--green-700)' }}
            >
              {copy.fullGuide} →
            </Link>
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.6rem' }}>{copy.relatedTitle}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '2rem 1.5rem',
            }}
          >
            {related.map((relatedItem, index) => (
              <ProductCard
                key={relatedItem.id}
                item={relatedItem}
                index={index}
                stagger
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
