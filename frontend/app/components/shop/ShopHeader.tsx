'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '../Logo';
import LangToggle from '../LangToggle';
import CartMenu from './CartMenu';
import UserMenu from './UserMenu';
import ShopMegaMenu from './ShopMegaMenu';
import MobileNavDrawer from './MobileNavDrawer';
import SearchOverlay from './SearchOverlay';
import { SearchIcon } from './Icons';
import { useLang } from '../../lib/i18n';
import {
  getCatalog,
  type CatalogFacets,
  type CatalogItem,
} from '../../lib/catalog';

const NAV = [
  { href: '/about', label: { es: 'Nosotros', en: 'About' } },
  { href: '/care', label: { es: 'Cuidado', en: 'Care' } },
  { href: '/community', label: { es: 'Comunidad', en: 'Community' } },
  { href: '/contact', label: { es: 'Contacto', en: 'Contact' } },
];

const COPY = {
  es: {
    announce: 'Envío coordinado en toda la isla · Plantas de viveros locales',
    announceShort: 'Envío coordinado en toda la isla',
    searchLabel: 'Buscar plantas',
    menu: 'Abrir menú',
  },
  en: {
    announce: 'Coordinated delivery island-wide · Plants from local viveros',
    announceShort: 'Coordinated delivery island-wide',
    searchLabel: 'Search plants',
    menu: 'Open menu',
  },
};

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default function ShopHeader() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const pathname = usePathname();

  const [facets, setFacets] = useState<CatalogFacets | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Genus/vivero links come from live inventory, so the menu is never stale.
  useEffect(() => {
    let active = true;
    getCatalog()
      .then((data) => {
        if (!active) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async catalog load for the menus and search
        setFacets(data.facets);
        setItems(data.items);
      })
      .catch(() => {
        // Menus still render their static links if the API is unreachable.
      });
    return () => {
      active = false;
    };
  }, []);

  // A tapped link inside the drawer or the search sheet navigates; make sure
  // both follow the route change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the overlays when the route changes
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="shop-header">
        <div className="announce">
          <span className="desktop-only-inline">{copy.announce}</span>
          <span className="mobile-only-inline">{copy.announceShort}</span>
        </div>

        <div
          className="container shop-header__bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            paddingTop: '0.7rem',
            paddingBottom: '0.7rem',
          }}
        >
          <button
            type="button"
            className="icon-button hamburger"
            aria-label={copy.menu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </button>

          <div className="shop-header__logo">
            <Logo />
          </div>

          <nav className="shop-header__nav">
            <ShopMegaMenu facets={facets} />
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`shop-nav__link${
                  pathname === link.href ? ' shop-nav__link--active' : ''
                }`}
              >
                {link.label[lang]}
              </Link>
            ))}
          </nav>

          <div className="shop-header__actions">
            {/* One search entry point on every screen size; the field itself
                lives in the full-width overlay below the header. */}
            <button
              type="button"
              className="icon-button"
              aria-label={copy.searchLabel}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon />
            </button>

            <span className="shop-header__desktop-only">
              <LangToggle />
            </span>
            <span className="shop-header__desktop-only">
              <UserMenu />
            </span>
            <CartMenu />
          </div>
        </div>
      </header>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={items}
        facets={facets}
      />

      <MobileNavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        facets={facets}
        onSearch={() => setSearchOpen(true)}
      />
    </>
  );
}
