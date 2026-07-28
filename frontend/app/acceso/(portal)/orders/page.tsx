'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '../../../lib/format';
import { useLang } from '../../../lib/i18n';
import {
  ApiError,
  clearToken,
  getOrders,
  type OrdersPage,
} from '../../../lib/api';

const COPY = {
  es: {
    title: 'Pedidos',
    subtitle: 'Historial completo de ventas con el detalle de cada pedido.',
    loading: 'Cargando pedidos…',
    errLoad: 'No pudimos cargar tus pedidos. ¿Está corriendo el backend?',
    retry: 'Reintentar',
    monthFilter: 'Mes',
    allMonths: 'Todos los meses',
    thDate: 'Fecha',
    thCustomer: 'Cliente',
    thItems: 'Artículos',
    thTotal: 'Total',
    thDetail: 'Detalle',
    view: 'Ver',
    hide: 'Ocultar',
    unitPrice: 'c/u',
    noOrders: 'No hay pedidos para este período.',
    showing: (from: number, to: number, total: number) =>
      `Mostrando ${from}–${to} de ${total}`,
    pageOf: (page: number, count: number) => `Página ${page} de ${count}`,
    prev: '← Anterior',
    next: 'Siguiente →',
  },
  en: {
    title: 'Orders',
    subtitle: 'Complete sales history with each order broken down.',
    loading: 'Loading orders…',
    errLoad: 'We could not load your orders. Is the backend running?',
    retry: 'Retry',
    monthFilter: 'Month',
    allMonths: 'All months',
    thDate: 'Date',
    thCustomer: 'Customer',
    thItems: 'Items',
    thTotal: 'Total',
    thDetail: 'Detail',
    view: 'View',
    hide: 'Hide',
    unitPrice: 'each',
    noOrders: 'No orders for this period.',
    showing: (from: number, to: number, total: number) =>
      `Showing ${from}–${to} of ${total}`,
    pageOf: (page: number, count: number) => `Page ${page} of ${count}`,
    prev: '← Previous',
    next: 'Next →',
  },
};

export default function OrdersPageView() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const router = useRouter();
  const locale = lang === 'es' ? 'es-PR' : 'en-US';

  const [data, setData] = useState<OrdersPage | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState<string>('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getOrders({ page, month: month || undefined }));
      setState('ready');
      setExpanded(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace('/acceso/login');
        return;
      }
      setState('error');
    }
  }, [page, month, router]);

  const retry = () => {
    setState('loading');
    void load();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    void load();
  }, [load]);

  const monthLabel = (key: string) =>
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
      new Date(`${key}-15T12:00:00`),
    );

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));

  if (state === 'loading' && !data) {
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        <p className="lead">{copy.loading}</p>
      </div>
    );
  }

  if (state === 'error' || !data) {
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

  const pageCount = Math.max(1, Math.ceil(data.total / data.page_size));
  const from = data.total === 0 ? 0 : (data.page - 1) * data.page_size + 1;
  const to = Math.min(data.page * data.page_size, data.total);

  return (
    <div className="container section" style={{ display: 'grid', gap: '1.75rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)' }}>{copy.title}</h1>
          <p className="lead" style={{ fontSize: '0.95rem' }}>
            {copy.subtitle}
          </p>
        </div>
        <label className="field" style={{ minWidth: '200px' }}>
          {copy.monthFilter}
          <select
            className="input"
            value={month}
            onChange={(event) => {
              setMonth(event.target.value);
              setPage(1);
            }}
            style={{ textTransform: 'capitalize' }}
          >
            <option value="">{copy.allMonths}</option>
            {data.months.map((key) => (
              <option key={key} value={key} style={{ textTransform: 'capitalize' }}>
                {monthLabel(key)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card" style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{copy.thDate}</th>
                <th>{copy.thCustomer}</th>
                <th>{copy.thItems}</th>
                <th style={{ textAlign: 'right' }}>{copy.thTotal}</th>
                <th style={{ textAlign: 'right' }}>{copy.thDetail}</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => {
                const isExpanded = expanded === order.id;
                const itemCount = order.items.reduce(
                  (sum, line) => sum + line.quantity,
                  0,
                );
                return (
                  <Fragment key={order.id}>
                    <tr>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td style={{ fontWeight: 600 }}>{order.customer_name}</td>
                      <td>{itemCount}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {formatMoney(order.total)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() =>
                            setExpanded(isExpanded ? null : order.id)
                          }
                        >
                          {isExpanded ? copy.hide : copy.view}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} style={{ background: 'var(--bg)' }}>
                          <div style={{ display: 'grid', gap: '0.4rem', padding: '0.5rem 0.25rem' }}>
                            {order.items.map((line, index) => (
                              <div
                                key={`${order.id}-${index}`}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  gap: '1rem',
                                  fontSize: '0.92rem',
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>
                                  {line.quantity} × {line.plant_name}
                                </span>
                                <span style={{ color: 'var(--muted)' }}>
                                  {formatMoney(line.unit_price)} {copy.unitPrice} ·{' '}
                                  {formatMoney(line.unit_price * line.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {data.orders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      color: 'var(--muted)',
                      textAlign: 'center',
                      padding: '2rem 0',
                    }}
                  >
                    {copy.noOrders}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data.total > 0 && (
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
              {copy.showing(from, to, data.total)}
            </span>
            <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                disabled={data.page <= 1}
                onClick={() => setPage(data.page - 1)}
              >
                {copy.prev}
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {copy.pageOf(data.page, pageCount)}
              </span>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                disabled={data.page >= pageCount}
                onClick={() => setPage(data.page + 1)}
              >
                {copy.next}
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
