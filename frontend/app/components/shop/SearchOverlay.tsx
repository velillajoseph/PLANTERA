'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Price from './Price';
import { SearchIcon } from './Icons';
import { useLang } from '../../lib/i18n';
import { resolveImageUrl, type CatalogFacets, type CatalogItem } from '../../lib/catalog';
import {
  getRecentSearches,
  rememberSearch,
  suggest,
  type Suggestion,
} from '../../lib/search';

/** Long enough that typing doesn't thrash, short enough to feel live. */
const DEBOUNCE_MS = 110;

const COPY = {
  es: {
    label: 'Buscar productos',
    placeholder: '¿Qué buscas hoy?',
    close: 'Cerrar búsqueda',
    products: 'Productos',
    shortcuts: 'Atajos',
    recent: 'Búsquedas recientes',
    seeAll: (term: string) => `Ver todos los resultados de “${term}”`,
    empty: (term: string) => `Sin resultados para “${term}”`,
    emptyHint: 'Prueba con el nombre del producto, el género o el vivero.',
    hint: 'Escribe para ver resultados al instante',
    genus: 'Género',
    vivero: 'Vivero',
  },
  en: {
    label: 'Search products',
    placeholder: 'What are you looking for today?',
    close: 'Close search',
    products: 'Products',
    shortcuts: 'Shortcuts',
    recent: 'Recent searches',
    seeAll: (term: string) => `See all results for “${term}”`,
    empty: (term: string) => `No results for “${term}”`,
    emptyHint: 'Try the product name, its genus, or the vivero.',
    hint: 'Start typing to see results instantly',
    genus: 'Genus',
    vivero: 'Vivero',
  },
};

type Row = Suggestion | { kind: 'recent'; label: string };

/**
 * Full-width search surface that drops below the header.
 *
 * Deliberately the *only* search UI in the app — an inline header field and a
 * separate drawer field meant two inputs could be on screen at once, each with
 * its own state.
 */
export default function SearchOverlay({
  open,
  onClose,
  items,
  facets,
}: {
  open: boolean;
  onClose: () => void;
  items: CatalogItem[];
  facets: CatalogFacets | null;
}) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [activeRow, setActiveRow] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portals need a client-only mount flag
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) {
      // Reopening should start clean; a leftover term would silently prepend
      // itself to whatever gets typed next.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the field when the sheet closes
      setQuery('');
      setDebounced('');
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the panel each time it opens
    setRecent(getRecentSearches());
    setActiveRow(-1);

    // The sheet docks under the header rather than covering it. The header's
    // height changes with the announce strip and the breakpoint, so measure it
    // instead of hard-coding a value that would drift.
    const measure = () => {
      const header = document.querySelector('.shop-header');
      setHeaderBottom(header ? header.getBoundingClientRect().bottom : 0);
    };
    measure();
    window.addEventListener('resize', measure);
    // Focus after the drop-down transition starts, or iOS scrolls the page.
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', measure);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const suggestions = useMemo(
    () => suggest(items, facets, debounced),
    [items, facets, debounced],
  );

  const term = debounced.trim();
  const rows: Row[] = term
    ? suggestions
    : recent.map((label) => ({ kind: 'recent' as const, label }));

  const hrefFor = useCallback((row: Row): string => {
    if (row.kind === 'item') return `/product/${row.item.id}`;
    if (row.kind === 'recent') return `/shop?q=${encodeURIComponent(row.label)}`;
    return row.href;
  }, []);

  const go = useCallback(
    (href: string, remember?: string) => {
      if (remember) rememberSearch(remember);
      setQuery('');
      setDebounced('');
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    go(value ? `/shop?q=${encodeURIComponent(value)}` : '/shop', value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!rows.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveRow((value) => (value + 1) % rows.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveRow((value) => (value <= 0 ? rows.length - 1 : value - 1));
    } else if (event.key === 'Enter' && activeRow >= 0) {
      // Only hijack Enter when a row is highlighted; otherwise the form's own
      // submit takes the shopper to the full results page.
      event.preventDefault();
      const row = rows[activeRow];
      go(hrefFor(row), row.kind === 'recent' ? row.label : query.trim());
    }
  };

  const products = rows.filter((row) => row.kind === 'item');
  const shortcuts = rows.filter((row) => row.kind === 'genus' || row.kind === 'vivero');
  const recents = rows.filter((row) => row.kind === 'recent');

  const renderRow = (row: Row) => {
    const position = rows.indexOf(row);
    const isActive = position === activeRow;
    const id = `search-option-${position}`;

    if (row.kind === 'item') {
      const image = resolveImageUrl(row.item.image_url);
      return (
        <button
          key={id}
          id={id}
          role="option"
          aria-selected={isActive}
          type="button"
          className={`search-row${isActive ? ' search-row--active' : ''}`}
          onMouseEnter={() => setActiveRow(position)}
          onClick={() => go(hrefFor(row), query.trim())}
        >
          <span className="search-row__thumb">
            {image && <img src={image} alt="" loading="lazy" />}
          </span>
          <span className="search-row__text">
            <span className="search-row__name">{row.item.plant_name}</span>
            <span className="search-row__meta">{row.item.store_name}</span>
          </span>
          <span className="search-row__price">
            <Price price={row.item.price} original={row.item.original_price} size="sm" />
          </span>
        </button>
      );
    }

    return (
      <button
        key={id}
        id={id}
        role="option"
        aria-selected={isActive}
        type="button"
        className={`search-row search-row--compact${isActive ? ' search-row--active' : ''}`}
        onMouseEnter={() => setActiveRow(position)}
        onClick={() => go(hrefFor(row), row.kind === 'recent' ? row.label : query.trim())}
      >
        <span className="search-row__text">
          <span className="search-row__name">{row.label}</span>
          <span className="search-row__meta">
            {row.kind === 'genus'
              ? copy.genus
              : row.kind === 'vivero'
                ? copy.vivero
                : copy.recent}
          </span>
        </span>
      </button>
    );
  };

  const overlay = (
    <div
      className={`search-overlay${open ? ' search-overlay--open' : ''}`}
      aria-hidden={!open}
      style={{ top: headerBottom }}
    >
      {/* Dismisses on any click outside the sheet. */}
      <button
        type="button"
        className="search-overlay__scrim"
        aria-label={copy.close}
        tabIndex={-1}
        onClick={onClose}
      />

      <div className="search-overlay__sheet" role="dialog" aria-label={copy.label}>
        <div className="container">
          <form onSubmit={submit} className="search-overlay__field">
            <SearchIcon size={22} />
            <input
              ref={inputRef}
              className="search-overlay__input"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveRow(-1);
              }}
              onKeyDown={onKeyDown}
              placeholder={copy.placeholder}
              aria-label={copy.label}
              aria-controls="search-results"
              aria-autocomplete="list"
              aria-activedescendant={
                activeRow >= 0 ? `search-option-${activeRow}` : undefined
              }
              role="combobox"
              aria-expanded={open}
              enterKeyHint="search"
              autoComplete="off"
            />
            <button
              type="button"
              className="icon-button"
              aria-label={copy.close}
              onClick={onClose}
            >
              <span aria-hidden style={{ fontSize: '1.4rem', lineHeight: 1 }}>
                ×
              </span>
            </button>
          </form>

          <div id="search-results" role="listbox" aria-label={copy.label} className="search-overlay__results">
            {!term && !recents.length && (
              <p className="search-overlay__hint">{copy.hint}</p>
            )}

            {!term && !!recents.length && (
              <>
                <p className="panel__heading">{copy.recent}</p>
                {recents.map(renderRow)}
              </>
            )}

            {!!term && !!products.length && (
              <>
                <p className="panel__heading">{copy.products}</p>
                <div className="search-overlay__grid">{products.map(renderRow)}</div>
              </>
            )}

            {!!term && !!shortcuts.length && (
              <>
                <p className="panel__heading" style={{ marginTop: '0.75rem' }}>
                  {copy.shortcuts}
                </p>
                {shortcuts.map(renderRow)}
              </>
            )}

            {!!term && !suggestions.length && (
              <div className="search-overlay__empty">
                <p style={{ fontWeight: 600 }}>{copy.empty(term)}</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
                  {copy.emptyHint}
                </p>
              </div>
            )}

            {!!term && !!suggestions.length && (
              <button
                type="button"
                className="search-overlay__all"
                onClick={() => go(`/shop?q=${encodeURIComponent(term)}`, term)}
              >
                {copy.seeAll(term)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Portalled to the body: `backdrop-filter` on the header creates a containing
  // block, which would trap a position:fixed child inside it.
  if (!mounted) return null;
  return createPortal(overlay, document.body);
}
