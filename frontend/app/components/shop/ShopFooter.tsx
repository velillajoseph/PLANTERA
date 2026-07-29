'use client';

import Link from 'next/link';
import Logo from '../Logo';
import { useLang } from '../../lib/i18n';

const COPY = {
  es: {
    tagline: 'Del vivero a tu puerta, en toda la isla.',
    shopHeading: 'Tienda',
    all: 'Todas las plantas',
    newArrivals: 'Nuevas llegadas',
    pots: 'Macetas y accesorios',
    care: 'Guías de cuidado',
    companyHeading: 'Plantera',
    about: 'Nosotros',
    community: 'Comunidad',
    rewards: 'Rewards',
    contact: 'Contacto',
    helpHeading: 'Ayuda',
    email: 'hola@plantera.pr',
    location: 'Puerto Rico',
    rights: '© 2026 Plantera. Todos los derechos reservados.',
  },
  en: {
    tagline: 'From the vivero to your door, island-wide.',
    shopHeading: 'Shop',
    all: 'All plants',
    newArrivals: 'New arrivals',
    pots: 'Pots & supplies',
    care: 'Care guides',
    companyHeading: 'Plantera',
    about: 'About',
    community: 'Community',
    rewards: 'Rewards',
    contact: 'Contact',
    helpHeading: 'Help',
    email: 'hola@plantera.pr',
    location: 'Puerto Rico',
    rights: '© 2026 Plantera. All rights reserved.',
  },
};

export default function ShopFooter() {
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
            gap: '2.5rem',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <Logo leafColor="var(--sage)" textColor="var(--cream)" fontSize="1.2rem" />
            <p className="lead" style={{ fontSize: '0.95rem' }}>
              {copy.tagline}
            </p>
          </div>

          <nav style={{ display: 'grid', gap: '0.6rem', fontSize: '0.92rem' }}>
            <span className="eyebrow">{copy.shopHeading}</span>
            <Link href="/shop">{copy.all}</Link>
            <Link href="/shop?sort=new">{copy.newArrivals}</Link>
            <Link href="/shop?category=pot">{copy.pots}</Link>
            <Link href="/care">{copy.care}</Link>
          </nav>

          <nav style={{ display: 'grid', gap: '0.6rem', fontSize: '0.92rem' }}>
            <span className="eyebrow">{copy.companyHeading}</span>
            <Link href="/about">{copy.about}</Link>
            <Link href="/community">{copy.community}</Link>
            <Link href="/contact">{copy.contact}</Link>
          </nav>

          <div style={{ display: 'grid', gap: '0.6rem', fontSize: '0.92rem' }}>
            <span className="eyebrow">{copy.helpHeading}</span>
            <a href={`mailto:${copy.email}`}>{copy.email}</a>
            <span style={{ color: '#8a9488' }}>{copy.location}</span>
          </div>
        </div>

        <hr
          className="hairline"
          style={{ borderColor: 'rgba(243,239,230,0.15)', margin: '2.5rem 0 1.25rem' }}
        />
        <p style={{ fontSize: '0.78rem', color: '#8a9488' }}>{copy.rights}</p>
      </div>
    </footer>
  );
}
