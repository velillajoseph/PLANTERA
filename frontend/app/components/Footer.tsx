'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useLang } from '../lib/i18n';

const COPY = {
  es: {
    tagline: 'Del vivero a tu puerta, en toda la isla.',
    collection: 'La colección',
    forViveros: 'Para viveros',
    contact: 'Contacto',
    dashboard: 'Demo del panel',
    vendorLogin: 'Acceso viveros',
    note: '© 2026 Plantera · Vista de demostración',
  },
  en: {
    tagline: 'From the vivero to your door, island-wide.',
    collection: 'The collection',
    forViveros: 'For viveros',
    contact: 'Contact',
    dashboard: 'Dashboard demo',
    vendorLogin: 'Vendor login',
    note: '© 2026 Plantera · Demo preview',
  },
};

export default function Footer() {
  const { lang } = useLang();
  const copy = COPY[lang];

  return (
    <footer className="dark-section" style={{ marginTop: '5rem' }}>
      <div
        className="container"
        style={{ paddingTop: '4rem', paddingBottom: '3rem' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <Logo
              leafColor="var(--sage)"
              textColor="var(--cream)"
              fontSize="1.2rem"
            />
            <p className="lead" style={{ fontSize: '0.95rem' }}>
              {copy.tagline}
            </p>
          </div>
          <nav
            style={{
              display: 'grid',
              gap: '0.6rem',
              fontSize: '0.92rem',
              fontWeight: 500,
            }}
          >
            <Link href="/pitch#coleccion">{copy.collection}</Link>
            <Link href="/pitch#para-viveros">{copy.forViveros}</Link>
            <Link href="/pitch#contacto">{copy.contact}</Link>
            <Link href="/acceso/login">{copy.vendorLogin}</Link>
            <Link href="/pitch/dashboard">{copy.dashboard}</Link>
          </nav>
          <div style={{ display: 'grid', gap: '0.6rem', fontSize: '0.92rem' }}>
            <span className="eyebrow">{copy.contact}</span>
            <a href="mailto:hola@plantera.pr">hola@plantera.pr</a>
            <span style={{ color: '#8a9488' }}>Puerto Rico</span>
          </div>
        </div>
        <hr
          className="hairline"
          style={{ borderColor: 'rgba(243,239,230,0.15)', margin: '2.5rem 0 1.25rem' }}
        />
        <p style={{ fontSize: '0.78rem', color: '#8a9488' }}>{copy.note}</p>
      </div>
    </footer>
  );
}
