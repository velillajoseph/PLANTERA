'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Logo, { LeafMark } from '../../components/Logo';
import LangToggle from '../../components/LangToggle';
import { vendorLogin, setToken, ApiError } from '../../lib/api';
import { useLang } from '../../lib/i18n';

const COPY = {
  es: {
    eyebrow: 'Portal de viveros',
    title: 'Accede a tu vivero',
    lead: 'Administra tu inventario, precios y ventas desde tu panel personalizado.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    submit: 'Iniciar sesión',
    loading: 'Verificando…',
    errInvalid: 'Correo o contraseña incorrectos.',
    errNetwork: 'No pudimos conectar con el servidor. ¿Está corriendo el backend?',
    note: '¿Aún no tienes cuenta? El registro de viveros se coordina directamente con el equipo de Plantera.',
  },
  en: {
    eyebrow: 'Vivero portal',
    title: 'Access your vivero',
    lead: 'Manage your inventory, pricing, and sales from your personalized dashboard.',
    email: 'Email',
    password: 'Password',
    submit: 'Log in',
    loading: 'Verifying…',
    errInvalid: 'Incorrect email or password.',
    errNetwork: 'Could not reach the server. Is the backend running?',
    note: 'No account yet? Vivero registration is coordinated directly with the Plantera team.',
  },
};

export default function VendorLoginPage() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [error, setError] = useState<'errInvalid' | 'errNetwork' | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);
    try {
      const result = await vendorLogin(email.trim(), password);
      setToken(result.token);
      router.push('/acceso');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof ApiError ? 'errInvalid' : 'errNetwork');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '1.25rem',
          paddingBottom: '1.25rem',
          width: '100%',
        }}
      >
        <Logo />
        <LangToggle />
      </div>
      <div
        className="container"
        style={{
          display: 'grid',
          placeItems: 'center',
          paddingBottom: '4rem',
          width: '100%',
        }}
      >
      <div
        className="card"
        style={{
          width: 'min(440px, 100%)',
          display: 'grid',
          gap: '1.5rem',
          padding: '2.5rem',
        }}
      >
        <div style={{ display: 'grid', gap: '0.9rem', justifyItems: 'center' }}>
          <LeafMark size={40} />
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1 style={{ fontSize: '1.8rem', textAlign: 'center' }}>
            {copy.title}
          </h1>
          <p className="lead" style={{ fontSize: '0.95rem', textAlign: 'center' }}>
            {copy.lead}
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: '1rem' }}>
          <label className="field">
            {copy.email}
            <input
              className="input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vivero@plantera.pr"
            />
          </label>
          <label className="field">
            {copy.password}
            <input
              className="input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>
          {error && (
            <p
              role="alert"
              style={{ color: '#9c4a3c', fontSize: '0.9rem', fontWeight: 600 }}
            >
              {copy[error]}
            </p>
          )}
          <button
            type="submit"
            className="btn"
            disabled={status === 'loading'}
            style={{ justifyContent: 'center' }}
          >
            {status === 'loading' ? copy.loading : copy.submit}
          </button>
        </form>

        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center' }}>
          {copy.note}
        </p>
      </div>
      </div>
    </div>
  );
}
