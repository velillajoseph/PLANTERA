'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Price from '../../components/shop/Price';
import { useLang } from '../../lib/i18n';
import { useCustomer } from '../../lib/customer-auth';
import { formatMoney } from '../../lib/format';
import { resolveImageUrl } from '../../lib/catalog';
import {
  ApiError,
  changeCustomerPassword,
  getCustomerOrders,
  getFavorites,
  updateCustomerProfile,
  type CustomerOrder,
  type CustomerProfile,
  type FavoriteItem,
} from '../../lib/customer-api';

const COPY = {
  es: {
    tabs: {
      profile: 'Perfil',
      password: 'Contraseña',
      favorites: 'Favoritos',
      orders: 'Pedidos',
    },
    memberSince: (date: string) => `Miembro desde ${date}`,
    firstName: 'Nombre',
    lastName: 'Apellido',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    emailNote: 'El correo es tu identidad de acceso y no se puede cambiar aquí.',
    save: 'Guardar cambios',
    saved: 'Guardado ✓',
    saving: 'Guardando…',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar nueva contraseña',
    changePassword: 'Cambiar contraseña',
    passwordChanged: 'Contraseña actualizada. Cerramos tus otras sesiones.',
    mismatch: 'Las contraseñas no coinciden.',
    tooShort: 'La contraseña debe tener al menos 8 caracteres.',
    loading: 'Cargando…',
    favoritesEmpty: 'Todavía no has guardado ninguna planta.',
    favoritesEmptyCta: 'Explorar la tienda',
    remove: 'Quitar de favoritos',
    ordersEmpty: 'Aún no tienes pedidos.',
    ordersEmptyLead:
      'Cuando completes tu primera compra la verás aquí, con su vivero y guía de cuidado.',
    logout: 'Cerrar sesión',
    error: 'Algo salió mal. Inténtalo de nuevo.',
  },
  en: {
    tabs: {
      profile: 'Profile',
      password: 'Password',
      favorites: 'Favorites',
      orders: 'Orders',
    },
    memberSince: (date: string) => `Member since ${date}`,
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    email: 'Email',
    emailNote: 'Your email is your sign-in identity and cannot be changed here.',
    save: 'Save changes',
    saved: 'Saved ✓',
    saving: 'Saving…',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    changePassword: 'Change password',
    passwordChanged: 'Password updated. Your other sessions were signed out.',
    mismatch: 'Passwords do not match.',
    tooShort: 'Password must be at least 8 characters.',
    loading: 'Loading…',
    favoritesEmpty: 'You have not saved any plants yet.',
    favoritesEmptyCta: 'Browse the shop',
    remove: 'Remove from favorites',
    ordersEmpty: 'No orders yet.',
    ordersEmptyLead:
      'Once you complete your first purchase it will appear here, with its vivero and care guide.',
    logout: 'Log out',
    error: 'Something went wrong. Please try again.',
  },
};

type Tab = 'profile' | 'password' | 'favorites' | 'orders';

const TABS: Tab[] = ['profile', 'password', 'favorites', 'orders'];

const field: React.CSSProperties = { display: 'grid', gap: '0.35rem' };

export default function AccountDashboard({
  customer,
}: {
  customer: CustomerProfile;
}) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const searchParams = useSearchParams();
  const requested = searchParams.get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(
    requested && TABS.includes(requested) ? requested : 'profile',
  );
  const { logout } = useCustomer();

  const memberSince = new Date(customer.created_at).toLocaleDateString(
    lang === 'es' ? 'es-PR' : 'en-US',
    { year: 'numeric', month: 'long' },
  );

  return (
    <div className="container section" style={{ display: 'grid', gap: '2rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <span className="eyebrow eyebrow--sage">{copy.memberSince(memberSince)}</span>
        <h1 className="page-title">
          {customer.first_name} {customer.last_name}
        </h1>
        <p className="lead" style={{ fontSize: '1rem' }}>
          {customer.email}
        </p>
      </header>

      <div className="chip-row" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            className={`chip${tab === key ? ' chip--active' : ''}`}
            onClick={() => setTab(key)}
            aria-current={tab === key}
          >
            {copy.tabs[key]}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileForm customer={customer} copy={copy} />}
      {tab === 'password' && <ChangePasswordForm copy={copy} />}
      {tab === 'favorites' && <FavoritesList copy={copy} />}
      {tab === 'orders' && <OrdersList copy={copy} />}

      <div>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => void logout()}
        >
          {copy.logout}
        </button>
      </div>
    </div>
  );
}

type Copy = (typeof COPY)['es'];

function ProfileForm({
  customer,
  copy,
}: {
  customer: CustomerProfile;
  copy: Copy;
}) {
  const { refresh } = useCustomer();
  const [firstName, setFirstName] = useState(customer.first_name);
  const [lastName, setLastName] = useState(customer.last_name);
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState('saving');
    try {
      await updateCustomerProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      });
      await refresh();
      setState('saved');
    } catch {
      setState('error');
    }
  };

  return (
    <form className="card" onSubmit={submit} style={{ display: 'grid', gap: '1rem', maxWidth: '38rem' }}>
      <div
        className="stack-on-mobile"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}
      >
        <label style={field}>
          <span className="eyebrow">{copy.firstName}</span>
          <input
            className="input"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>
        <label style={field}>
          <span className="eyebrow">{copy.lastName}</span>
          <input
            className="input"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>
      </div>
      <label style={field}>
        <span className="eyebrow">{copy.phone}</span>
        <input
          className="input"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </label>
      <label style={field}>
        <span className="eyebrow">{copy.email}</span>
        <input className="input" value={customer.email} disabled />
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{copy.emailNote}</span>
      </label>
      {state === 'error' && (
        <p role="alert" style={{ color: '#a2452f', fontSize: '0.88rem' }}>
          {copy.error}
        </p>
      )}
      <div>
        <button type="submit" className="btn btn--small" disabled={state === 'saving'}>
          {state === 'saving' ? copy.saving : state === 'saved' ? copy.saved : copy.save}
        </button>
      </div>
    </form>
  );
}

function ChangePasswordForm({ copy }: { copy: Copy }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (next !== confirm) {
      setError(copy.mismatch);
      return;
    }
    if (next.length < 8) {
      setError(copy.tooShort);
      return;
    }

    setState('saving');
    try {
      await changeCustomerPassword(current, next);
      setState('done');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setState('idle');
      setError(err instanceof ApiError ? err.message : copy.error);
    }
  };

  return (
    <form className="card" onSubmit={submit} style={{ display: 'grid', gap: '1rem', maxWidth: '38rem' }}>
      <label style={field}>
        <span className="eyebrow">{copy.currentPassword}</span>
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
        />
      </label>
      <label style={field}>
        <span className="eyebrow">{copy.newPassword}</span>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={next}
          onChange={(event) => setNext(event.target.value)}
        />
      </label>
      <label style={field}>
        <span className="eyebrow">{copy.confirmPassword}</span>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </label>
      {error && (
        <p role="alert" style={{ color: '#a2452f', fontSize: '0.88rem' }}>
          {error}
        </p>
      )}
      {state === 'done' && (
        <p style={{ color: 'var(--green-700)', fontSize: '0.88rem' }}>
          {copy.passwordChanged}
        </p>
      )}
      <div>
        <button type="submit" className="btn btn--small" disabled={state === 'saving'}>
          {state === 'saving' ? copy.saving : copy.changePassword}
        </button>
      </div>
    </form>
  );
}

function FavoritesList({ copy }: { copy: Copy }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const { toggleFavorite, favoriteIds } = useCustomer();

  const load = useCallback(async () => {
    try {
      setItems(await getFavorites());
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial favorites fetch on mount
    void load();
  }, [load]);

  if (state === 'loading') return <p className="lead">{copy.loading}</p>;
  if (state === 'error') return <p className="lead">{copy.error}</p>;

  // Reflect optimistic un-favoriting immediately rather than refetching.
  const visible = items.filter((item) => favoriteIds.has(item.plant.id));

  if (!visible.length) {
    return (
      <div className="card" style={{ display: 'grid', gap: '1rem', justifyItems: 'start' }}>
        <p style={{ color: 'var(--muted)' }}>{copy.favoritesEmpty}</p>
        <Link href="/shop" className="btn btn--small">
          {copy.favoritesEmptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(230px, 100%), 1fr))',
        gap: '1.5rem',
      }}
    >
      {visible.map((favorite) => (
        <article key={favorite.id} style={{ display: 'grid', gap: '0.6rem' }}>
          <Link
            href={`/product/${favorite.plant.id}`}
            className="frame frame--45"
            style={{ display: 'block' }}
          >
            {favorite.plant.image_url && (
              <img
                src={resolveImageUrl(favorite.plant.image_url) ?? undefined}
                alt={favorite.plant.title}
                loading="lazy"
              />
            )}
          </Link>
          <span className="product-card__vivero">{favorite.plant.store_name}</span>
          <Link href={`/product/${favorite.plant.id}`}>
            <h3 className="product-card__name">{favorite.plant.title}</h3>
          </Link>
          <Price
            price={favorite.plant.price}
            original={favorite.plant.original_price}
            className="product-card__price"
          />
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => void toggleFavorite(favorite.plant.id)}
          >
            {copy.remove}
          </button>
        </article>
      ))}
    </div>
  );
}

function OrdersList({ copy }: { copy: Copy }) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    try {
      setOrders(await getCustomerOrders());
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial orders fetch on mount
    void load();
  }, [load]);

  if (state === 'loading') return <p className="lead">{copy.loading}</p>;
  if (state === 'error') return <p className="lead">{copy.error}</p>;

  // Always the empty branch today: checkout is not built, so the API has
  // nothing to return. The layout is here so it lands finished when it is.
  if (!orders.length) {
    return (
      <div className="card" style={{ display: 'grid', gap: '0.75rem', justifyItems: 'start' }}>
        <p style={{ fontWeight: 600 }}>{copy.ordersEmpty}</p>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{copy.ordersEmptyLead}</p>
        <Link href="/shop" className="btn btn--small">
          {copy.favoritesEmptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {orders.map((order) => (
        <article key={order.id} className="card" style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <span style={{ fontWeight: 600 }}>{order.store_name}</span>
            <span className="product-card__price">{formatMoney(order.total)}</span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            {new Date(order.created_at).toLocaleDateString()}
          </span>
          <ul style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem' }}>
            {order.items.map((line, index) => (
              <li key={index}>
                {line.quantity} × {line.plant_name}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
