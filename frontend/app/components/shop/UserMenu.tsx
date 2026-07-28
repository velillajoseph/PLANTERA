'use client';

import Link from 'next/link';
import { UserIcon } from './Icons';
import { useLang } from '../../lib/i18n';
import { useDropdown } from '../../lib/use-dropdown';

const COPY = {
  es: {
    open: 'Abrir cuenta',
    greeting: 'Hola, jardinero',
    intro: 'Accede para guardar favoritos y seguir tus pedidos.',
    login: 'Iniciar sesión',
    signup: 'Crear cuenta',
    orders: 'Mis pedidos',
    favorites: 'Mis favoritos',
    rewards: 'Plantera Rewards',
  },
  en: {
    open: 'Open account menu',
    greeting: 'Hello, gardener',
    intro: 'Sign in to save favorites and follow your orders.',
    login: 'Log in',
    signup: 'Create account',
    orders: 'My orders',
    favorites: 'My favorites',
    rewards: 'Plantera Rewards',
  },
};

export default function UserMenu() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const { open, openNow, closeSoon, closeNow, setOpen, containerRef } =
    useDropdown();

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        className="icon-button"
        aria-label={copy.open}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <UserIcon />
      </button>

      <div
        className={`panel${open ? ' panel--open' : ''}`}
        style={{ top: 'calc(100% + 12px)', right: 0, width: 'min(260px, 90vw)', padding: '1.25rem' }}
      >
        <p className="panel__heading">{copy.greeting}</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.9rem' }}>
          {copy.intro}
        </p>
        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.9rem' }}>
          <Link
            href="/account"
            onClick={closeNow}
            className="btn btn--small"
            style={{ justifyContent: 'center' }}
          >
            {copy.login}
          </Link>
          <Link
            href="/account"
            onClick={closeNow}
            className="btn btn--ghost btn--small"
            style={{ justifyContent: 'center' }}
          >
            {copy.signup}
          </Link>
        </div>
        <hr className="hairline" />
        <div style={{ display: 'grid', paddingTop: '0.6rem' }}>
          <Link href="/account" className="panel__item" onClick={closeNow}>
            {copy.orders}
          </Link>
          <Link href="/account" className="panel__item" onClick={closeNow}>
            {copy.favorites}
          </Link>
        </div>
      </div>
    </div>
  );
}
