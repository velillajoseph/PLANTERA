'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Modal from '../../../components/Modal';
import ImageUploader from '../../../components/ImageUploader';
import { formatMoney } from '../../../lib/format';
import { useLang } from '../../../lib/i18n';
import { resolveImageUrl } from '../../../lib/catalog';
import {
  ApiError,
  clearToken,
  createInventoryItem,
  deleteInventoryItem,
  getInventory,
  removeInventoryImage,
  updateInventoryItem,
  uploadInventoryImage,
  type InventoryItem,
} from '../../../lib/api';

const PAGE_SIZE = 10;
const LOW_STOCK_THRESHOLD = 8;

type StatusFilter = 'all' | 'ok' | 'low' | 'out' | 'paused';
type SortKey = 'name' | 'price' | 'stock';

const COPY = {
  es: {
    title: 'Inventario',
    subtitle: 'Administra tus plantas: precios, disponibilidad, fotos y destacados.',
    loading: 'Cargando inventario…',
    errLoad: 'No pudimos cargar tu inventario. ¿Está corriendo el backend?',
    retry: 'Reintentar',
    addPlant: '+ Agregar planta',
    search: 'Buscar por nombre…',
    filterLabel: 'Estado',
    filters: {
      all: 'Todas',
      ok: 'En venta',
      low: 'Poco inventario',
      out: 'Agotadas',
      paused: 'Pausadas',
    } as Record<StatusFilter, string>,
    sortLabel: 'Ordenar por',
    sorts: { name: 'Nombre', price: 'Precio', stock: 'Inventario' } as Record<
      SortKey,
      string
    >,
    thPlant: 'Planta',
    thPrice: 'Precio',
    thStock: 'Inventario',
    thStatus: 'Estado',
    thFeatured: 'Destacada',
    thActions: 'Acciones',
    featuredYes: 'Sí',
    featuredNo: '—',
    edit: 'Editar',
    remove: 'Eliminar',
    emptyFiltered: 'Ninguna planta coincide con tu búsqueda.',
    emptyInventory: 'No hay plantas en tu inventario. Agrega la primera.',
    showing: (from: number, to: number, total: number) =>
      `Mostrando ${from}–${to} de ${total}`,
    pageOf: (page: number, count: number) => `Página ${page} de ${count}`,
    prev: '← Anterior',
    next: 'Siguiente →',
    badgeOut: 'Agotado',
    badgeLow: 'Poco inventario',
    badgeOk: 'En venta',
    badgePaused: 'Pausada',
    pause: 'Pausar',
    activate: 'Activar',
    pausedNote: 'Esta planta no aparece en la tienda.',
    errPhoto: 'Añade una foto de la planta.',
    errUpload: 'La planta se guardó, pero la foto no se pudo subir.',
    modalAdd: 'Agregar planta',
    modalEdit: 'Editar planta',
    close: 'Cerrar',
    fieldName: 'Nombre',
    fieldPrice: 'Precio',
    fieldStock: 'Inventario',
    fieldImage: 'Foto (URL)',
    fieldDescription: 'Descripción',
    fieldTags: 'Etiquetas (separadas por coma)',
    fieldGenus: 'Género',
    genusHint: 'Ej. Monstera, Ficus. Agrupa la planta en la tienda y su guía de cuidado.',
    fieldCategory: 'Categoría',
    categories: { plant: 'Planta', pot: 'Maceta', supply: 'Accesorio' } as Record<string, string>,
    fieldFeatured: 'Planta destacada',
    featuredHint: 'Las plantas destacadas aparecerán primero en el catálogo de Plantera.',
    imagePreview: 'Vista previa',
    errName: 'El nombre no puede estar vacío.',
    errPrice: 'El precio debe ser mayor que cero.',
    errStock: 'El inventario debe ser un número entero.',
    errSave: 'No se pudo guardar. Intenta de nuevo.',
    cancel: 'Cancelar',
    save: 'Guardar cambios',
    add: 'Agregar',
    deleteTitle: 'Eliminar planta',
    deleteBody: (name: string) =>
      `¿Seguro que quieres eliminar ${name} de tu inventario? Esta acción no se puede deshacer.`,
    confirmDelete: 'Eliminar',
    namePlaceholder: 'Filodendro Brasil',
    tagsPlaceholder: 'tropical, interior, fácil cuidado',
  },
  en: {
    title: 'Inventory',
    subtitle: 'Manage your plants: pricing, availability, photos, and featured picks.',
    loading: 'Loading inventory…',
    errLoad: 'We could not load your inventory. Is the backend running?',
    retry: 'Retry',
    addPlant: '+ Add plant',
    search: 'Search by name…',
    filterLabel: 'Status',
    filters: {
      all: 'All',
      ok: 'For sale',
      low: 'Low stock',
      out: 'Sold out',
      paused: 'Paused',
    } as Record<StatusFilter, string>,
    sortLabel: 'Sort by',
    sorts: { name: 'Name', price: 'Price', stock: 'Stock' } as Record<
      SortKey,
      string
    >,
    thPlant: 'Plant',
    thPrice: 'Price',
    thStock: 'Stock',
    thStatus: 'Status',
    thFeatured: 'Featured',
    thActions: 'Actions',
    featuredYes: 'Yes',
    featuredNo: '—',
    edit: 'Edit',
    remove: 'Remove',
    emptyFiltered: 'No plants match your search.',
    emptyInventory: 'No plants in your inventory yet. Add the first one.',
    showing: (from: number, to: number, total: number) =>
      `Showing ${from}–${to} of ${total}`,
    pageOf: (page: number, count: number) => `Page ${page} of ${count}`,
    prev: '← Previous',
    next: 'Next →',
    badgeOut: 'Sold out',
    badgeLow: 'Low stock',
    badgeOk: 'For sale',
    badgePaused: 'Paused',
    pause: 'Pause',
    activate: 'Activate',
    pausedNote: 'This plant does not appear in the shop.',
    errPhoto: 'Add a photo of the plant.',
    errUpload: 'The plant was saved, but the photo could not be uploaded.',
    modalAdd: 'Add plant',
    modalEdit: 'Edit plant',
    close: 'Close',
    fieldName: 'Name',
    fieldPrice: 'Price',
    fieldStock: 'Stock',
    fieldImage: 'Photo (URL)',
    fieldDescription: 'Description',
    fieldTags: 'Tags (comma-separated)',
    fieldGenus: 'Genus',
    genusHint: 'e.g. Monstera, Ficus. Groups the plant in the shop and its care guide.',
    fieldCategory: 'Category',
    categories: { plant: 'Plant', pot: 'Pot', supply: 'Supply' } as Record<string, string>,
    fieldFeatured: 'Featured plant',
    featuredHint: 'Featured plants will appear first in the Plantera catalog.',
    imagePreview: 'Preview',
    errName: 'The name cannot be empty.',
    errPrice: 'The price must be greater than zero.',
    errStock: 'The stock must be a whole number.',
    errSave: 'Could not save. Please try again.',
    cancel: 'Cancel',
    save: 'Save changes',
    add: 'Add',
    deleteTitle: 'Remove plant',
    deleteBody: (name: string) =>
      `Are you sure you want to remove ${name} from your inventory? This cannot be undone.`,
    confirmDelete: 'Remove',
    namePlaceholder: 'Philodendron Brasil',
    tagsPlaceholder: 'tropical, indoor, easy care',
  },
};

type Draft = {
  id: number | null;
  name: string;
  price: string;
  stock: string;
  image: string;
  photoFile: File | null;
  clearPhoto: boolean;
  description: string;
  tags: string;
  genus: string;
  category: string;
  featured: boolean;
};

const EMPTY_DRAFT: Draft = {
  id: null,
  name: '',
  price: '',
  stock: '',
  image: '',
  photoFile: null,
  clearPhoto: false,
  description: '',
  tags: '',
  genus: '',
  category: 'plant',
  featured: false,
};

function itemStatus(item: InventoryItem): StatusFilter {
  // Pause is a deliberate vendor decision, so it outranks stock level.
  if (!item.is_active) return 'paused';
  if (item.stock <= 0) return 'out';
  if (item.stock < LOW_STOCK_THRESHOLD) return 'low';
  return 'ok';
}

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

function InventoryContent() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [page, setPage] = useState(1);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState<
    'errName' | 'errPrice' | 'errStock' | 'errSave' | 'errPhoto' | 'errUpload' | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<InventoryItem | null>(null);

  const handleAuthFailure = useCallback(() => {
    clearToken();
    router.replace('/acceso/login');
  }, [router]);

  const load = useCallback(async () => {
    try {
      setItems(await getInventory());
      setState('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleAuthFailure();
        return;
      }
      setState('error');
    }
  }, [handleAuthFailure]);

  const retry = () => {
    setState('loading');
    void load();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    void load();
  }, [load]);

  const openEdit = useCallback((item: InventoryItem) => {
    setDraftError(null);
    setDraft({
      id: item.id,
      name: item.plant_name,
      price: item.price.toFixed(2),
      stock: String(item.stock),
      image: item.image_url ?? '',
      photoFile: null,
      clearPhoto: false,
      description: item.description ?? '',
      tags: item.tags ?? '',
      genus: item.genus ?? '',
      category: item.category ?? 'plant',
      featured: item.is_featured,
    });
  }, []);

  // Deep link from the dashboard's low-stock card: /acceso/inventory?edit=<id>
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || state !== 'ready') return;
    const target = items.find((item) => item.id === Number(editId));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs modal state from the URL once inventory is loaded
    if (target) openEdit(target);
    router.replace('/acceso/inventory');
  }, [searchParams, state, items, openEdit, router]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = items.filter((item) => {
      if (query && !item.plant_name.toLowerCase().includes(query)) return false;
      if (status !== 'all' && itemStatus(item) !== status) return false;
      return true;
    });
    const sorted = [...result];
    if (sortKey === 'name') {
      sorted.sort((a, b) => a.plant_name.localeCompare(b.plant_name));
    } else if (sortKey === 'price') {
      sorted.sort((a, b) => a.price - b.price);
    } else {
      sorted.sort((a, b) => a.stock - b.stock);
    }
    return sorted;
  }, [items, search, status, sortKey]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const statusBadge = (item: InventoryItem) => {
    if (!item.is_active)
      return (
        <span
          className="badge"
          style={{ color: 'var(--muted)', borderColor: 'var(--line)' }}
        >
          {copy.badgePaused}
        </span>
      );
    if (item.stock <= 0)
      return <span className="badge badge--out">{copy.badgeOut}</span>;
    if (item.stock < LOW_STOCK_THRESHOLD)
      return <span className="badge badge--low">{copy.badgeLow}</span>;
    return <span className="badge badge--ok">{copy.badgeOk}</span>;
  };

  const togglePause = async (item: InventoryItem) => {
    try {
      await updateInventoryItem(item.id, { is_active: !item.is_active });
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) handleAuthFailure();
    }
  };

  const saveDraft = async () => {
    if (!draft || saving) return;
    const name = draft.name.trim();
    const price = Number(draft.price);
    const stock = Number(draft.stock);

    if (!name) {
      setDraftError('errName');
      return;
    }
    if (Number.isNaN(price) || price <= 0) {
      setDraftError('errPrice');
      return;
    }
    if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      setDraftError('errStock');
      return;
    }
    // A listing without a photo is not sellable, so require one up front.
    const willHavePhoto = Boolean(
      draft.photoFile || (draft.image && !draft.clearPhoto),
    );
    if (!willHavePhoto) {
      setDraftError('errPhoto');
      return;
    }

    const payload = {
      plant_name: name,
      price,
      stock,
      description: draft.description.trim() || null,
      tags: draft.tags.trim() || null,
      genus: draft.genus.trim() || null,
      category: draft.category,
      is_featured: draft.featured,
    };

    setSaving(true);
    try {
      // A new item has no id yet, so it is created first and the photo is
      // attached in a second call.
      const saved =
        draft.id === null
          ? await createInventoryItem(payload)
          : await updateInventoryItem(draft.id, payload);

      if (draft.photoFile) {
        await uploadInventoryImage(saved.id, draft.photoFile);
      } else if (draft.clearPhoto && draft.id !== null) {
        await removeInventoryImage(saved.id);
      }

      setDraft(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleAuthFailure();
        return;
      }
      setDraftError('errSave');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteInventoryItem(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) handleAuthFailure();
      else setPendingDelete(null);
    }
  };

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
        <button
          type="button"
          onClick={() => {
            setDraftError(null);
            setDraft({ ...EMPTY_DRAFT });
          }}
          className="btn btn--small"
        >
          {copy.addPlant}
        </button>
      </div>

      <div className="card" style={{ display: 'grid', gap: '1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          <input
            className="input"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={copy.search}
            aria-label={copy.search}
          />
          <label className="field">
            {copy.filterLabel}
            <select
              className="input"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setPage(1);
              }}
            >
              {(Object.keys(copy.filters) as StatusFilter[]).map((key) => (
                <option key={key} value={key}>
                  {copy.filters[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {copy.sortLabel}
            <select
              className="input"
              value={sortKey}
              onChange={(event) => {
                setSortKey(event.target.value as SortKey);
                setPage(1);
              }}
            >
              {(Object.keys(copy.sorts) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {copy.sorts[key]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{copy.thPlant}</th>
                <th>{copy.thPrice}</th>
                <th>{copy.thStock}</th>
                <th>{copy.thStatus}</th>
                <th>{copy.thFeatured}</th>
                <th style={{ textAlign: 'right' }}>{copy.thActions}</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr
                  key={item.id}
                  style={{ opacity: item.is_active ? 1 : 0.55 }}
                >
                  <td>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      <Thumb item={item} />
                      <span style={{ display: 'grid' }}>
                        {item.plant_name}
                        {item.tags && (
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 500,
                              color: 'var(--muted)',
                            }}
                          >
                            {item.tags}
                          </span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatMoney(item.price)}</td>
                  <td>{item.stock}</td>
                  <td>{statusBadge(item)}</td>
                  <td
                    style={{
                      color: item.is_featured ? 'var(--gold)' : 'var(--muted)',
                      fontWeight: 600,
                    }}
                  >
                    {item.is_featured ? copy.featuredYes : copy.featuredNo}
                  </td>
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
                        onClick={() => openEdit(item)}
                        className="btn btn--ghost btn--small"
                      >
                        {copy.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => void togglePause(item)}
                        className="btn btn--ghost btn--small"
                        title={item.is_active ? undefined : copy.pausedNote}
                      >
                        {item.is_active ? copy.pause : copy.activate}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item)}
                        className="btn btn--danger btn--small"
                      >
                        {copy.remove}
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      color: 'var(--muted)',
                      textAlign: 'center',
                      padding: '2rem 0',
                    }}
                  >
                    {items.length === 0 ? copy.emptyInventory : copy.emptyFiltered}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
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
                (currentPage - 1) * PAGE_SIZE + 1,
                Math.min(currentPage * PAGE_SIZE, filtered.length),
                filtered.length,
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
          title={draft.id === null ? copy.modalAdd : copy.modalEdit}
          closeLabel={copy.close}
          onClose={() => setDraft(null)}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
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
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
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
            <ImageUploader
              currentUrl={draft.clearPhoto ? null : draft.image || null}
              disabled={saving}
              onFileSelected={(file) =>
                setDraft((current) =>
                  current
                    ? { ...current, photoFile: file, clearPhoto: false }
                    : current,
                )
              }
              onRemove={() =>
                setDraft((current) =>
                  current
                    ? { ...current, photoFile: null, clearPhoto: true, image: '' }
                    : current,
                )
              }
            />
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
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
            >
              <label className="field">
                {copy.fieldGenus}
                <input
                  className="input"
                  value={draft.genus}
                  onChange={(event) =>
                    setDraft({ ...draft, genus: event.target.value })
                  }
                  placeholder="Monstera"
                />
              </label>
              <label className="field">
                {copy.fieldCategory}
                <select
                  className="input"
                  value={draft.category}
                  onChange={(event) =>
                    setDraft({ ...draft, category: event.target.value })
                  }
                >
                  {Object.entries(copy.categories).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '-0.5rem' }}>
              {copy.genusHint}
            </p>
            <label className="field">
              {copy.fieldTags}
              <input
                className="input"
                value={draft.tags}
                onChange={(event) =>
                  setDraft({ ...draft, tags: event.target.value })
                }
                placeholder={copy.tagsPlaceholder}
              />
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(event) =>
                  setDraft({ ...draft, featured: event.target.checked })
                }
                style={{ width: 18, height: 18, accentColor: 'var(--green-700)' }}
              />
              {copy.fieldFeatured}
            </label>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              {copy.featuredHint}
            </p>
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
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="btn btn--small"
              >
                {draft.id === null ? copy.add : copy.save}
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
              {copy.deleteBody(pendingDelete.plant_name)}
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

export default function InventoryPage() {
  return (
    <Suspense>
      <InventoryContent />
    </Suspense>
  );
}
