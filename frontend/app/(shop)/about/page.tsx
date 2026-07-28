'use client';

import Link from 'next/link';
import { useLang } from '../../lib/i18n';

const STORY_IMAGE =
  'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=1100&q=80';
const TEAM_IMAGE =
  'https://images.unsplash.com/photo-1615671524827-c1fe3973b648?w=1000&q=80';

const COPY = {
  es: {
    eyebrow: 'Nuestra misión',
    title: 'Que comprar plantas en Puerto Rico sea tan bueno como visitarlas.',
    lead: 'Plantera nació de una frustración sencilla: la isla está llena de viveros extraordinarios, pero encontrarlos y comprarles en línea era casi imposible.',
    storyTitle: 'El problema que estamos resolviendo',
    storyBody: [
      'Comprar una planta en línea en Puerto Rico normalmente significa un anuncio borroso en Facebook Marketplace, sin precio claro, sin saber quién la cultivó y sin idea de cómo cuidarla cuando llegue.',
      'Mientras tanto, los viveros locales —familias que llevan décadas cultivando— compiten con cadenas grandes sin tener una tienda en línea propia, ni fotografía profesional, ni forma de llegar a compradores fuera de su pueblo.',
      'Plantera existe para cerrar esa brecha: le damos al vivero la tienda que no puede construir solo, y al comprador la confianza que la isla merecía hace años.',
    ],
    valuesTitle: 'En lo que creemos',
    values: [
      {
        title: 'El vivero primero',
        copy: 'No somos un intermediario anónimo. Cada planta lleva el nombre del vivero que la cultivó, y la mayor parte de cada venta se queda con ellos.',
      },
      {
        title: 'Honestidad visual',
        copy: 'Fotografiamos las plantas como son. Sin renders, sin fotos de catálogo extranjero, sin sorpresas al abrir la caja.',
      },
      {
        title: 'Cuidado como servicio',
        copy: 'Vender una planta sin enseñar a cuidarla es venderla dos veces. Cada listado incluye su guía para el clima del Caribe.',
      },
      {
        title: 'Dinero que se queda aquí',
        copy: 'Cada compra sostiene a un vivero puertorriqueño y al empleo local que genera.',
      },
    ],
    growersTitle: 'Construido con los viveros, no sobre ellos',
    growersBody:
      'Trabajamos directamente con cada vivero aliado: los visitamos, fotografiamos su inventario y les damos un panel donde controlan sus precios y disponibilidad en tiempo real. Ellos siguen siendo los expertos; nosotros ponemos la tecnología.',
    ctaTitle: '¿Tienes un vivero?',
    ctaBody:
      'Estamos sumando viveros aliados en toda la isla. Escríbenos y conversamos.',
    ctaButton: 'Hablar con Plantera',
    shopCta: 'Explorar la tienda',
  },
  en: {
    eyebrow: 'Our mission',
    title: 'Make buying plants in Puerto Rico as good as visiting them.',
    lead: 'Plantera started from a simple frustration: the island is full of extraordinary nurseries, but finding them and buying online was nearly impossible.',
    storyTitle: 'The problem we are solving',
    storyBody: [
      'Buying a plant online in Puerto Rico usually means a blurry Facebook Marketplace post with no clear price, no idea who grew it, and no guidance on how to keep it alive once it arrives.',
      'Meanwhile local viveros — families who have been growing for decades — compete with big chains without an online store of their own, without professional photography, and with no way to reach buyers beyond their own town.',
      'Plantera exists to close that gap: we give the vivero the storefront they cannot build alone, and the buyer the confidence the island deserved years ago.',
    ],
    valuesTitle: 'What we believe',
    values: [
      {
        title: 'The vivero comes first',
        copy: 'We are not an anonymous middleman. Every plant carries the name of the vivero that grew it, and most of every sale stays with them.',
      },
      {
        title: 'Visual honesty',
        copy: 'We photograph plants as they are. No renders, no foreign catalog stock photos, no surprises when the box opens.',
      },
      {
        title: 'Care as a service',
        copy: 'Selling a plant without teaching care is selling it twice. Every listing includes its guide for the Caribbean climate.',
      },
      {
        title: 'Money that stays here',
        copy: 'Every purchase sustains a Puerto Rican vivero and the local jobs it creates.',
      },
    ],
    growersTitle: 'Built with growers, not on top of them',
    growersBody:
      'We work directly with every partner vivero: we visit them, photograph their inventory, and give them a dashboard where they control pricing and availability in real time. They remain the experts; we bring the technology.',
    ctaTitle: 'Run a vivero?',
    ctaBody: 'We are adding partner viveros across the island. Write to us and let’s talk.',
    ctaButton: 'Talk to Plantera',
    shopCta: 'Explore the shop',
  },
};

export default function AboutPage() {
  const { lang } = useLang();
  const copy = COPY[lang];

  return (
    <div>
      <section className="section" style={{ paddingBottom: '2rem' }}>
        <div className="container" style={{ display: 'grid', gap: '1.25rem', maxWidth: '48rem' }}>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1 style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.1rem)' }}>{copy.title}</h1>
          <p className="lead" style={{ fontSize: '1.1rem' }}>
            {copy.lead}
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="frame frame--32" style={{ maxHeight: '440px' }}>
            <img src={STORY_IMAGE} alt={copy.storyTitle} />
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem',
          }}
        >
          <h2 style={{ fontSize: '1.9rem' }}>{copy.storyTitle}</h2>
          <div style={{ display: 'grid', gap: '1.1rem' }}>
            {copy.storyBody.map((paragraph) => (
              <p key={paragraph} className="lead">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="container" style={{ display: 'grid', gap: '1.75rem' }}>
          <h2 style={{ fontSize: '1.9rem' }}>{copy.valuesTitle}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {copy.values.map((value, index) => (
              <div key={value.title} className="card" style={{ display: 'grid', gap: '0.55rem' }}>
                <span className="display" style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 style={{ fontSize: '1.1rem' }}>{value.title}</h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                  {value.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dark-section section">
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '2rem' }}>{copy.growersTitle}</h2>
            <p className="lead">{copy.growersBody}</p>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <Link href="/shop" className="btn btn--cream">
                {copy.shopCta}
              </Link>
            </div>
          </div>
          <div className="frame frame--32">
            <img src={TEAM_IMAGE} alt={copy.growersTitle} />
          </div>
        </div>
      </section>

      <section className="section">
        <div
          className="container"
          style={{
            display: 'grid',
            gap: '1rem',
            justifyItems: 'center',
            textAlign: 'center',
            maxWidth: '38rem',
          }}
        >
          <h2 style={{ fontSize: '1.8rem' }}>{copy.ctaTitle}</h2>
          <p className="lead">{copy.ctaBody}</p>
          <Link href="/contact" className="btn">
            {copy.ctaButton}
          </Link>
        </div>
      </section>
    </div>
  );
}
