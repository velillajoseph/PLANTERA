'use client';

import { useEffect, useRef, useState } from 'react';
import ProductCard from './ProductCard';
import { useLang } from '../../lib/i18n';
import type { CatalogItem } from '../../lib/catalog';

const COPY = {
  es: {
    prev: 'Anterior',
    next: 'Siguiente',
    page: (n: number) => `Página ${n}`,
    empty: 'No encontramos plantas con estos filtros.',
    showing: (from: number, to: number, total: number) =>
      `Mostrando ${from}–${to} de ${total}`,
  },
  en: {
    prev: 'Previous',
    next: 'Next',
    page: (n: number) => `Page ${n}`,
    empty: 'No plants match these filters.',
    showing: (from: number, to: number, total: number) =>
      `Showing ${from}–${to} of ${total}`,
  },
};

/**
 * Grid whose page changes cross-fade: the current page fades out, the new page
 * mounts with a staggered entrance. Keeping a min-height while swapping stops
 * the page from jumping under the reader's cursor.
 */
export default function PaginatedGrid({
  items,
  pageSize = 8,
  showSummary = true,
  minColumnWidth = 230,
}: {
  items: CatalogItem[];
  pageSize?: number;
  showSummary?: boolean;
  minColumnWidth?: number;
}) {
  const { lang } = useLang();
  const copy = COPY[lang];

  const [page, setPage] = useState(1);
  const [visible, setVisible] = useState(items);
  const [fading, setFading] = useState(false);
  const [cycle, setCycle] = useState(0);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lockedHeight, setLockedHeight] = useState<number | undefined>();

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageItems = visible.slice(start, start + pageSize);

  // Filters changing upstream resets to page one with a fresh entrance.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs the grid to a new filtered list
    setVisible(items);
    setPage(1);
    setCycle((value) => value + 1);
  }, [items]);

  const goTo = (nextPage: number) => {
    if (nextPage === currentPage || fading) return;
    setLockedHeight(gridRef.current?.offsetHeight);
    setFading(true);
    setTimeout(() => {
      setPage(nextPage);
      setCycle((value) => value + 1);
      setFading(false);
      setLockedHeight(undefined);
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 170);
  };

  if (items.length === 0) {
    return (
      <p className="lead" style={{ textAlign: 'center', padding: '3rem 0' }}>
        {copy.empty}
      </p>
    );
  }

  return (
    <div ref={containerRef} style={{ display: 'grid', gap: '2rem', scrollMarginTop: '120px' }}>
      <div style={{ minHeight: lockedHeight }}>
        <div
          ref={gridRef}
          key={cycle}
          className={`grid-swap${fading ? ' grid-swap--out' : ''}`}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`,
            gap: '2.2rem 1.5rem',
          }}
        >
          {pageItems.map((item, index) => (
            <ProductCard key={item.id} item={item} index={index} stagger />
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {showSummary ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              {copy.showing(
                start + 1,
                Math.min(start + pageSize, items.length),
                items.length,
              )}
            </span>
          ) : (
            <span />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              className="page-dot"
              style={{ width: 'auto', padding: '0 0.9rem' }}
              disabled={currentPage <= 1}
              onClick={() => goTo(currentPage - 1)}
            >
              {copy.prev}
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                type="button"
                aria-label={copy.page(number)}
                aria-current={number === currentPage}
                className={`page-dot${number === currentPage ? ' page-dot--active' : ''}`}
                onClick={() => goTo(number)}
              >
                {number}
              </button>
            ))}
            <button
              type="button"
              className="page-dot"
              style={{ width: 'auto', padding: '0 0.9rem' }}
              disabled={currentPage >= pageCount}
              onClick={() => goTo(currentPage + 1)}
            >
              {copy.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
