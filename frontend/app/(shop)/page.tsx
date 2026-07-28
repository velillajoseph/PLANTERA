'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PaginatedGrid from '../components/shop/PaginatedGrid';
import { useLang } from '../lib/i18n';
import {
  getCatalog,
  sortByNewest,
  type CatalogItem,
  type CatalogVivero,
} from '../lib/catalog';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1545241047-6083a3684587?w=1200&q=80';
const CARE_IMAGE =
  'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1000&q=80';
const VIVERO_IMAGE =
  'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=1000&q=80';

const COPY = {
  es: {
    heroEyebrow: 'Viveros locales · Puerto Rico',
    heroTitle: 'Plantas que llegan vivas, cuidadas y listas.',
    heroLead:
      'Compra directamente de los viveros de la isla. Fotos reales, guías de cuidado escritas para nuestro clima y entrega coordinada hasta tu puerta.',
    heroCta: 'Comprar plantas',
    heroCtaAlt: 'Ver guías de cuidado',
    heroAlt: 'Monstera en un interior luminoso',
    categoriesEyebrow: 'Explora',
    categoryPlants: 'Plantas',
    categoryPlantsCopy: 'Tropicales, suculentas y follaje para tu espacio.',
    categoryNew: 'Nuevas llegadas',
    categoryNewCopy: 'Lo último que entró a nuestros viveros aliados.',
    categoryPots: 'Macetas y accesorios',
    categoryPotsCopy: 'Barro, cerámica, sustratos y herramientas.',
    categoryViveros: 'Por vivero',
    categoryViverosCopy: 'Conoce quién cultiva cada planta.',
    featuredEyebrow: 'Destacadas',
    featuredTitle: 'Nuestra selección',
    featuredLead:
      'Una muestra viva del inventario de nuestros viveros aliados — actualizado por ellos mismos.',
    featuredCta: 'Ver toda la tienda →',
    loading: 'Cargando la tienda…',
    errorTitle: 'No pudimos cargar la tienda',
    errorCopy:
      'Revisa que el servidor esté corriendo e inténtalo de nuevo en un momento.',
    retry: 'Reintentar',
    viverosEyebrow: 'Nuestros viveros',
    viverosTitle: 'Cultivado en la isla, por gente de la isla.',
    viverosLead:
      'Cada planta en Plantera viene de un vivero local que la sembró y la cuidó. Cuando compras aquí, ese dinero se queda en Puerto Rico.',
    viverosCta: 'Comprar por vivero',
    items: (n: number) => (n === 1 ? '1 artículo' : `${n} artículos`),
    careEyebrow: 'Cuidado incluido',
    careTitle: 'Nunca más adivines cómo cuidarla.',
    careLead:
      'Cada planta llega con su guía: luz, riego, sustrato y los problemas más comunes, escritos para el clima del Caribe.',
    careCta: 'Ver guías de cuidado',
    valuesTitle: 'Por qué Plantera',
    values: [
      {
        title: 'Fotos reales',
        copy: 'Fotografiamos cada planta. Lo que ves es lo que llega.',
      },
      {
        title: 'Entrega coordinada',
        copy: 'Coordinamos la entrega contigo y con el vivero, sin sorpresas.',
      },
      {
        title: 'Viveros verificados',
        copy: 'Trabajamos solo con viveros locales que conocemos y visitamos.',
      },
    ],
  },
  en: {
    heroEyebrow: 'Local viveros · Puerto Rico',
    heroTitle: 'Plants that arrive alive, cared for, and ready.',
    heroLead:
      'Buy straight from the island’s nurseries. Real photos, care guides written for our climate, and delivery coordinated to your door.',
    heroCta: 'Shop plants',
    heroCtaAlt: 'See care guides',
    heroAlt: 'Monstera in a bright interior',
    categoriesEyebrow: 'Explore',
    categoryPlants: 'Plants',
    categoryPlantsCopy: 'Tropicals, succulents, and foliage for your space.',
    categoryNew: 'New arrivals',
    categoryNewCopy: 'The latest to land at our partner viveros.',
    categoryPots: 'Pots & supplies',
    categoryPotsCopy: 'Terracotta, ceramic, soil mixes, and tools.',
    categoryViveros: 'By vivero',
    categoryViverosCopy: 'Meet who grows each plant.',
    featuredEyebrow: 'Featured',
    featuredTitle: 'Our selection',
    featuredLead:
      'A live sample of our partner viveros’ inventory — kept current by the growers themselves.',
    featuredCta: 'Browse the whole shop →',
    loading: 'Loading the shop…',
    errorTitle: 'We could not load the shop',
    errorCopy: 'Check that the server is running and try again in a moment.',
    retry: 'Retry',
    viverosEyebrow: 'Our viveros',
    viverosTitle: 'Grown on the island, by island people.',
    viverosLead:
      'Every plant on Plantera comes from a local vivero that planted and raised it. When you buy here, that money stays in Puerto Rico.',
    viverosCta: 'Shop by vivero',
    items: (n: number) => (n === 1 ? '1 item' : `${n} items`),
    careEyebrow: 'Care included',
    careTitle: 'Never guess how to keep it alive again.',
    careLead:
      'Every plant comes with its guide: light, water, soil, and the most common problems, written for the Caribbean climate.',
    careCta: 'See care guides',
    valuesTitle: 'Why Plantera',
    values: [
      {
        title: 'Real photos',
        copy: 'We photograph every plant. What you see is what arrives.',
      },
      {
        title: 'Coordinated delivery',
        copy: 'We coordinate delivery with you and the vivero — no surprises.',
      },
      {
        title: 'Verified viveros',
        copy: 'We work only with local nurseries we know and visit.',
      },
    ],
  },
};

export default function ShopHomePage() {
  const { lang } = useLang();
  const copy = COPY[lang];

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [viveros, setViveros] = useState<CatalogVivero[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = () => {
    setState('loading');
    getCatalog()
      .then((data) => {
        setItems(data.items);
        setViveros(data.facets.viveros);
        setState('ready');
      })
      .catch(() => setState('error'));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial catalog fetch on mount
    load();
  }, []);

  const featured = useMemo(() => {
    const plants = items.filter((item) => item.category === 'plant');
    const highlighted = plants.filter((item) => item.is_featured);
    return sortByNewest(highlighted.length >= 4 ? highlighted : plants);
  }, [items]);

  const categories = [
    { href: '/shop', title: copy.categoryPlants, copy: copy.categoryPlantsCopy },
    { href: '/shop?sort=new', title: copy.categoryNew, copy: copy.categoryNewCopy },
    { href: '/shop?category=pot', title: copy.categoryPots, copy: copy.categoryPotsCopy },
    { href: '/shop', title: copy.categoryViveros, copy: copy.categoryViverosCopy },
  ];

  return (
    <div>
      <section className="section" style={{ paddingBottom: '2rem' }}>
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <div className="reveal" style={{ display: 'grid', gap: '1.5rem' }}>
            <span className="eyebrow">{copy.heroEyebrow}</span>
            <h1 style={{ fontSize: 'clamp(2.3rem, 5vw, 3.4rem)' }}>
              {copy.heroTitle}
            </h1>
            <p className="lead" style={{ maxWidth: '34rem' }}>
              {copy.heroLead}
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <Link href="/shop" className="btn">
                {copy.heroCta}
              </Link>
              <Link href="/care" className="btn btn--ghost">
                {copy.heroCtaAlt}
              </Link>
            </div>
          </div>
          <div className="frame frame--45" style={{ maxHeight: '560px' }}>
            <img src={HERO_IMAGE} alt={copy.heroAlt} />
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
        <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
          <span className="eyebrow">{copy.categoriesEyebrow}</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="card"
                style={{ display: 'grid', gap: '0.4rem', alignContent: 'start' }}
              >
                <h3 style={{ fontSize: '1.15rem' }}>{category.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.55 }}>
                  {category.copy}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="destacadas" className="section" style={{ paddingTop: '2rem' }}>
        <div className="container" style={{ display: 'grid', gap: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <span className="eyebrow">{copy.featuredEyebrow}</span>
              <h2 style={{ fontSize: '2.1rem' }}>{copy.featuredTitle}</h2>
              <p className="lead" style={{ maxWidth: '38rem' }}>
                {copy.featuredLead}
              </p>
            </div>
            <Link
              href="/shop"
              style={{ fontWeight: 600, color: 'var(--green-700)', fontSize: '0.92rem' }}
            >
              {copy.featuredCta}
            </Link>
          </div>

          {state === 'loading' && (
            <p className="lead" style={{ textAlign: 'center', padding: '3rem 0' }}>
              {copy.loading}
            </p>
          )}

          {state === 'error' && (
            <div
              className="card"
              style={{ display: 'grid', gap: '0.9rem', justifyItems: 'center', textAlign: 'center' }}
            >
              <h3 style={{ fontSize: '1.2rem' }}>{copy.errorTitle}</h3>
              <p className="lead" style={{ fontSize: '0.95rem' }}>
                {copy.errorCopy}
              </p>
              <button type="button" className="btn btn--small" onClick={load}>
                {copy.retry}
              </button>
            </div>
          )}

          {state === 'ready' && <PaginatedGrid items={featured} pageSize={8} />}
        </div>
      </section>

      <section className="dark-section section">
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <span className="eyebrow">{copy.viverosEyebrow}</span>
            <h2 style={{ fontSize: '2.2rem' }}>{copy.viverosTitle}</h2>
            <p className="lead">{copy.viverosLead}</p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {viveros.map((vivero) => (
                <Link
                  key={vivero.id}
                  href={`/shop?vivero=${vivero.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.9rem 0',
                    borderTop: '1px solid rgba(243,239,230,0.15)',
                  }}
                >
                  <span>
                    <span style={{ fontWeight: 600 }}>{vivero.name}</span>
                    {vivero.location && (
                      <span style={{ color: '#8a9488', fontSize: '0.85rem' }}>
                        {' '}
                        · {vivero.location}
                      </span>
                    )}
                  </span>
                  <span style={{ color: 'var(--sage)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {copy.items(vivero.item_count)} →
                  </span>
                </Link>
              ))}
            </div>
            <div>
              <Link href="/shop" className="btn btn--cream">
                {copy.viverosCta}
              </Link>
            </div>
          </div>
          <div className="frame frame--45" style={{ maxHeight: '520px' }}>
            <img src={VIVERO_IMAGE} alt={copy.viverosEyebrow} />
          </div>
        </div>
      </section>

      <section className="section">
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <div className="frame frame--32">
            <img src={CARE_IMAGE} alt={copy.careTitle} />
          </div>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <span className="eyebrow">{copy.careEyebrow}</span>
            <h2 style={{ fontSize: '2rem' }}>{copy.careTitle}</h2>
            <p className="lead">{copy.careLead}</p>
            <div>
              <Link href="/care" className="btn btn--ghost">
                {copy.careCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.6rem' }}>{copy.valuesTitle}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {copy.values.map((value, index) => (
              <div key={value.title} className="card" style={{ display: 'grid', gap: '0.5rem' }}>
                <span className="display" style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 style={{ fontSize: '1.1rem' }}>{value.title}</h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                  {value.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
