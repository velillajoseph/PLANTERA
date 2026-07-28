'use client';

import Link from 'next/link';
import Logo from './Logo';
import LangToggle from './LangToggle';
import { useLang } from '../lib/i18n';

const NAV = [
  { href: '/pitch', label: { es: 'Inicio', en: 'Home' } },
  { href: '/pitch#coleccion', label: { es: 'Plantas', en: 'Plants' } },
  { href: '/pitch#para-viveros', label: { es: 'Para Viveros', en: 'For Viveros' } },
  { href: '/pitch#contacto', label: { es: 'Contacto', en: 'Contact' } },
];

export default function Header() {
  const { lang } = useLang();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(247,244,238,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
          paddingTop: '1.1rem',
          paddingBottom: '1.1rem',
        }}
      >
        <Logo href="/pitch" />
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.9rem',
            fontWeight: 500,
            flexWrap: 'wrap',
          }}
        >
          {NAV.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label[lang]}
            </Link>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <LangToggle />
          <Link
            href="/acceso/login"
            className="btn btn--ghost"
            style={{ padding: '0.55rem 1.2rem', fontSize: '0.82rem' }}
          >
            {lang === 'es' ? 'Acceso viveros' : 'Vendor login'}
          </Link>
        </div>
      </div>
    </header>
  );
}
