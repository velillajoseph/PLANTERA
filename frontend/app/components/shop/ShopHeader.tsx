'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '../Logo';
import LangToggle from '../LangToggle';
import CartMenu from './CartMenu';
import UserMenu from './UserMenu';
import ShopMegaMenu from './ShopMegaMenu';
import MobileNavDrawer from './MobileNavDrawer';
import { SearchIcon } from './Icons';
import { useLang } from '../../lib/i18n';
import { getCatalog, type CatalogFacets } from '../../lib/catalog';

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
    searchPlaceholder: 'Buscar plantas, macetas…',
    menu: 'Abrir menú',
  },
  en: {
    announce: 'Coordinated delivery island-wide · Plants from local viveros',
    announceShort: 'Coordinated delivery island-wide',
    searchLabel: 'Search plants',
    searchPlaceholder: 'Search plants, pots…',
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
  const router = useRouter();

  const [facets, setFacets] = useState<CatalogFacets | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Genus/vivero links come from live inventory, so the menu is never stale.
  useEffect(() => {
    let active = true;
    getCatalog()
      .then((data) => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async facet load for the menus
        if (active) setFacets(data.facets);
      })
      .catch(() => {
        // Menus still render their static links if the API is unreachable.
      });
    return () => {
      active = false;
    };
  }, []);

  // A tapped link inside the drawer navigates; make sure the drawer follows.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the drawer when the route changes
    setMenuOpen(false);
  }, [pathname]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setSearchOpen(false);
  };

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
            <form
              onSubmit={submitSearch}
              className="shop-header__desktop-only"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <input
                className="input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                aria-label={copy.searchLabel}
                aria-hidden={!searchOpen}
                tabIndex={searchOpen ? 0 : -1}
                style={{
                  width: searchOpen ? 200 : 0,
                  paddingLeft: searchOpen ? '0.8rem' : 0,
                  paddingRight: searchOpen ? '0.8rem' : 0,
                  borderWidth: searchOpen ? 1 : 0,
                  opacity: searchOpen ? 1 : 0,
                  transition: 'width .28s cubic-bezier(.22,1,.36,1), opacity .2s ease',
                }}
              />
              <button
                type={searchOpen ? 'submit' : 'button'}
                className="icon-button"
                aria-label={copy.searchLabel}
                onClick={() => !searchOpen && setSearchOpen(true)}
              >
                <SearchIcon />
              </button>
            </form>

            {/* On mobile the search field lives in the drawer, so this is a
                shortcut that opens the drawer focused on it. */}
            <button
              type="button"
              className="icon-button hamburger"
              aria-label={copy.searchLabel}
              onClick={() => setMenuOpen(true)}
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

      <MobileNavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        facets={facets}
      />
    </>
  );
}
