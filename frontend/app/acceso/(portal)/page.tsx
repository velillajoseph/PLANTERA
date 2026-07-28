'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BarChart from '../../components/BarChart';
import { formatMoney } from '../../lib/format';
import { useLang } from '../../lib/i18n';
import { useVendor } from '../../lib/vendor-context';
import { resolveImageUrl } from '../../lib/catalog';
import {
  ApiError,
  clearToken,
  getOrders,
  getStats,
  type InventoryItem,
  type OrdersPage,
  type VendorStats,
} from '../../lib/api';

const RECENT_ORDERS_PAGE_SIZE = 5;

const LOW_STOCK_THRESHOLD = 8;

const COPY = {
  es: {
    pill: 'Panel de vivero',
    welcome: 'Bienvenido,',
    loading: 'Cargando tu panel…',
    errLoad: 'No pudimos cargar tus datos. ¿Está corriendo el backend?',
    retry: 'Reintentar',
    orders: 'Pedidos',
    revenue: 'Ingresos',
    avgOrder: 'Pedido promedio',
    catalog: 'Plantas en catálogo',
    monthlyRevenue: 'Ingresos mensuales',
    chartHint: 'Toca un mes para ver el detalle',
    closeDetail: 'Cerrar detalle ×',
    topSellers: 'Más vendidas',
    units: 'unidades',
    lowStock: 'Inventario por agotarse',
    lowStockEmpty: 'Todo tu inventario está saludable.',
    lowStockLeft: (stock: number) =>
      stock === 1 ? 'Queda 1 unidad' : `Quedan ${stock} unidades`,
    manage: 'Actualizar',
    viewInventory: 'Ver inventario →',
    badgeOut: 'Agotado',
    badgeLow: 'Poco inventario',
    badgeOk: 'En venta',
    recentOrders: 'Pedidos recientes',
    viewAllOrders: 'Ver todos →',
    thDate: 'Fecha',
    thCustomer: 'Cliente',
    thItems: 'Artículos',
    thTotal: 'Total',
    noOrders: 'Aún no hay pedidos registrados.',
    showing: (from: number, to: number, total: number) =>
      `Mostrando ${from}–${to} de ${total}`,
    pageOf: (page: number, count: number) => `Página ${page} de ${count}`,
    prev: '← Anterior',
    next: 'Siguiente →',
  },
  en: {
    pill: 'Vivero dashboard',
    welcome: 'Welcome,',
    loading: 'Loading your dashboard…',
    errLoad: 'We could not load your data. Is the backend running?',
    retry: 'Retry',
    orders: 'Orders',
    revenue: 'Revenue',
    avgOrder: 'Avg. order',
    catalog: 'Plants listed',
    monthlyRevenue: 'Monthly revenue',
    chartHint: 'Click a month to see details',
    closeDetail: 'Close details ×',
    topSellers: 'Top sellers',
    units: 'units',
    lowStock: 'Running low',
    lowStockEmpty: 'All of your inventory is healthy.',
    lowStockLeft: (stock: number) =>
      stock === 1 ? '1 unit left' : `${stock} units left`,
    manage: 'Update',
    viewInventory: 'View inventory →',
    badgeOut: 'Sold out',
    badgeLow: 'Low stock',
    badgeOk: 'For sale',
    recentOrders: 'Recent orders',
    viewAllOrders: 'View all →',
    thDate: 'Date',
    thCustomer: 'Customer',
    thItems: 'Items',
    thTotal: 'Total',
    noOrders: 'No orders recorded yet.',
    showing: (from: number, to: number, total: number) =>
      `Showing ${from}–${to} of ${total}`,
    pageOf: (page: number, count: number) => `Page ${page} of ${count}`,
    prev: '← Previous',
    next: 'Next →',
  },
};

function Thumb({ item }: { item: InventoryItem }) {
  return (
    <span className="thumb">
      {item.image_url ? (
        <img src={resolveImageUrl(item.image_url) ?? undefined} alt="" />
      ) : (
        item.plant_name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

export default function VendorDashboardPage() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const router = useRouter();
  const { profile } = useVendor();
  const locale = lang === 'es' ? 'es-PR' : 'en-US';

  const [stats, setStats] = useState<VendorStats | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrdersPage | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getStats());
      setState('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace('/acceso/login');
        return;
      }
      setState('error');
    }
  }, [router]);

  const retry = () => {
    setState('loading');
    void loadStats();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    void loadStats();
  }, [loadStats]);

  const loadRecentOrders = useCallback(async () => {
    try {
      setRecentOrders(
        await getOrders({ page: ordersPage, pageSize: RECENT_ORDERS_PAGE_SIZE }),
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace('/acceso/login');
      }
      // Non-auth failures keep the previous page visible; the stats error
      // state already covers a fully unreachable backend.
    }
  }, [ordersPage, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount and page change
    void loadRecentOrders();
  }, [loadRecentOrders]);

  const chartData = useMemo(
    () =>
      stats?.monthly.map((entry) => ({
        month: new Intl.DateTimeFormat(locale, { month: 'short' }).format(
          new Date(`${entry.month}-15T12:00:00`),
        ),
        revenue: entry.revenue,
      })) ?? [],
    [stats, locale],
  );

  const monthDetail =
    selectedMonth !== null ? (stats?.monthly[selectedMonth] ?? null) : null;

  const monthLabel = (key: string) =>
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
      new Date(`${key}-15T12:00:00`),
    );

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
      new Date(iso),
    );

  const stockBadge = (stock: number) => {
    if (stock <= 0) return <span className="badge badge--out">{copy.badgeOut}</span>;
    if (stock < LOW_STOCK_THRESHOLD)
      return <span className="badge badge--low">{copy.badgeLow}</span>;
    return <span className="badge badge--ok">{copy.badgeOk}</span>;
  };

  if (state === 'loading') {
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        <p className="lead">{copy.loading}</p>
      </div>
    );
  }

  if (state === 'error' || !stats) {
    return (
      <div
        className="container section"
        style={{ display: 'grid', gap: '1rem', justifyItems: 'center' }}
      >
        <p className="lead">{copy.errLoad}</p>
        <button type="button" className="btn btn--small" onClick={retry}>
          {copy.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="container section" style={{ display: 'grid', gap: '2rem' }}>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <span className="pill">{copy.pill}</span>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.7rem)' }}>
          {copy.welcome} {profile.name}
        </h1>
        <p className="lead" style={{ fontSize: '0.95rem' }}>
          {[profile.address, profile.bio].filter(Boolean).join(' — ')}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">{copy.orders}</span>
          <span className="display" style={{ fontSize: '2.4rem' }}>
            {stats.totals.orders}
          </span>
        </div>
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">{copy.revenue}</span>
          <span className="display" style={{ fontSize: '2.4rem' }}>
            {formatMoney(stats.totals.revenue)}
          </span>
        </div>
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">{copy.avgOrder}</span>
          <span className="display" style={{ fontSize: '2.4rem' }}>
            {formatMoney(stats.totals.avg_order)}
          </span>
        </div>
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">{copy.catalog}</span>
          <span className="display" style={{ fontSize: '2.4rem' }}>
            {stats.totals.active_listings}
          </span>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <span className="eyebrow eyebrow--sage">{copy.monthlyRevenue}</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            {copy.chartHint}
          </span>
        </div>
        <BarChart
          data={chartData}
          selectedIndex={selectedMonth}
          onSelect={setSelectedMonth}
        />
        {monthDetail && (
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--line)',
              display: 'grid',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <h3
                className="display"
                style={{ fontSize: '1.4rem', textTransform: 'capitalize' }}
              >
                {monthLabel(monthDetail.month)}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMonth(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--muted)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {copy.closeDetail}
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'grid', gap: '0.2rem' }}>
                <span className="eyebrow eyebrow--sage">{copy.revenue}</span>
                <span className="display" style={{ fontSize: '1.5rem' }}>
                  {formatMoney(monthDetail.revenue)}
                </span>
              </div>
              <div style={{ display: 'grid', gap: '0.2rem' }}>
                <span className="eyebrow eyebrow--sage">{copy.orders}</span>
                <span className="display" style={{ fontSize: '1.5rem' }}>
                  {monthDetail.orders}
                </span>
              </div>
              <div style={{ display: 'grid', gap: '0.2rem' }}>
                <span className="eyebrow eyebrow--sage">{copy.avgOrder}</span>
                <span className="display" style={{ fontSize: '1.5rem' }}>
                  {formatMoney(
                    monthDetail.orders
                      ? monthDetail.revenue / monthDetail.orders
                      : 0,
                  )}
                </span>
              </div>
            </div>
            {monthDetail.top_plants.length > 0 && (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <span className="eyebrow eyebrow--sage">{copy.topSellers}</span>
                <div style={{ display: 'grid', gap: '0.4rem' }}>
                  {monthDetail.top_plants.map((item) => (
                    <div
                      key={item.plant_name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        fontSize: '0.95rem',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{item.plant_name}</span>
                      <span style={{ color: 'var(--muted)' }}>
                        {item.units} {copy.units}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ fontSize: '1.4rem' }}>{copy.lowStock}</h2>
          <Link
            href="/acceso/inventory"
            style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--green-700)' }}
          >
            {copy.viewInventory}
          </Link>
        </div>
        {stats.low_stock.length === 0 ? (
          <p className="lead" style={{ fontSize: '0.95rem' }}>
            {copy.lowStockEmpty}
          </p>
        ) : (
          <div style={{ display: 'grid' }}>
            {stats.low_stock.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  padding: '0.6rem 0',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <Thumb item={item} />
                  {item.plant_name}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {stockBadge(item.stock)}
                  <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
                    {copy.lowStockLeft(item.stock)}
                  </span>
                  <Link
                    href={`/acceso/inventory?edit=${item.id}`}
                    className="btn btn--ghost btn--small"
                  >
                    {copy.manage}
                  </Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ fontSize: '1.4rem' }}>{copy.recentOrders}</h2>
          <Link
            href="/acceso/orders"
            style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--green-700)' }}
          >
            {copy.viewAllOrders}
          </Link>
        </div>
        {!recentOrders || recentOrders.total === 0 ? (
          <p className="lead" style={{ fontSize: '0.95rem' }}>
            {copy.noOrders}
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="desktop-table scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>{copy.thDate}</th>
                    <th>{copy.thCustomer}</th>
                    <th>{copy.thItems}</th>
                    <th style={{ textAlign: 'right' }}>{copy.thTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.orders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td style={{ fontWeight: 600 }}>{order.customer_name}</td>
                      <td>
                        {order.items.reduce((sum, line) => sum + line.quantity, 0)}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {formatMoney(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phones read this as a list; a four-column table would overflow. */}
            <div className="mobile-cards" style={{ gap: '0' }}>
              {recentOrders.orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.8rem 0',
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'grid', gap: '0.15rem', minWidth: 0 }}>
                    <span style={{ fontWeight: 600 }}>{order.customer_name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {formatDate(order.created_at)} ·{' '}
                      {order.items.reduce((sum, line) => sum + line.quantity, 0)}{' '}
                      {copy.thItems.toLowerCase()}
                    </span>
                  </div>
                  <span
                    className="display"
                    style={{ fontSize: '1.05rem', whiteSpace: 'nowrap' }}
                  >
                    {formatMoney(order.total)}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {copy.showing(
                  (recentOrders.page - 1) * recentOrders.page_size + 1,
                  Math.min(
                    recentOrders.page * recentOrders.page_size,
                    recentOrders.total,
                  ),
                  recentOrders.total,
                )}
              </span>
              <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  disabled={recentOrders.page <= 1}
                  onClick={() => setOrdersPage(recentOrders.page - 1)}
                >
                  {copy.prev}
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {copy.pageOf(
                    recentOrders.page,
                    Math.max(
                      1,
                      Math.ceil(recentOrders.total / recentOrders.page_size),
                    ),
                  )}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  disabled={
                    recentOrders.page >=
                    Math.ceil(recentOrders.total / recentOrders.page_size)
                  }
                  onClick={() => setOrdersPage(recentOrders.page + 1)}
                >
                  {copy.next}
                </button>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
