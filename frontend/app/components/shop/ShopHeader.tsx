'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '../Logo';
import LangToggle from '../LangToggle';
import CartMenu from './CartMenu';
import UserMenu from './UserMenu';
import ShopMegaMenu from './ShopMegaMenu';
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
    searchLabel: 'Buscar plantas',
    searchPlaceholder: 'Buscar plantas, macetas…',
  },
  en: {
    announce: 'Coordinated delivery island-wide · Plants from local viveros',
    searchLabel: 'Search plants',
    searchPlaceholder: 'Search plants, pots…',
  },
};

export default function ShopHeader() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const pathname = usePathname();
  const router = useRouter();

  const [facets, setFacets] = useState<CatalogFacets | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Genus/vivero links come from live inventory, so the menu is never stale.
  useEffect(() => {
    let active = true;
    getCatalog()
      .then((data) => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async facet load for the mega-menu
        if (active) setFacets(data.facets);
      })
      .catch(() => {
        // Menu still renders its static links if the API is unreachable.
      });
    return () => {
      active = false;
    };
  }, []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setSearchOpen(false);
  };

  return (
    <header className="shop-header">
      <div className="announce">{copy.announce}</div>
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          paddingTop: '0.9rem',
          paddingBottom: '0.9rem',
        }}
      >
        <Logo />

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.6rem',
            flexWrap: 'wrap',
          }}
        >
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <form
            onSubmit={submitSearch}
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
          <LangToggle />
          <UserMenu />
          <CartMenu />
        </div>
      </div>
    </header>
  );
}
