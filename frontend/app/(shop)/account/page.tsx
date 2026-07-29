'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import AccountDashboard from './AccountDashboard';
import { useLang } from '../../lib/i18n';
import { useCustomer } from '../../lib/customer-auth';

const COPY = {
  es: {
    badge: 'Tu cuenta',
    title: 'Entra a tu cuenta Plantera',
    lead: 'Guarda tus favoritos, sigue tus pedidos y recibe guías de cuidado para las plantas que compraste.',
    login: 'Iniciar sesión',
    signup: 'Crear cuenta',
    loading: 'Cargando…',
    featuresTitle: 'Lo que puedes hacer',
    features: [
      {
        title: 'Guardar favoritos',
        copy: 'Arma tu lista de deseos y vuelve a ella desde cualquier dispositivo.',
      },
      {
        title: 'Seguir tus pedidos',
        copy: 'Desde que el vivero prepara tu planta hasta que llega a tu puerta.',
      },
      {
        title: 'Guías personalizadas',
        copy: 'Recordatorios de riego y cuidado según las plantas que compraste.',
      },
    ],
    meanwhileTitle: 'También puedes comprar sin cuenta',
    meanwhileCopy:
      'Añade lo que quieras al carrito y coordinamos tu pedido por WhatsApp.',
    shopCta: 'Explorar la tienda',
    contactCta: '¿Necesitas ayuda? Escríbenos →',
  },
  en: {
    badge: 'Your account',
    title: 'Sign in to your Plantera account',
    lead: 'Save your favorites, follow your orders, and get care guides for the plants you bought.',
    login: 'Sign in',
    signup: 'Create account',
    loading: 'Loading…',
    featuresTitle: 'What you can do',
    features: [
      {
        title: 'Save favorites',
        copy: 'Build your wish list and come back to it from any device.',
      },
      {
        title: 'Follow your orders',
        copy: 'From the moment the vivero prepares your plant until it reaches your door.',
      },
      {
        title: 'Personalized guides',
        copy: 'Watering and care reminders based on the plants you bought.',
      },
    ],
    meanwhileTitle: 'You can also shop without an account',
    meanwhileCopy:
      'Add whatever you like to the cart and we will coordinate your order over WhatsApp.',
    shopCta: 'Browse the shop',
    contactCta: 'Need help? Get in touch →',
  },
};

function AccountContent() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const { status, customer, openAuth } = useCustomer();

  if (status === 'loading') {
    return (
      <div className="container section">
        <p className="lead">{copy.loading}</p>
      </div>
    );
  }

  if (status === 'authed' && customer) {
    return <AccountDashboard customer={customer} />;
  }

  // Signed out renders in place at the same URL — there is no /login route to
  // discover, and the modal handles the actual sign-in.
  return (
    <div className="container section" style={{ display: 'grid', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gap: '1rem', maxWidth: '42rem' }}>
        <span className="pill" style={{ width: 'fit-content' }}>
          {copy.badge}
        </span>
        <h1 className="page-title">{copy.title}</h1>
        <p className="lead" style={{ fontSize: '1.05rem' }}>
          {copy.lead}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn" onClick={() => openAuth('login')}>
            {copy.login}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => openAuth('register')}
          >
            {copy.signup}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem' }}>{copy.featuresTitle}</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
            gap: '1.25rem',
          }}
        >
          {copy.features.map((feature) => (
            <div key={feature.title} className="card" style={{ display: 'grid', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem' }}>{feature.title}</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                {feature.copy}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gap: '0.75rem', justifyItems: 'start' }}>
        <h2 style={{ fontSize: '1.2rem' }}>{copy.meanwhileTitle}</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{copy.meanwhileCopy}</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/shop" className="btn btn--small">
            {copy.shopCta}
          </Link>
          <Link href="/contact" style={{ color: 'var(--green-700)', fontWeight: 600 }}>
            {copy.contactCta}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  // AccountDashboard reads ?tab= via useSearchParams, which needs a Suspense
  // boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <AccountContent />
    </Suspense>
  );
}
