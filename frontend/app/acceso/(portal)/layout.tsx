'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LeafMark } from '../../components/Logo';
import LangToggle from '../../components/LangToggle';
import { useLang } from '../../lib/i18n';
import { VendorContext } from '../../lib/vendor-context';
import {
  ApiError,
  clearToken,
  getMe,
  getToken,
  vendorLogout,
  type VendorProfile,
} from '../../lib/api';

const COPY = {
  es: {
    nav: [
      { href: '/acceso', label: 'Panel' },
      { href: '/acceso/inventory', label: 'Inventario' },
      { href: '/acceso/orders', label: 'Pedidos' },
      { href: '/acceso/profile', label: 'Perfil' },
    ],
    logout: 'Cerrar sesión',
    loading: 'Cargando…',
    errLoad: 'No pudimos cargar tu cuenta. ¿Está corriendo el backend?',
    retry: 'Reintentar',
  },
  en: {
    nav: [
      { href: '/acceso', label: 'Dashboard' },
      { href: '/acceso/inventory', label: 'Inventory' },
      { href: '/acceso/orders', label: 'Orders' },
      { href: '/acceso/profile', label: 'Profile' },
    ],
    logout: 'Log out',
    loading: 'Loading…',
    errLoad: 'We could not load your account. Is the backend running?',
    retry: 'Retry',
  },
};

export default function VendorPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const handleAuthFailure = useCallback(() => {
    clearToken();
    router.replace('/acceso/login');
  }, [router]);

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await getMe());
      setState('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleAuthFailure();
        return;
      }
      setState('error');
    }
  }, [handleAuthFailure]);

  const retry = () => {
    setState('loading');
    void loadProfile();
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/acceso/login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial profile fetch on mount
    void loadProfile();
  }, [router, loadProfile]);

  const refreshProfile = useCallback(async () => {
    try {
      setProfile(await getMe());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) handleAuthFailure();
    }
  }, [handleAuthFailure]);

  const logout = async () => {
    try {
      await vendorLogout();
    } catch {
      // Unreachable server or already-revoked session; clear locally anyway.
    }
    clearToken();
    router.replace('/acceso/login');
  };

  if (state !== 'ready' || !profile) {
    return (
      <div
        className="container section"
        style={{ display: 'grid', gap: '1rem', justifyItems: 'center' }}
      >
        {state === 'error' ? (
          <>
            <p className="lead">{copy.errLoad}</p>
            <button type="button" className="btn btn--small" onClick={retry}>
              {copy.retry}
            </button>
          </>
        ) : (
          <p className="lead">{copy.loading}</p>
        )}
      </div>
    );
  }

  return (
    <VendorContext.Provider value={{ profile, refreshProfile }}>
      <div className="portal">
        <aside className="sidebar">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <Link
              href="/acceso"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
              aria-label="Plantera"
            >
              <LeafMark color="var(--sage)" />
              <span
                className="display"
                style={{ fontSize: '0.95rem', letterSpacing: '0.28em' }}
              >
                PLANTERA
              </span>
            </Link>
            <span className="sidebar__store">{profile.name}</span>
          </div>
          <nav className="sidebar__nav">
            {copy.nav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar__link${
                  pathname === link.href ? ' sidebar__link--active' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="sidebar__footer">
            <LangToggle dark />
            <button
              type="button"
              onClick={logout}
              className="btn btn--small"
              style={{
                background: 'transparent',
                border: '1px solid rgba(243,239,230,0.3)',
                color: 'var(--cream)',
                justifyContent: 'center',
              }}
            >
              {copy.logout}
            </button>
          </div>
        </aside>
        <div className="portal__content">{children}</div>
      </div>
    </VendorContext.Provider>
  );
}
