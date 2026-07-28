'use client';

import Link from 'next/link';
import { useLang } from '../../lib/i18n';

const COPY = {
  es: {
    badge: 'Próximamente',
    title: 'Tu cuenta Plantera',
    lead: 'Estamos construyendo las cuentas de cliente. Muy pronto podrás guardar favoritos, seguir tus pedidos y acumular puntos.',
    featuresTitle: 'Lo que podrás hacer',
    features: [
      {
        title: 'Seguir tus pedidos',
        copy: 'Desde que el vivero prepara tu planta hasta que llega a tu puerta.',
      },
      {
        title: 'Guardar favoritos',
        copy: 'Arma tu lista de deseos y entérate cuando vuelva a haber inventario.',
      },
      {
        title: 'Acumular Rewards',
        copy: 'Tus compras suman puntos automáticamente desde el primer día.',
      },
      {
        title: 'Guías personalizadas',
        copy: 'Recordatorios de riego y cuidado según las plantas que compraste.',
      },
    ],
    meanwhileTitle: 'Mientras tanto',
    meanwhileCopy:
      'Puedes comprar sin cuenta: añade lo que quieras al carrito y coordinamos tu pedido por WhatsApp.',
    shopCta: 'Explorar la tienda',
    rewardsCta: 'Conocer Plantera Rewards',
    contactCta: '¿Necesitas ayuda? Escríbenos →',
  },
  en: {
    badge: 'Coming soon',
    title: 'Your Plantera account',
    lead: 'We are building customer accounts. Very soon you will be able to save favorites, follow your orders, and earn points.',
    featuresTitle: 'What you will be able to do',
    features: [
      {
        title: 'Track your orders',
        copy: 'From the moment the vivero preps your plant until it reaches your door.',
      },
      {
        title: 'Save favorites',
        copy: 'Build your wishlist and hear about it when stock returns.',
      },
      {
        title: 'Earn Rewards',
        copy: 'Your purchases collect points automatically from day one.',
      },
      {
        title: 'Personalized guides',
        copy: 'Watering and care reminders based on the plants you bought.',
      },
    ],
    meanwhileTitle: 'In the meantime',
    meanwhileCopy:
      'You can shop without an account: add whatever you like to the cart and we will coordinate your order on WhatsApp.',
    shopCta: 'Explore the shop',
    rewardsCta: 'Learn about Plantera Rewards',
    contactCta: 'Need help? Write to us →',
  },
};

export default function AccountPage() {
  const { lang } = useLang();
  const copy = COPY[lang];

  return (
    <div className="container section" style={{ display: 'grid', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gap: '1rem', maxWidth: '42rem' }}>
        <span className="pill" style={{ width: 'fit-content' }}>
          {copy.badge}
        </span>
        <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 2.8rem)' }}>{copy.title}</h1>
        <p className="lead" style={{ fontSize: '1.05rem' }}>
          {copy.lead}
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>{copy.featuresTitle}</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {copy.features.map((feature, index) => (
            <div key={feature.title} className="card" style={{ display: 'grid', gap: '0.5rem' }}>
              <span className="display" style={{ color: 'var(--gold)', fontSize: '1.05rem' }}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 style={{ fontSize: '1.05rem' }}>{feature.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                {feature.copy}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gap: '0.9rem', background: 'var(--cream)' }}>
        <h2 style={{ fontSize: '1.25rem' }}>{copy.meanwhileTitle}</h2>
        <p className="lead" style={{ fontSize: '0.95rem' }}>
          {copy.meanwhileCopy}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/shop" className="btn btn--small">
            {copy.shopCta}
          </Link>
          <Link
            href="/contact"
            style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--green-700)' }}
          >
            {copy.contactCta}
          </Link>
        </div>
      </div>
    </div>
  );
}
