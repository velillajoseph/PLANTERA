'use client';

import { useEffect, useMemo, useState } from 'react';
import BarChart from '../../../components/BarChart';
import Modal from '../../../components/Modal';
import { getPlantsByVendor, type Plant } from '../../../lib/plants';
import { vendors } from '../../../lib/vendors';
import { getSalesSummary } from '../../../lib/sales';
import { formatMoney } from '../../../lib/format';
import { useLang, type Localized } from '../../../lib/i18n';

const PAGE_SIZE = 5;

const COPY = {
  es: {
    pill: 'Vista de demostración',
    welcome: 'Bienvenido,',
    viewAs: 'Ver como vivero',
    reset: 'Restablecer datos',
    orders: 'Pedidos',
    revenue: 'Ingresos',
    avgOrder: 'Pedido promedio',
    catalog: 'Plantas en catálogo',
    monthlyRevenue: 'Ingresos mensuales',
    chartHint: 'Toca un mes para ver el detalle',
    closeDetail: 'Cerrar detalle ×',
    topSellers: 'Más vendidas',
    units: 'unidades',
    inventory: 'Tu inventario',
    addPlant: '+ Agregar planta',
    thPlant: 'Planta',
    thPrice: 'Precio',
    thStock: 'Inventario',
    thStatus: 'Estado',
    thActions: 'Acciones',
    edit: 'Editar',
    remove: 'Eliminar',
    emptyInventory: 'No hay plantas en tu inventario. Agrega la primera.',
    showing: (from: number, to: number, total: number) =>
      `Mostrando ${from}–${to} de ${total}`,
    pageOf: (page: number, count: number) => `Página ${page} de ${count}`,
    prev: '← Anterior',
    next: 'Siguiente →',
    badgeOut: 'Agotado',
    badgeLow: 'Poco inventario',
    badgeOk: 'En venta',
    modalAdd: 'Agregar planta',
    modalEdit: 'Editar planta',
    close: 'Cerrar',
    fieldName: 'Nombre',
    fieldPrice: 'Precio',
    fieldStock: 'Inventario',
    fieldImage: 'Foto (URL)',
    fieldDescription: 'Descripción',
    imagePreview: 'Vista previa',
    errName: 'El nombre no puede estar vacío.',
    errPrice: 'El precio debe ser un número válido.',
    errStock: 'El inventario debe ser un número entero.',
    cancel: 'Cancelar',
    save: 'Guardar cambios',
    add: 'Agregar',
    deleteTitle: 'Eliminar planta',
    deleteBody: (name: string) =>
      `¿Seguro que quieres eliminar ${name} de tu inventario? Puedes recuperarla con «Restablecer datos».`,
    confirmDelete: 'Eliminar',
    newPlantDescription: 'Nueva planta agregada durante la demostración.',
    toBeDefined: 'Por definir.',
    namePlaceholder: 'Filodendro Brasil',
  },
  en: {
    pill: 'Demo preview',
    welcome: 'Welcome,',
    viewAs: 'View as vivero',
    reset: 'Reset demo data',
    orders: 'Orders',
    revenue: 'Revenue',
    avgOrder: 'Avg. order',
    catalog: 'Plants listed',
    monthlyRevenue: 'Monthly revenue',
    chartHint: 'Click a month to see details',
    closeDetail: 'Close details ×',
    topSellers: 'Top sellers',
    units: 'units',
    inventory: 'Your inventory',
    addPlant: '+ Add plant',
    thPlant: 'Plant',
    thPrice: 'Price',
    thStock: 'Stock',
    thStatus: 'Status',
    thActions: 'Actions',
    edit: 'Edit',
    remove: 'Remove',
    emptyInventory: 'No plants in your inventory yet. Add the first one.',
    showing: (from: number, to: number, total: number) =>
      `Showing ${from}–${to} of ${total}`,
    pageOf: (page: number, count: number) => `Page ${page} of ${count}`,
    prev: '← Previous',
    next: 'Next →',
    badgeOut: 'Sold out',
    badgeLow: 'Low stock',
    badgeOk: 'For sale',
    modalAdd: 'Add plant',
    modalEdit: 'Edit plant',
    close: 'Close',
    fieldName: 'Name',
    fieldPrice: 'Price',
    fieldStock: 'Stock',
    fieldImage: 'Photo (URL)',
    fieldDescription: 'Description',
    imagePreview: 'Preview',
    errName: 'The name cannot be empty.',
    errPrice: 'The price must be a valid number.',
    errStock: 'The stock must be a whole number.',
    cancel: 'Cancel',
    save: 'Save changes',
    add: 'Add',
    deleteTitle: 'Remove plant',
    deleteBody: (name: string) =>
      `Are you sure you want to remove ${name} from your inventory? You can restore it with “Reset demo data”.`,
    confirmDelete: 'Remove',
    newPlantDescription: 'New plant added during the demo.',
    toBeDefined: 'To be defined.',
    namePlaceholder: 'Philodendron Brasil',
  },
};

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

function normalizeLocalized(value: unknown): Localized {
  if (typeof value === 'string') return { es: value, en: value };
  const record = (value ?? {}) as Partial<Localized>;
  const es = record.es ?? record.en ?? '';
  const en = record.en ?? record.es ?? '';
  return { es, en };
}

function loadState(vendorId: string): DashboardState {
  if (typeof window === 'undefined') return EMPTY_STATE;
  const raw = window.localStorage.getItem(storageKey(vendorId));
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<DashboardState>;
    const overrides: Record<string, ListingOverride> = {};
    for (const [slug, override] of Object.entries(parsed.overrides ?? {})) {
      overrides[slug] = {
        ...override,
        ...(override.description !== undefined
          ? { description: normalizeLocalized(override.description) }
          : {}),
      };
    }
    const added = (parsed.added ?? []).map((plant) => ({
      ...plant,
      description: normalizeLocalized(plant.description),
    }));
    return { overrides, added, removed: parsed.removed ?? [] };
  } catch {
    return EMPTY_STATE;
  }
}

function saveState(vendorId: string, state: DashboardState) {
  window.localStorage.setItem(storageKey(vendorId), JSON.stringify(state));
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

export default function DashboardPage() {
  const { lang } = useLang();
  const copy = COPY[lang];

  const [vendorId, setVendorId] = useState(vendors[0].id);
  const [state, setState] = useState<DashboardState>(EMPTY_STATE);
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [draftError, setDraftError] = useState<
    'errName' | 'errPrice' | 'errStock' | null
  >(null);
  const [pendingDelete, setPendingDelete] = useState<Plant | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs demo state from localStorage after hydration and on vivero switch
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

  const chartData = useMemo(
    () =>
      sales?.monthlyRevenue.map((entry) => ({
        month: entry.month[lang],
        revenue: entry.revenue,
      })) ?? [],
    [sales, lang],
  );

  const monthDetail =
    selectedMonth !== null ? (sales?.monthlyRevenue[selectedMonth] ?? null) : null;

  const stockBadge = (stock: number) => {
    if (stock <= 0) return <span className="badge badge--out">{copy.badgeOut}</span>;
    if (stock < 8) return <span className="badge badge--low">{copy.badgeLow}</span>;
    return <span className="badge badge--ok">{copy.badgeOk}</span>;
  };

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
      description: plant.description[lang],
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
    const descriptionText = draft.description.trim();

    if (!name) {
      setDraftError('errName');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      setDraftError('errPrice');
      return;
    }
    if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      setDraftError('errStock');
      return;
    }

    const existing = draft.slug
      ? listings.find((item) => item.slug === draft.slug)
      : undefined;
    const description: Localized = existing
      ? { ...existing.description, [lang]: descriptionText }
      : { es: descriptionText, en: descriptionText };

    const fields = {
      name,
      price,
      stock,
      image: draft.image.trim(),
      description,
    };

    if (draft.slug === null) {
      const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const toBeDefined: Localized = {
        es: COPY.es.toBeDefined,
        en: COPY.en.toBeDefined,
      };
      const plant: Plant = {
        slug,
        vendorId,
        ...fields,
        description: descriptionText
          ? description
          : {
              es: COPY.es.newPlantDescription,
              en: COPY.en.newPlantDescription,
            },
        care: {
          light: toBeDefined,
          water: toBeDefined,
          soil: toBeDefined,
          commonIssues: toBeDefined,
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
          <span className="pill">{copy.pill}</span>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.7rem)' }}>
            {copy.welcome} {vendor.name}
          </h1>
          <p className="lead" style={{ fontSize: '0.95rem' }}>
            {vendor.location} — {vendor.tagline[lang]}
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
            {copy.viewAs}
            <select
              value={vendorId}
              onChange={(event) => setVendorId(event.target.value)}
              className="input"
              style={{ fontWeight: 600 }}
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
            {copy.reset}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">{copy.orders}</span>
          <span className="display" style={{ fontSize: '2.4rem' }}>
            {sales?.totalSales ?? 0}
          </span>
        </div>
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">{copy.revenue}</span>
          <span className="display" style={{ fontSize: '2.4rem' }}>
            {formatMoney(sales?.revenue ?? 0)}
          </span>
        </div>
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">{copy.avgOrder}</span>
          <span className="display" style={{ fontSize: '2.4rem' }}>
            {formatMoney(avgOrder)}
          </span>
        </div>
        <div className="card" style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          <span className="eyebrow eyebrow--sage">{copy.catalog}</span>
          <span className="display" style={{ fontSize: '2.4rem' }}>
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
          <span className="eyebrow eyebrow--sage">{copy.monthlyRevenue}</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            {copy.chartHint}
          </span>
        </div>
        {sales && (
          <BarChart
            data={chartData}
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
              <h3 className="display" style={{ fontSize: '1.4rem' }}>
                {monthDetail.monthLabel[lang]}
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
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
                  {formatMoney(monthDetail.revenue / monthDetail.orders)}
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <span className="eyebrow eyebrow--sage">{copy.topSellers}</span>
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
                      {item.units} {copy.units}
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
          <h2 style={{ fontSize: '1.4rem' }}>{copy.inventory}</h2>
          <button type="button" onClick={openAdd} className="btn btn--small">
            {copy.addPlant}
          </button>
        </div>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>{copy.thPlant}</th>
                <th>{copy.thPrice}</th>
                <th>{copy.thStock}</th>
                <th>{copy.thStatus}</th>
                <th style={{ textAlign: 'right' }}>{copy.thActions}</th>
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
                        {copy.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(plant)}
                        className="btn btn--danger btn--small"
                      >
                        {copy.remove}
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      color: 'var(--muted)',
                      textAlign: 'center',
                      padding: '2rem 0',
                    }}
                  >
                    {copy.emptyInventory}
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
              {copy.showing(
                (currentPage - 1) * PAGE_SIZE + 1,
                Math.min(currentPage * PAGE_SIZE, listings.length),
                listings.length,
              )}
            </span>
            <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                {copy.prev}
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {copy.pageOf(currentPage, pageCount)}
              </span>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                disabled={currentPage >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                {copy.next}
              </button>
            </span>
          </div>
        )}
      </div>

      {draft && (
        <Modal
          title={draft.slug === null ? copy.modalAdd : copy.modalEdit}
          closeLabel={copy.close}
          onClose={() => setDraft(null)}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            {draft.image.trim() && (
              <span className="thumb" style={{ width: 96, height: 96 }}>
                <img src={draft.image.trim()} alt={copy.imagePreview} />
              </span>
            )}
            <label className="field">
              {copy.fieldName}
              <input
                className="input"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                placeholder={copy.namePlaceholder}
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
                {copy.fieldPrice}
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
                {copy.fieldStock}
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
              {copy.fieldImage}
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
              {copy.fieldDescription}
              <textarea
                className="input"
                rows={3}
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                style={{ resize: 'vertical' }}
              />
            </label>
            {draftError && (
              <p style={{ color: '#9c4a3c', fontSize: '0.9rem', fontWeight: 600 }}>
                {copy[draftError]}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="btn btn--ghost btn--small"
              >
                {copy.cancel}
              </button>
              <button type="button" onClick={saveDraft} className="btn btn--small">
                {draft.slug === null ? copy.add : copy.save}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <Modal
          title={copy.deleteTitle}
          closeLabel={copy.close}
          onClose={() => setPendingDelete(null)}
        >
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <p className="lead" style={{ fontSize: '0.98rem' }}>
              {copy.deleteBody(pendingDelete.name)}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="btn btn--ghost btn--small"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="btn btn--danger btn--small"
              >
                {copy.confirmDelete}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
