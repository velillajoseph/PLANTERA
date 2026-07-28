'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import BarChart from '../components/BarChart';
import { getPlantsByVendor, type Plant } from '../lib/plants';
import { vendors } from '../lib/vendors';
import { getSalesSummary } from '../lib/sales';
import { formatMoney } from '../lib/format';

const PAGE_SIZE = 5;

type ListingOverride = Partial<
  Pick<Plant, 'name' | 'price' | 'stock' | 'image' | 'description'>
>;

type DashboardState = {
  overrides: Record<string, ListingOverride>;
  added: Plant[];
  removed: string[];
};

const EMPTY_STATE: DashboardState = { overrides: {}, added: [], removed: [] };

type ListingDraft = {
  slug: string | null;
  name: string;
  price: string;
  stock: string;
  image: string;
  description: string;
};

const EMPTY_DRAFT: ListingDraft = {
  slug: null,
  name: '',
  price: '',
  stock: '',
  image: '',
  description: '',
};

function storageKey(vendorId: string) {
  return `plantera-dashboard-${vendorId}`;
}

function loadState(vendorId: string): DashboardState {
  if (typeof window === 'undefined') return EMPTY_STATE;
  const raw = window.localStorage.getItem(storageKey(vendorId));
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<DashboardState>;
    return {
      overrides: parsed.overrides ?? {},
      added: parsed.added ?? [],
      removed: parsed.removed ?? [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

function saveState(vendorId: string, state: DashboardState) {
  window.localStorage.setItem(storageKey(vendorId), JSON.stringify(state));
}

function stockBadge(stock: number) {
  if (stock <= 0) return <span className="badge badge--out">Agotado</span>;
  if (stock < 8) return <span className="badge badge--low">Poco inventario</span>;
  return <span className="badge badge--ok">En venta</span>;
}

function Thumb({ plant }: { plant: Plant }) {
  return (
    <span className="thumb">
      {plant.image ? (
        <img src={plant.image} alt="" />
      ) : (
        plant.name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <h2 style={{ fontSize: '1.4rem' }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              border: 'none',
              background: 'none',
              fontSize: '1.3rem',
              color: 'var(--muted)',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [vendorId, setVendorId] = useState(vendors[0].id);
  const [state, setState] = useState<DashboardState>(EMPTY_STATE);
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Plant | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    setState(loadState(vendorId));
    setPage(1);
    setDraft(null);
    setPendingDelete(null);
    setSelectedMonth(null);
  }, [vendorId]);

  const vendor = vendors.find((item) => item.id === vendorId)!;
  const sales = getSalesSummary(vendorId);

  const listings = useMemo(() => {
    const base = getPlantsByVendor(vendorId)
      .filter((plant) => !state.removed.includes(plant.slug))
      .map((plant) => ({ ...plant, ...state.overrides[plant.slug] }));
    return [...base, ...state.added];
  }, [vendorId, state]);

  const pageCount = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = listings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const avgOrder =
    sales && sales.totalSales > 0 ? sales.revenue / sales.totalSales : 0;

  const monthDetail =
    selectedMonth !== null ? (sales?.monthlyRevenue[selectedMonth] ?? null) : null;

  const commit = (updater: (current: DashboardState) => DashboardState) => {
    setState((current) => {
      const next = updater(current);
      saveState(vendorId, next);
      return next;
    });
  };

  const openEdit = (plant: Plant) => {
    setDraftError(null);
    setDraft({
      slug: plant.slug,
      name: plant.name,
      price: plant.price.toFixed(2),
      stock: String(plant.stock),
      image: plant.image,
      description: plant.description,
    });
  };

  const openAdd = () => {
    setDraftError(null);
    setDraft({ ...EMPTY_DRAFT });
  };

  const saveDraft = () => {
    if (!draft) return;
    const name = draft.name.trim();
    const price = Number(draft.price);
    const stock = Number(draft.stock);

    if (!name) {
      setDraftError('El nombre no puede estar vacío.');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      setDraftError('El precio debe ser un número válido.');
      return;
    }
    if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      setDraftError('El inventario debe ser un número entero.');
      return;
    }

    const fields = {
      name,
      price,
      stock,
      image: draft.image.trim(),
      description: draft.description.trim(),
    };

    if (draft.slug === null) {
      const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const plant: Plant = {
        slug,
        vendorId,
        ...fields,
        care: {
          light: 'Por definir.',
          water: 'Por definir.',
          soil: 'Por definir.',
          commonIssues: 'Por definir.',
        },
      };
      commit((current) => ({ ...current, added: [...current.added, plant] }));
    } else {
      const slug = draft.slug;
      commit((current) => {
        const addedIndex = current.added.findIndex((item) => item.slug === slug);
        if (addedIndex >= 0) {
          const added = [...current.added];
          added[addedIndex] = { ...added[addedIndex], ...fields };
          return { ...current, added };
        }
        return {
          ...current,
          overrides: {
            ...current.overrides,
            [slug]: { ...current.overrides[slug], ...fields },
          },
        };
      });
    }
    setDraft(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const slug = pendingDelete.slug;
    commit((current) => {
      if (current.added.some((item) => item.slug === slug)) {
        return {
          ...current,
          added: current.added.filter((item) => item.slug !== slug),
        };
      }
      const overrides = { ...current.overrides };
      delete overrides[slug];
      return { ...current, overrides, removed: [...current.removed, slug] };
    });
    setPendingDelete(null);
  };

  const resetDemoData = () => {
    window.localStorage.removeItem(storageKey(vendorId));
    setState(EMPTY_STATE);
    setPage(1);
    setSelectedMonth(null);
  };

  return (
    <div className="container section" style={{ display: 'grid', gap: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <span className="pill">Vista de demostración</span>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.7rem)' }}>
            Bienvenido, {vendor.name}
          </h1>
          <p className="lead" style={{ fontSize: '0.95rem' }}>
            {vendor.location} — {vendor.tagline}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <label className="field" style={{ minWidth: '220px' }}>
            Ver como vivero
            <select
              value={vendorId}
              onChange={(event) => setVendorId(event.target.value)}
              className="input"
              style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 'normal' }}
            >
              {vendors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={resetDemoData}
            className="btn btn--ghost btn--small"
          >
            Restablecer datos
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">Pedidos</span>
          <span className="serif" style={{ fontSize: '2.4rem' }}>
            {sales?.totalSales ?? 0}
          </span>
        </div>
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">Ingresos</span>
          <span className="serif" style={{ fontSize: '2.4rem' }}>
            {formatMoney(sales?.revenue ?? 0)}
          </span>
        </div>
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">Pedido promedio</span>
          <span className="serif" style={{ fontSize: '2.4rem' }}>
            {formatMoney(avgOrder)}
          </span>
        </div>
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">Plantas en catálogo</span>
          <span className="serif" style={{ fontSize: '2.4rem' }}>
            {listings.length}
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
          <span className="eyebrow eyebrow--sage">Ingresos mensuales</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            Toca un mes para ver el detalle
          </span>
        </div>
        {sales && (
          <BarChart
            data={sales.monthlyRevenue}
            selectedIndex={selectedMonth}
            onSelect={setSelectedMonth}
          />
        )}
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
              <h3 className="serif" style={{ fontSize: '1.4rem' }}>
                {monthDetail.monthLabel}
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
                Cerrar detalle ×
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
                <span className="eyebrow eyebrow--sage">Ingresos</span>
                <span className="serif" style={{ fontSize: '1.5rem' }}>
                  {formatMoney(monthDetail.revenue)}
                </span>
              </div>
              <div style={{ display: 'grid', gap: '0.2rem' }}>
                <span className="eyebrow eyebrow--sage">Pedidos</span>
                <span className="serif" style={{ fontSize: '1.5rem' }}>
                  {monthDetail.orders}
                </span>
              </div>
              <div style={{ display: 'grid', gap: '0.2rem' }}>
                <span className="eyebrow eyebrow--sage">Pedido promedio</span>
                <span className="serif" style={{ fontSize: '1.5rem' }}>
                  {formatMoney(monthDetail.revenue / monthDetail.orders)}
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <span className="eyebrow eyebrow--sage">Más vendidas</span>
              <div style={{ display: 'grid', gap: '0.4rem' }}>
                {monthDetail.topPlants.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      fontSize: '0.95rem',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    <span style={{ color: 'var(--muted)' }}>
                      {item.units} unidades
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
            marginBottom: '1.25rem',
          }}
        >
          <h2 style={{ fontSize: '1.4rem' }}>Tu inventario</h2>
          <button type="button" onClick={openAdd} className="btn btn--small">
            + Agregar planta
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Planta</th>
                <th>Precio</th>
                <th>Inventario</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((plant) => (
                <tr key={plant.slug}>
                  <td>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      <Thumb plant={plant} />
                      {plant.name}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {formatMoney(plant.price)}
                  </td>
                  <td>{plant.stock}</td>
                  <td>{stockBadge(plant.stock)}</td>
                  <td>
                    <span
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openEdit(plant)}
                        className="btn btn--ghost btn--small"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(plant)}
                        className="btn btn--danger btn--small"
                      >
                        Eliminar
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>
                    No hay plantas en tu inventario. Agrega la primera.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {listings.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginTop: '1.25rem',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, listings.length)} de{' '}
              {listings.length}
            </span>
            <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Página {currentPage} de {pageCount}
              </span>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                disabled={currentPage >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                Siguiente →
              </button>
            </span>
          </div>
        )}
      </div>

      {draft && (
        <Modal
          title={draft.slug === null ? 'Agregar planta' : 'Editar planta'}
          onClose={() => setDraft(null)}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            {draft.image.trim() && (
              <span className="thumb" style={{ width: 96, height: 96 }}>
                <img src={draft.image.trim()} alt="Vista previa" />
              </span>
            )}
            <label className="field">
              Nombre
              <input
                className="input"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                placeholder="Filodendro Brasil"
              />
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              <label className="field">
                Precio
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.price}
                  onChange={(event) =>
                    setDraft({ ...draft, price: event.target.value })
                  }
                  placeholder="25.00"
                />
              </label>
              <label className="field">
                Inventario
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={draft.stock}
                  onChange={(event) =>
                    setDraft({ ...draft, stock: event.target.value })
                  }
                  placeholder="10"
                />
              </label>
            </div>
            <label className="field">
              Foto (URL)
              <input
                className="input"
                value={draft.image}
                onChange={(event) =>
                  setDraft({ ...draft, image: event.target.value })
                }
                placeholder="https://…"
              />
            </label>
            <label className="field">
              Descripción
              <textarea
                className="input"
                rows={3}
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </label>
            {draftError && (
              <p style={{ color: '#9c4a3c', fontSize: '0.9rem', fontWeight: 600 }}>
                {draftError}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="btn btn--ghost btn--small"
              >
                Cancelar
              </button>
              <button type="button" onClick={saveDraft} className="btn btn--small">
                {draft.slug === null ? 'Agregar' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <Modal
          title="Eliminar planta"
          onClose={() => setPendingDelete(null)}
        >
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <p className="lead" style={{ fontSize: '0.98rem' }}>
              ¿Seguro que quieres eliminar{' '}
              <strong style={{ color: 'var(--ink)' }}>{pendingDelete.name}</strong>{' '}
              de tu inventario? Puedes recuperarla con «Restablecer datos».
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="btn btn--ghost btn--small"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="btn btn--danger btn--small"
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
