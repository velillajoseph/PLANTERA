'use client';

import Link from 'next/link';
import { UserIcon } from './Icons';
import { useLang } from '../../lib/i18n';
import { useDropdown } from '../../lib/use-dropdown';
import { useCustomer } from '../../lib/customer-auth';

const COPY = {
  es: {
    open: 'Abrir cuenta',
    greeting: 'Hola, jardinero',
    greetingNamed: (name: string) => `Hola, ${name}`,
    intro: 'Accede para guardar favoritos y seguir tus pedidos.',
    introAuthed: 'Tu jardín, en un solo lugar.',
    login: 'Iniciar sesión',
    signup: 'Crear cuenta',
    account: 'Mi cuenta',
    orders: 'Mis pedidos',
    favorites: 'Mis favoritos',
    logout: 'Cerrar sesión',
  },
  en: {
    open: 'Open account menu',
    greeting: 'Hello, gardener',
    greetingNamed: (name: string) => `Hello, ${name}`,
    intro: 'Sign in to save favorites and follow your orders.',
    introAuthed: 'Your garden, all in one place.',
    login: 'Log in',
    signup: 'Create account',
    account: 'My account',
    orders: 'My orders',
    favorites: 'My favorites',
    logout: 'Log out',
  },
};

export default function UserMenu() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const { open, closeNow, setOpen, containerRef, panelRef, hoverProps } =
    useDropdown();
  const { status, customer, openAuth, logout } = useCustomer();

  const authed = status === 'authed' && customer;

  const startAuth = (mode: 'login' | 'register') => {
    closeNow();
    openAuth(mode);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }} {...hoverProps}>
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
        ref={panelRef}
        className={`panel${open ? ' panel--open' : ''}`}
        style={{
          top: 'calc(100% + 12px)',
          right: 0,
          width: 'min(260px, 90vw)',
          padding: '1.25rem',
        }}
      >
        <p className="panel__heading">
          {authed ? copy.greetingNamed(customer.first_name) : copy.greeting}
        </p>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--muted)',
            marginBottom: '0.9rem',
          }}
        >
          {authed ? copy.introAuthed : copy.intro}
        </p>

        {authed ? (
          <>
            <div style={{ display: 'grid', paddingBottom: '0.6rem' }}>
              <Link href="/account" className="panel__item" onClick={closeNow}>
                {copy.account}
              </Link>
              <Link
                href="/account?tab=favorites"
                className="panel__item"
                onClick={closeNow}
              >
                {copy.favorites}
              </Link>
              <Link
                href="/account?tab=orders"
                className="panel__item"
                onClick={closeNow}
              >
                {copy.orders}
              </Link>
            </div>
            <hr className="hairline" />
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => {
                closeNow();
                void logout();
              }}
              style={{ justifyContent: 'center', width: '100%', marginTop: '0.75rem' }}
            >
              {copy.logout}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.9rem' }}>
              {/* Opens over the current page: no route change, so the URL never
                  advertises an auth section and scroll position survives. */}
              <button
                type="button"
                onClick={() => startAuth('login')}
                className="btn btn--small"
                style={{ justifyContent: 'center' }}
              >
                {copy.login}
              </button>
              <button
                type="button"
                onClick={() => startAuth('register')}
                className="btn btn--ghost btn--small"
                style={{ justifyContent: 'center' }}
              >
                {copy.signup}
              </button>
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
          </>
        )}
      </div>
    </div>
  );
}
