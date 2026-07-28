'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Drawer from '../Drawer';
import Logo from '../Logo';
import LangToggle from '../LangToggle';
import { CaretIcon, SearchIcon } from './Icons';
import { useLang } from '../../lib/i18n';
import type { CatalogFacets } from '../../lib/catalog';

const COPY = {
  es: {
    label: 'Menú',
    close: 'Cerrar menú',
    searchPlaceholder: 'Buscar plantas, macetas…',
    search: 'Buscar',
    shop: 'Tienda',
    all: 'Todas las plantas',
    newArrivals: 'Nuevas llegadas',
    pots: 'Macetas y accesorios',
    genus: 'Por género',
    vivero: 'Por vivero',
    nav: [
      { href: '/about', label: 'Nosotros' },
      { href: '/care', label: 'Cuidado' },
      { href: '/community', label: 'Comunidad' },
      { href: '/contact', label: 'Contacto' },
    ],
    account: 'Iniciar sesión',
    language: 'Idioma',
  },
  en: {
    label: 'Menu',
    close: 'Close menu',
    searchPlaceholder: 'Search plants, pots…',
    search: 'Search',
    shop: 'Shop',
    all: 'All plants',
    newArrivals: 'New arrivals',
    pots: 'Pots & supplies',
    genus: 'By genus',
    vivero: 'By vivero',
    nav: [
      { href: '/about', label: 'About' },
      { href: '/care', label: 'Care' },
      { href: '/community', label: 'Community' },
      { href: '/contact', label: 'Contact' },
    ],
    account: 'Log in',
    language: 'Language',
  },
};

function Accordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="drawer-link drawer-link--sub"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        style={{ fontWeight: 500 }}
      >
        {title}
        <span
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .25s cubic-bezier(.22,1,.36,1)',
            display: 'inline-flex',
          }}
        >
          <CaretIcon />
        </span>
      </button>
      <div className={`drawer-accordion${open ? ' drawer-accordion--open' : ''}`}>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default function MobileNavDrawer({
  open,
  onClose,
  facets,
}: {
  open: boolean;
  onClose: () => void;
  facets: CatalogFacets | null;
}) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [shopOpen, setShopOpen] = useState(true);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    setQuery('');
    go(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
  };

  return (
    <Drawer open={open} onClose={onClose} side="left" label={copy.label}>
      <div className="drawer__head">
        <Logo fontSize="0.95rem" />
        <button
          type="button"
          className="icon-button"
          aria-label={copy.close}
          onClick={onClose}
          style={{ fontSize: '1.4rem', lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <div className="drawer__body">
        <form
          onSubmit={submitSearch}
          style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
        >
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.search}
            enterKeyHint="search"
          />
          <button
            type="submit"
            className="icon-button"
            aria-label={copy.search}
            style={{ flexShrink: 0 }}
          >
            <SearchIcon />
          </button>
        </form>

        <div className="drawer-section">
          <button
            type="button"
            className="drawer-link"
            aria-expanded={shopOpen}
            onClick={() => setShopOpen((value) => !value)}
          >
            <span style={{ fontWeight: 600 }}>{copy.shop}</span>
            <span
              style={{
                transform: shopOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform .25s cubic-bezier(.22,1,.36,1)',
                display: 'inline-flex',
              }}
            >
              <CaretIcon />
            </span>
          </button>

          <div
            className={`drawer-accordion${shopOpen ? ' drawer-accordion--open' : ''}`}
          >
            <div>
              <button type="button" className="drawer-link drawer-link--sub" onClick={() => go('/shop')}>
                {copy.all}
              </button>
              <button
                type="button"
                className="drawer-link drawer-link--sub"
                onClick={() => go('/shop?sort=new')}
              >
                {copy.newArrivals}
              </button>
              <button
                type="button"
                className="drawer-link drawer-link--sub"
                onClick={() => go('/shop?category=pot')}
              >
                {copy.pots}
              </button>

              {facets && facets.genera.length > 0 && (
                <Accordion title={copy.genus}>
                  {facets.genera.map((genus) => (
                    <button
                      key={genus}
                      type="button"
                      className="drawer-link drawer-link--sub"
                      style={{ paddingLeft: '1.8rem' }}
                      onClick={() => go(`/shop?genus=${encodeURIComponent(genus)}`)}
                    >
                      {genus}
                    </button>
                  ))}
                </Accordion>
              )}

              {facets && facets.viveros.length > 0 && (
                <Accordion title={copy.vivero}>
                  {facets.viveros.map((vivero) => (
                    <button
                      key={vivero.id}
                      type="button"
                      className="drawer-link drawer-link--sub"
                      style={{ paddingLeft: '1.8rem' }}
                      onClick={() => go(`/shop?vivero=${vivero.id}`)}
                    >
                      {vivero.name}
                    </button>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </div>

        {copy.nav.map((link) => (
          <div key={link.href} className="drawer-section">
            <Link href={link.href} className="drawer-link" onClick={onClose}>
              {link.label}
            </Link>
          </div>
        ))}

        <div className="drawer-section" style={{ borderBottom: 'none' }}>
          <Link href="/account" className="drawer-link" onClick={onClose}>
            {copy.account}
          </Link>
        </div>
      </div>

      <div
        className="drawer__foot"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          {copy.language}
        </span>
        <LangToggle />
      </div>
    </Drawer>
  );
}
