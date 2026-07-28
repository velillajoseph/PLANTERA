'use client';

import Link from 'next/link';
import { CaretIcon } from './Icons';
import { useLang } from '../../lib/i18n';
import { useDropdown } from '../../lib/use-dropdown';
import type { CatalogFacets } from '../../lib/catalog';

const COPY = {
  es: {
    shop: 'Tienda',
    browse: 'Explorar',
    all: 'Todas las plantas',
    newArrivals: 'Nuevas llegadas',
    pots: 'Macetas y accesorios',
    genus: 'Por género',
    viveros: 'Por vivero',
    allGenera: 'Ver todos los géneros',
    allViveros: 'Ver todos los viveros',
    featureTitle: 'Cuidado incluido',
    featureCopy:
      'Cada planta llega con su guía de cuidado escrita para el clima de la isla.',
    featureCta: 'Ver guías de cuidado',
    items: (n: number) => `${n} artículos`,
  },
  en: {
    shop: 'Shop',
    browse: 'Browse',
    all: 'All plants',
    newArrivals: 'New arrivals',
    pots: 'Pots & supplies',
    genus: 'By genus',
    viveros: 'By vivero',
    allGenera: 'See all genera',
    allViveros: 'See all viveros',
    featureTitle: 'Care included',
    featureCopy:
      'Every plant ships with a care guide written for the island climate.',
    featureCta: 'See care guides',
    items: (n: number) => `${n} items`,
  },
};

export default function ShopMegaMenu({ facets }: { facets: CatalogFacets | null }) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const { open, closeNow, setOpen, containerRef, panelRef, hoverProps } =
    useDropdown();

  const genera = facets?.genera.slice(0, 6) ?? [];
  const viveros = facets?.viveros.slice(0, 4) ?? [];

  return (
    <div
      ref={containerRef}
      {...hoverProps}
      style={{ position: 'static' }}
    >
      <button
        type="button"
        className="shop-nav__link"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        {copy.shop}
        <CaretIcon />
      </button>

      <div
        ref={panelRef}
        className={`panel${open ? ' panel--open' : ''}`}
        style={{
          top: 'calc(100% + 1px)',
          left: '50%',
          transform: open
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(-8px)',
          width: 'min(940px, calc(100vw - 3rem))',
          padding: '2rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '2rem',
          }}
        >
          <div>
            <p className="panel__heading">{copy.browse}</p>
            <Link href="/shop" className="panel__item" onClick={closeNow}>
              {copy.all}
            </Link>
            <Link href="/shop?sort=new" className="panel__item" onClick={closeNow}>
              {copy.newArrivals}
            </Link>
            <Link
              href="/shop?category=pot"
              className="panel__item"
              onClick={closeNow}
            >
              {copy.pots}
            </Link>
          </div>

          <div>
            <p className="panel__heading">{copy.genus}</p>
            {genera.map((genus) => (
              <Link
                key={genus}
                href={`/shop?genus=${encodeURIComponent(genus)}`}
                className="panel__item"
                onClick={closeNow}
              >
                {genus}
              </Link>
            ))}
            <Link
              href="/shop"
              className="panel__item"
              onClick={closeNow}
              style={{ color: 'var(--green-700)', fontWeight: 600 }}
            >
              {copy.allGenera}
            </Link>
          </div>

          <div>
            <p className="panel__heading">{copy.viveros}</p>
            {viveros.map((vivero) => (
              <Link
                key={vivero.id}
                href={`/shop?vivero=${vivero.id}`}
                className="panel__item"
                onClick={closeNow}
              >
                {vivero.name}
                <span style={{ color: 'var(--sage)', fontSize: '0.78rem' }}>
                  {' '}
                  · {copy.items(vivero.item_count)}
                </span>
              </Link>
            ))}
            <Link
              href="/shop"
              className="panel__item"
              onClick={closeNow}
              style={{ color: 'var(--green-700)', fontWeight: 600 }}
            >
              {copy.allViveros}
            </Link>
          </div>

          <div
            style={{
              background: 'var(--cream)',
              borderRadius: '8px',
              padding: '1.25rem',
              display: 'grid',
              gap: '0.5rem',
              alignContent: 'start',
            }}
          >
            <p className="panel__heading" style={{ marginBottom: 0 }}>
              {copy.featureTitle}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.55 }}>
              {copy.featureCopy}
            </p>
            <Link
              href="/care"
              onClick={closeNow}
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--green-700)',
              }}
            >
              {copy.featureCta} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
