'use client';

// Intentionally unlinked from the storefront until the rewards programme
// launches; the page still renders if visited directly.

import Link from 'next/link';
import { useLang } from '../../lib/i18n';

const COPY = {
  es: {
    eyebrow: 'Plantera Rewards',
    badge: 'Próximamente',
    title: 'Tu jardín crece. Tus beneficios también.',
    lead: 'Un programa pensado para quienes vuelven: acumula puntos con cada compra, sube de nivel y desbloquea beneficios que de verdad importan.',
    howTitle: 'Cómo funcionará',
    steps: [
      {
        title: 'Compra como siempre',
        copy: 'Cada dólar gastado en Plantera acumula puntos automáticamente en tu cuenta.',
      },
      {
        title: 'Sube de nivel',
        copy: 'Mientras más cultivas tu jardín, mejor el nivel y mayores los beneficios.',
      },
      {
        title: 'Canjea beneficios',
        copy: 'Usa tus puntos en descuentos, envíos sin costo o plantas exclusivas de temporada.',
      },
    ],
    tiersTitle: 'Los niveles',
    tiers: [
      {
        name: 'Semilla',
        requirement: 'Desde tu primera compra',
        perks: [
          '1 punto por cada $1',
          'Guías de cuidado personalizadas',
          'Acceso a la comunidad',
        ],
      },
      {
        name: 'Brote',
        requirement: 'A partir de $250 acumulados',
        perks: [
          '1.5 puntos por cada $1',
          'Envío coordinado sin costo',
          'Acceso anticipado a nuevas llegadas',
        ],
      },
      {
        name: 'Jardín',
        requirement: 'A partir de $600 acumulados',
        perks: [
          '2 puntos por cada $1',
          'Plantas exclusivas de viveros aliados',
          'Consulta de cuidado uno a uno',
        ],
      },
    ],
    perksLabel: 'Incluye',
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      {
        q: '¿Cuándo abre el programa?',
        a: 'Estamos afinando los detalles con nuestros viveros aliados. Si creas tu cuenta ahora, tus compras contarán desde el primer día.',
      },
      {
        q: '¿Los puntos vencen?',
        a: 'La idea es que no venzan mientras tu cuenta esté activa. Confirmaremos las reglas finales antes del lanzamiento.',
      },
      {
        q: '¿Puedo acumular en compras de cualquier vivero?',
        a: 'Sí. Los puntos son de Plantera, así que suman sin importar de qué vivero aliado compres.',
      },
    ],
    ctaTitle: 'Empieza a acumular desde tu primera planta',
    ctaCopy: 'Crea tu cuenta ahora y entra al programa en cuanto abra.',
    ctaButton: 'Crear cuenta',
    shopCta: 'Explorar la tienda',
  },
  en: {
    eyebrow: 'Plantera Rewards',
    badge: 'Coming soon',
    title: 'Your garden grows. So do your perks.',
    lead: 'A program built for people who come back: earn points on every purchase, move up tiers, and unlock perks that actually matter.',
    howTitle: 'How it will work',
    steps: [
      {
        title: 'Shop as usual',
        copy: 'Every dollar spent on Plantera earns points automatically in your account.',
      },
      {
        title: 'Move up tiers',
        copy: 'The more your garden grows, the higher your tier and the better the perks.',
      },
      {
        title: 'Redeem perks',
        copy: 'Spend points on discounts, free coordinated delivery, or exclusive seasonal plants.',
      },
    ],
    tiersTitle: 'The tiers',
    tiers: [
      {
        name: 'Seed',
        requirement: 'From your first purchase',
        perks: ['1 point per $1', 'Personalized care guides', 'Community access'],
      },
      {
        name: 'Sprout',
        requirement: 'From $250 lifetime',
        perks: [
          '1.5 points per $1',
          'Free coordinated delivery',
          'Early access to new arrivals',
        ],
      },
      {
        name: 'Garden',
        requirement: 'From $600 lifetime',
        perks: [
          '2 points per $1',
          'Exclusive plants from partner viveros',
          'One-on-one care consultation',
        ],
      },
    ],
    perksLabel: 'Includes',
    faqTitle: 'Frequently asked',
    faqs: [
      {
        q: 'When does the program open?',
        a: 'We are finalizing details with our partner viveros. If you create an account now, your purchases will count from day one.',
      },
      {
        q: 'Do points expire?',
        a: 'The intent is that they do not expire while your account is active. We will confirm final rules before launch.',
      },
      {
        q: 'Can I earn on any vivero’s products?',
        a: 'Yes. Points are Plantera-wide, so they add up no matter which partner vivero you buy from.',
      },
    ],
    ctaTitle: 'Start earning from your first plant',
    ctaCopy: 'Create your account now and join the program the moment it opens.',
    ctaButton: 'Create account',
    shopCta: 'Explore the shop',
  },
};

export default function RewardsPage() {
  const { lang } = useLang();
  const copy = COPY[lang];

  return (
    <div>
      <section className="section" style={{ paddingBottom: '1.5rem' }}>
        <div
          className="container"
          style={{ display: 'grid', gap: '1.25rem', maxWidth: '46rem' }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="eyebrow">{copy.eyebrow}</span>
            <span className="pill">{copy.badge}</span>
          </div>
          <h1 className="page-title">{copy.title}</h1>
          <p className="lead" style={{ fontSize: '1.05rem' }}>
            {copy.lead}
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
          <h2 className="section-title">{copy.howTitle}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
              gap: '1.25rem',
            }}
          >
            {copy.steps.map((step, index) => (
              <div key={step.title} className="card" style={{ display: 'grid', gap: '0.55rem' }}>
                <span className="display" style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 style={{ fontSize: '1.08rem' }}>{step.title}</h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                  {step.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
          <h2 className="section-title">{copy.tiersTitle}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
              gap: '1.25rem',
            }}
          >
            {copy.tiers.map((tier, index) => (
              <div
                key={tier.name}
                className="card"
                style={{
                  display: 'grid',
                  gap: '0.9rem',
                  alignContent: 'start',
                  borderColor: index === 1 ? 'var(--gold)' : 'var(--line)',
                }}
              >
                <div style={{ display: 'grid', gap: '0.3rem' }}>
                  <h3 className="display section-title">
                    {tier.name}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--sage)' }}>
                    {tier.requirement}
                  </span>
                </div>
                <hr className="hairline" />
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <span className="panel__heading" style={{ marginBottom: 0 }}>
                    {copy.perksLabel}
                  </span>
                  {tier.perks.map((perk) => (
                    <span
                      key={perk}
                      style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.5 }}
                    >
                      · {perk}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="container" style={{ display: 'grid', gap: '1.25rem', maxWidth: '46rem' }}>
          <h2 className="section-title">{copy.faqTitle}</h2>
          <div style={{ display: 'grid' }}>
            {copy.faqs.map((faq) => (
              <div
                key={faq.q}
                style={{
                  padding: '1.15rem 0',
                  borderTop: '1px solid var(--line)',
                  display: 'grid',
                  gap: '0.4rem',
                }}
              >
                <h3 style={{ fontSize: '1.02rem' }}>{faq.q}</h3>
                <p style={{ fontSize: '0.93rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                  {faq.a}
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
            gap: '1.25rem',
            justifyItems: 'center',
            textAlign: 'center',
            maxWidth: '36rem',
          }}
        >
          <h2 className="section-title">{copy.ctaTitle}</h2>
          <p className="lead">{copy.ctaCopy}</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/account" className="btn btn--cream">
              {copy.ctaButton}
            </Link>
            <Link
              href="/shop"
              style={{ alignSelf: 'center', color: 'var(--sage)', fontWeight: 600, fontSize: '0.9rem' }}
            >
              {copy.shopCta} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
