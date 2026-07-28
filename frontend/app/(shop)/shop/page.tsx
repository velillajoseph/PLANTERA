'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaginatedGrid from '../../components/shop/PaginatedGrid';
import { useLang } from '../../lib/i18n';
import {
  getCatalog,
  splitTags,
  type CatalogFacets,
  type CatalogItem,
} from '../../lib/catalog';

const COPY = {
  es: {
    title: 'Tienda',
    lead: 'Todo el inventario de nuestros viveros aliados, en un solo lugar.',
    loading: 'Cargando la tienda…',
    errorTitle: 'No pudimos cargar la tienda',
    errorCopy: 'Revisa que el servidor esté corriendo e inténtalo de nuevo.',
    retry: 'Reintentar',
    filters: 'Filtros',
    clear: 'Limpiar filtros',
    category: 'Categoría',
    genus: 'Género',
    vivero: 'Vivero',
    sort: 'Ordenar',
    all: 'Todo',
    searchResults: (term: string) => `Resultados para “${term}”`,
    categories: {
      plant: 'Plantas',
      pot: 'Macetas',
      supply: 'Accesorios',
    } as Record<string, string>,
    sorts: {
      featured: 'Destacadas',
      new: 'Nuevas llegadas',
      priceAsc: 'Precio: menor a mayor',
      priceDesc: 'Precio: mayor a menor',
      name: 'Nombre A–Z',
    },
    resultCount: (n: number) => (n === 1 ? '1 artículo' : `${n} artículos`),
  },
  en: {
    title: 'Shop',
    lead: 'The full inventory of our partner viveros, in one place.',
    loading: 'Loading the shop…',
    errorTitle: 'We could not load the shop',
    errorCopy: 'Check that the server is running and try again.',
    retry: 'Retry',
    filters: 'Filters',
    clear: 'Clear filters',
    category: 'Category',
    genus: 'Genus',
    vivero: 'Vivero',
    sort: 'Sort',
    all: 'All',
    searchResults: (term: string) => `Results for “${term}”`,
    categories: {
      plant: 'Plants',
      pot: 'Pots',
      supply: 'Supplies',
    } as Record<string, string>,
    sorts: {
      featured: 'Featured',
      new: 'New arrivals',
      priceAsc: 'Price: low to high',
      priceDesc: 'Price: high to low',
      name: 'Name A–Z',
    },
    resultCount: (n: number) => (n === 1 ? '1 item' : `${n} items`),
  },
};

type SortKey = 'featured' | 'new' | 'priceAsc' | 'priceDesc' | 'name';

function ShopContent() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [facets, setFacets] = useState<CatalogFacets | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = () => {
    setState('loading');
    getCatalog()
      .then((data) => {
        setItems(data.items);
        setFacets(data.facets);
        setState('ready');
      })
      .catch(() => setState('error'));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial catalog fetch on mount
    load();
  }, []);

  const category = searchParams.get('category') ?? '';
  const genus = searchParams.get('genus') ?? '';
  const vivero = searchParams.get('vivero') ?? '';
  const query = searchParams.get('q') ?? '';
  const sort = (searchParams.get('sort') as SortKey) || 'featured';

  // Filters live in the URL so a filtered view is shareable and back-navigable.
  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const suffix = params.toString();
    router.replace(suffix ? `/shop?${suffix}` : '/shop', { scroll: false });
  };

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (category && item.category !== category) return false;
      if (genus && item.genus !== genus) return false;
      if (vivero && String(item.store_id) !== vivero) return false;
      if (term) {
        const haystack = [
          item.plant_name,
          item.genus ?? '',
          item.store_name,
          ...splitTags(item.tags),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    const sorted = [...filtered];
    if (sort === 'new') {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (sort === 'priceAsc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sort === 'priceDesc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sort === 'name') {
      sorted.sort((a, b) => a.plant_name.localeCompare(b.plant_name));
    } else {
      sorted.sort(
        (a, b) => Number(b.is_featured) - Number(a.is_featured) || a.price - b.price,
      );
    }
    return sorted;
  }, [items, category, genus, vivero, query, sort]);

  const hasFilters = Boolean(category || genus || vivero || query);

  if (state === 'loading') {
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        <p className="lead">{copy.loading}</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div
        className="container section"
        style={{ display: 'grid', gap: '1rem', justifyItems: 'center', textAlign: 'center' }}
      >
        <h1 style={{ fontSize: '1.6rem' }}>{copy.errorTitle}</h1>
        <p className="lead">{copy.errorCopy}</p>
        <button type="button" className="btn btn--small" onClick={load}>
          {copy.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="container section" style={{ display: 'grid', gap: '2rem' }}>
      <div style={{ display: 'grid', gap: '0.6rem' }}>
        <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)' }}>
          {query ? copy.searchResults(query) : copy.title}
        </h1>
        <p className="lead" style={{ fontSize: '0.95rem' }}>
          {copy.lead}
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className={`chip${!category ? ' chip--active' : ''}`}
            onClick={() => setParam('category', '')}
          >
            {copy.all}
          </button>
          {facets?.categories.map((value) => (
            <button
              key={value}
              type="button"
              className={`chip${category === value ? ' chip--active' : ''}`}
              onClick={() => setParam('category', category === value ? '' : value)}
            >
              {copy.categories[value] ?? value}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          <label className="field">
            {copy.genus}
            <select
              className="input"
              value={genus}
              onChange={(event) => setParam('genus', event.target.value)}
            >
              <option value="">{copy.all}</option>
              {facets?.genera.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            {copy.vivero}
            <select
              className="input"
              value={vivero}
              onChange={(event) => setParam('vivero', event.target.value)}
            >
              <option value="">{copy.all}</option>
              {facets?.viveros.map((value) => (
                <option key={value.id} value={String(value.id)}>
                  {value.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            {copy.sort}
            <select
              className="input"
              value={sort}
              onChange={(event) => setParam('sort', event.target.value)}
            >
              {(Object.keys(copy.sorts) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {copy.sorts[key]}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              {copy.resultCount(visible.length)}
            </span>
            {hasFilters && (
              <button
                type="button"
                className="chip"
                onClick={() => router.replace('/shop', { scroll: false })}
              >
                {copy.clear}
              </button>
            )}
          </div>
        </div>
      </div>

      <PaginatedGrid items={visible} pageSize={9} />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}
