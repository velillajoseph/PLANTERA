'use client';

import Modal from './Modal';
import { useLang } from '../lib/i18n';

const COPY = {
  es: {
    title: 'Tu sesión está por cerrarse',
    body: (seconds: number) =>
      `Por seguridad cerraremos tu sesión en ${seconds} segundo${
        seconds === 1 ? '' : 's'
      } por inactividad.`,
    stay: 'Seguir conectado',
    logout: 'Cerrar sesión ahora',
    close: 'Seguir conectado',
  },
  en: {
    title: 'Your session is about to end',
    body: (seconds: number) =>
      `For your security we will sign you out in ${seconds} second${
        seconds === 1 ? '' : 's'
      } of inactivity.`,
    stay: 'Stay signed in',
    logout: 'Sign out now',
    close: 'Stay signed in',
  },
};

export default function IdleWarningModal({
  open,
  secondsLeft,
  onStay,
  onLogout,
}: {
  open: boolean;
  secondsLeft: number;
  onStay: () => void;
  onLogout: () => void;
}) {
  const { lang } = useLang();
  const copy = COPY[lang];

  if (!open) return null;

  return (
    // Escape and backdrop clicks map to "stay": dismissing the prompt is itself
    // an act of presence, and it avoids a dead end where Escape does nothing.
    <Modal title={copy.title} closeLabel={copy.close} onClose={onStay}>
      <div style={{ display: 'grid', gap: '1.25rem', marginTop: '0.75rem' }}>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }} aria-live="assertive">
          {copy.body(secondsLeft)}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={onStay}
            // Keyboard users land on the safe action rather than the destructive one.
            autoFocus
          >
            {copy.stay}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onLogout}>
            {copy.logout}
          </button>
        </div>
      </div>
    </Modal>
  );
}
