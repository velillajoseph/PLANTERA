'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '../../../lib/i18n';
import { useVendor } from '../../../lib/vendor-context';
import {
  MAX_DISCOUNT_PERCENT,
  fromUtcNaive,
  toUtcNaive,
  windowLive,
} from '../../../lib/pricing';
import {
  ApiError,
  changePassword,
  clearToken,
  updateProfile,
} from '../../../lib/api';

const COPY = {
  es: {
    title: 'Perfil',
    subtitle: 'La información de tu vivero tal como la verán los compradores.',
    infoTitle: 'Información del vivero',
    fieldName: 'Nombre del vivero',
    fieldPhone: 'Teléfono',
    fieldAddress: 'Ubicación',
    fieldBio: 'Descripción',
    fieldBanner: 'Imagen de portada (URL)',
    fieldMessage: 'Mensaje del panel',
    messageHint: 'Nota interna que aparecerá en tu panel (opcional).',
    save: 'Guardar cambios',
    saving: 'Guardando…',
    saved: 'Cambios guardados.',
    errName: 'El nombre no puede estar vacío.',
    errSave: 'No se pudo guardar. Intenta de nuevo.',
    discountTitle: 'Descuento de tienda',
    discountSubtitle:
      'Aplica un porcentaje a todo tu catálogo. Un descuento puesto en una planta específica manda sobre este.',
    discountLive: (percent: number) => `Ahora mismo: −${percent}% en todo tu catálogo.`,
    discountNone: 'No tienes un descuento de tienda activo.',
    discountPercent: 'Descuento (%)',
    discountStart: 'Empieza',
    discountEnd: 'Termina',
    discountHint: 'Deja las fechas en blanco para que corra hasta que lo apagues.',
    errDiscount: 'El descuento debe ser un número entero entre 0 y 90.',
    errDiscountRange: 'La fecha de fin debe ser posterior a la de inicio.',
    passwordTitle: 'Cambiar contraseña',
    passwordSubtitle:
      'Al cambiarla, cerraremos la sesión en cualquier otro dispositivo.',
    fieldCurrent: 'Contraseña actual',
    fieldNew: 'Nueva contraseña',
    fieldConfirm: 'Confirmar nueva contraseña',
    change: 'Cambiar contraseña',
    changing: 'Cambiando…',
    changed: 'Contraseña actualizada.',
    errCurrent: 'La contraseña actual es incorrecta.',
    errWeak: 'La nueva contraseña debe tener al menos 8 caracteres.',
    errMatch: 'Las contraseñas no coinciden.',
    errChange: 'No se pudo cambiar la contraseña. Intenta de nuevo.',
  },
  en: {
    title: 'Profile',
    subtitle: 'Your vivero information as buyers will see it.',
    infoTitle: 'Vivero information',
    fieldName: 'Vivero name',
    fieldPhone: 'Phone',
    fieldAddress: 'Location',
    fieldBio: 'Description',
    fieldBanner: 'Banner image (URL)',
    fieldMessage: 'Dashboard message',
    messageHint: 'Internal note shown on your dashboard (optional).',
    save: 'Save changes',
    saving: 'Saving…',
    saved: 'Changes saved.',
    errName: 'The name cannot be empty.',
    errSave: 'Could not save. Please try again.',
    discountTitle: 'Store-wide discount',
    discountSubtitle:
      'Apply a percentage across your whole catalog. A discount set on a single listing overrides this one.',
    discountLive: (percent: number) => `Right now: −${percent}% across your catalog.`,
    discountNone: 'No store-wide discount is running.',
    discountPercent: 'Discount (%)',
    discountStart: 'Starts',
    discountEnd: 'Ends',
    discountHint: 'Leave the dates blank to run it until you switch it off.',
    errDiscount: 'The discount must be a whole number between 0 and 90.',
    errDiscountRange: 'The end date must be after the start date.',
    passwordTitle: 'Change password',
    passwordSubtitle:
      'Changing it will log you out on any other device.',
    fieldCurrent: 'Current password',
    fieldNew: 'New password',
    fieldConfirm: 'Confirm new password',
    change: 'Change password',
    changing: 'Changing…',
    changed: 'Password updated.',
    errCurrent: 'The current password is incorrect.',
    errWeak: 'The new password must be at least 8 characters.',
    errMatch: 'The passwords do not match.',
    errChange: 'Could not change the password. Please try again.',
  },
};

export default function ProfilePage() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const router = useRouter();
  const { profile, refreshProfile } = useVendor();

  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone ?? '',
    address: profile.address ?? '',
    bio: profile.bio ?? '',
    banner_image: profile.banner_image ?? '',
    dashboard_message: profile.dashboard_message ?? '',
  });
  const [profileState, setProfileState] = useState<
    'idle' | 'saving' | 'saved' | 'errName' | 'errSave'
  >('idle');

  const [discount, setDiscount] = useState({
    percent: profile.store_discount_percent
      ? String(profile.store_discount_percent)
      : '',
    startsAt: fromUtcNaive(profile.store_discount_starts_at),
    endsAt: fromUtcNaive(profile.store_discount_ends_at),
  });
  const [discountState, setDiscountState] = useState<
    'idle' | 'saving' | 'saved' | 'errPercent' | 'errRange' | 'errSave'
  >('idle');

  const saveDiscount = async (event: FormEvent) => {
    event.preventDefault();
    const percent = discount.percent.trim() ? Number(discount.percent) : 0;
    if (
      Number.isNaN(percent) ||
      !Number.isInteger(percent) ||
      percent < 0 ||
      percent > MAX_DISCOUNT_PERCENT
    ) {
      setDiscountState('errPercent');
      return;
    }
    if (
      discount.startsAt &&
      discount.endsAt &&
      new Date(discount.endsAt) <= new Date(discount.startsAt)
    ) {
      setDiscountState('errRange');
      return;
    }

    setDiscountState('saving');
    try {
      await updateProfile({
        store_discount_percent: percent,
        store_discount_starts_at: toUtcNaive(discount.startsAt),
        store_discount_ends_at: toUtcNaive(discount.endsAt),
      });
      await refreshProfile();
      setDiscountState('saved');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleAuthFailure();
        return;
      }
      setDiscountState('errSave');
    }
  };

  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordState, setPasswordState] = useState<
    'idle' | 'changing' | 'changed' | 'errCurrent' | 'errWeak' | 'errMatch' | 'errChange'
  >('idle');

  const liveNow =
    profile.store_discount_percent > 0 &&
    windowLive(profile.store_discount_starts_at, profile.store_discount_ends_at);

  const handleAuthFailure = () => {
    clearToken();
    router.replace('/acceso/login');
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setProfileState('errName');
      return;
    }
    setProfileState('saving');
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        bio: form.bio.trim() || null,
        banner_image: form.banner_image.trim() || null,
        dashboard_message: form.dashboard_message.trim() || null,
      });
      await refreshProfile();
      setProfileState('saved');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleAuthFailure();
        return;
      }
      setProfileState('errSave');
    }
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwords.next.length < 8) {
      setPasswordState('errWeak');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordState('errMatch');
      return;
    }
    setPasswordState('changing');
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordState('changed');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleAuthFailure();
        return;
      }
      if (err instanceof ApiError && err.status === 400) {
        setPasswordState('errCurrent');
        return;
      }
      setPasswordState('errChange');
    }
  };

  const feedback = (
    state: string,
    map: Partial<Record<string, { text: string; error: boolean }>>,
  ) => {
    const entry = map[state];
    if (!entry) return null;
    return (
      <p
        role={entry.error ? 'alert' : 'status'}
        style={{
          color: entry.error ? '#9c4a3c' : 'var(--green-700)',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}
      >
        {entry.text}
      </p>
    );
  };

  return (
    <div className="container section" style={{ display: 'grid', gap: '1.75rem' }}>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <h1 className="page-title">{copy.title}</h1>
        <p className="lead" style={{ fontSize: '0.95rem' }}>
          {copy.subtitle}
        </p>
      </div>

      <form
        onSubmit={saveProfile}
        className="card"
        style={{ display: 'grid', gap: '1rem', maxWidth: '720px' }}
      >
        <h2 style={{ fontSize: '1.3rem' }}>{copy.infoTitle}</h2>
        <label className="field">
          {copy.fieldName}
          <input
            className="input"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <div
          className="stack-on-mobile"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
        >
          <label className="field">
            {copy.fieldPhone}
            <input
              className="input"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+1 787 555 0123"
            />
          </label>
          <label className="field">
            {copy.fieldAddress}
            <input
              className="input"
              value={form.address}
              onChange={(event) =>
                setForm({ ...form, address: event.target.value })
              }
              placeholder="Caguas, PR"
            />
          </label>
        </div>
        <label className="field">
          {copy.fieldBio}
          <textarea
            className="input"
            rows={3}
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
            style={{ resize: 'vertical' }}
          />
        </label>
        <label className="field">
          {copy.fieldBanner}
          <input
            className="input"
            value={form.banner_image}
            onChange={(event) =>
              setForm({ ...form, banner_image: event.target.value })
            }
            placeholder="https://…"
          />
        </label>
        <label className="field">
          {copy.fieldMessage}
          <input
            className="input"
            value={form.dashboard_message}
            onChange={(event) =>
              setForm({ ...form, dashboard_message: event.target.value })
            }
          />
        </label>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
          {copy.messageHint}
        </p>
        {feedback(profileState, {
          saved: { text: copy.saved, error: false },
          errName: { text: copy.errName, error: true },
          errSave: { text: copy.errSave, error: true },
        })}
        <div>
          <button
            type="submit"
            className="btn btn--small"
            disabled={profileState === 'saving'}
          >
            {profileState === 'saving' ? copy.saving : copy.save}
          </button>
        </div>
      </form>

      <form
        onSubmit={saveDiscount}
        className="card"
        style={{ display: 'grid', gap: '1rem', maxWidth: '720px' }}
      >
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <h2 style={{ fontSize: '1.3rem' }}>{copy.discountTitle}</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            {copy.discountSubtitle}
          </p>
        </div>

        <p
          style={{
            fontSize: '0.92rem',
            fontWeight: 600,
            color: liveNow ? 'var(--green-700)' : 'var(--muted)',
          }}
        >
          {liveNow
            ? copy.discountLive(profile.store_discount_percent)
            : copy.discountNone}
        </p>

        <div
          className="stack-on-mobile"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}
        >
          <label className="field">
            {copy.discountPercent}
            <input
              className="input"
              type="number"
              min="0"
              max={MAX_DISCOUNT_PERCENT}
              step="1"
              value={discount.percent}
              onChange={(event) =>
                setDiscount({ ...discount, percent: event.target.value })
              }
              placeholder="0"
            />
          </label>
          <label className="field">
            {copy.discountStart}
            <input
              className="input"
              type="datetime-local"
              value={discount.startsAt}
              onChange={(event) =>
                setDiscount({ ...discount, startsAt: event.target.value })
              }
            />
          </label>
          <label className="field">
            {copy.discountEnd}
            <input
              className="input"
              type="datetime-local"
              value={discount.endsAt}
              onChange={(event) =>
                setDiscount({ ...discount, endsAt: event.target.value })
              }
            />
          </label>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
          {copy.discountHint}
        </p>
        {feedback(discountState, {
          saved: { text: copy.saved, error: false },
          errPercent: { text: copy.errDiscount, error: true },
          errRange: { text: copy.errDiscountRange, error: true },
          errSave: { text: copy.errSave, error: true },
        })}
        <div>
          <button
            type="submit"
            className="btn btn--small"
            disabled={discountState === 'saving'}
          >
            {discountState === 'saving' ? copy.saving : copy.save}
          </button>
        </div>
      </form>

      <form
        onSubmit={submitPassword}
        className="card"
        style={{ display: 'grid', gap: '1rem', maxWidth: '720px' }}
      >
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <h2 style={{ fontSize: '1.3rem' }}>{copy.passwordTitle}</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            {copy.passwordSubtitle}
          </p>
        </div>
        <label className="field">
          {copy.fieldCurrent}
          <input
            className="input"
            type="password"
            required
            autoComplete="current-password"
            value={passwords.current}
            onChange={(event) =>
              setPasswords({ ...passwords, current: event.target.value })
            }
          />
        </label>
        <div
          className="stack-on-mobile"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
        >
          <label className="field">
            {copy.fieldNew}
            <input
              className="input"
              type="password"
              required
              autoComplete="new-password"
              value={passwords.next}
              onChange={(event) =>
                setPasswords({ ...passwords, next: event.target.value })
              }
            />
          </label>
          <label className="field">
            {copy.fieldConfirm}
            <input
              className="input"
              type="password"
              required
              autoComplete="new-password"
              value={passwords.confirm}
              onChange={(event) =>
                setPasswords({ ...passwords, confirm: event.target.value })
              }
            />
          </label>
        </div>
        {feedback(passwordState, {
          changed: { text: copy.changed, error: false },
          errCurrent: { text: copy.errCurrent, error: true },
          errWeak: { text: copy.errWeak, error: true },
          errMatch: { text: copy.errMatch, error: true },
          errChange: { text: copy.errChange, error: true },
        })}
        <div>
          <button
            type="submit"
            className="btn btn--small"
            disabled={passwordState === 'changing'}
          >
            {passwordState === 'changing' ? copy.changing : copy.change}
          </button>
        </div>
      </form>
    </div>
  );
}
