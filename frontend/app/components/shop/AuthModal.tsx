'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Modal from '../Modal';
import { useLang } from '../../lib/i18n';
import { useCustomer } from '../../lib/customer-auth';
import {
  ApiError,
  customerRegister,
  customerResendCode,
  customerVerify,
} from '../../lib/customer-api';

const COPY = {
  es: {
    loginTitle: 'Entrar a tu cuenta',
    registerTitle: 'Crear cuenta',
    verifyTitle: 'Verifica tu correo',
    close: 'Cerrar',
    email: 'Correo electrónico',
    password: 'Contraseña',
    firstName: 'Nombre',
    lastName: 'Apellido',
    phone: 'Teléfono (opcional)',
    code: 'Código de 6 dígitos',
    signIn: 'Entrar',
    createAccount: 'Crear cuenta',
    verifyCta: 'Verificar',
    resend: 'Reenviar código',
    noAccount: '¿No tienes cuenta?',
    haveAccount: '¿Ya tienes cuenta?',
    switchToRegister: 'Créala aquí',
    switchToLogin: 'Entra aquí',
    verifyLead: (email: string) =>
      `Enviamos un código de 6 dígitos a ${email}. Escríbelo para activar tu cuenta.`,
    registerLead: 'Guarda tus favoritos y sigue tus pedidos.',
    loginLead: 'Bienvenida de vuelta al jardín.',
    working: 'Un momento…',
    codeSent: 'Código reenviado.',
    errUnverified: 'Tu correo aún no está verificado. Escribe el código que te enviamos.',
    errCredentials: 'Correo o contraseña incorrectos.',
    errShortPassword: 'La contraseña debe tener al menos 8 caracteres.',
    errGeneric: 'Algo salió mal. Inténtalo de nuevo.',
    errOffline: 'No pudimos conectar. ¿Está corriendo el servidor?',
    devCode: (code: string) => `Código de prueba: ${code}`,
  },
  en: {
    loginTitle: 'Sign in to your account',
    registerTitle: 'Create an account',
    verifyTitle: 'Verify your email',
    close: 'Close',
    email: 'Email',
    password: 'Password',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone (optional)',
    code: '6-digit code',
    signIn: 'Sign in',
    createAccount: 'Create account',
    verifyCta: 'Verify',
    resend: 'Resend code',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    switchToRegister: 'Create one',
    switchToLogin: 'Sign in',
    verifyLead: (email: string) =>
      `We sent a 6-digit code to ${email}. Enter it to activate your account.`,
    registerLead: 'Save your favorites and follow your orders.',
    loginLead: 'Welcome back to the garden.',
    working: 'One moment…',
    codeSent: 'Code resent.',
    errUnverified: 'Your email is not verified yet. Enter the code we sent you.',
    errCredentials: 'Wrong email or password.',
    errShortPassword: 'Password must be at least 8 characters.',
    errGeneric: 'Something went wrong. Please try again.',
    errOffline: 'We could not connect. Is the server running?',
    devCode: (code: string) => `Test code: ${code}`,
  },
};

const field: React.CSSProperties = { display: 'grid', gap: '0.35rem' };

export default function AuthModal() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const { authMode, closeAuth, openAuth, login, pendingEmail } = useCustomer();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!authMode) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets transient form state when the modal opens
    setError('');
    setNotice('');
    if (pendingEmail) setEmail(pendingEmail);
  }, [authMode, pendingEmail]);

  if (!authMode) return null;

  const describe = (err: unknown): string => {
    if (!(err instanceof ApiError)) return copy.errOffline;
    if (err.status === 401) return copy.errCredentials;
    if (err.status === 400 && err.message.toLowerCase().includes('password')) {
      return copy.errShortPassword;
    }
    if (err.status === 400 || err.status === 404) return err.message;
    return copy.errGeneric;
  };

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      // The API answers 403 for a correct password on an unverified account,
      // so the modal can move straight to the code step instead of lying.
      if (err instanceof ApiError && err.status === 403) {
        setError(copy.errUnverified);
        openAuth('verify', email);
      } else {
        setError(describe(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await customerRegister({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        password,
      });
      openAuth('verify', email);
      if (result.verification_preview) {
        setNotice(copy.devCode(result.verification_preview));
      }
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  const submitVerify = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await customerVerify(email, code.trim());
      // Verification proves the password too, so sign in rather than making
      // someone retype credentials they entered thirty seconds ago.
      await login(email, password);
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await customerResendCode(email);
      setNotice(
        result.verification_preview
          ? copy.devCode(result.verification_preview)
          : copy.codeSent,
      );
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  const title =
    authMode === 'login'
      ? copy.loginTitle
      : authMode === 'register'
        ? copy.registerTitle
        : copy.verifyTitle;

  const messages = (
    <>
      {error && (
        <p role="alert" style={{ color: '#a2452f', fontSize: '0.88rem' }}>
          {error}
        </p>
      )}
      {notice && (
        <p style={{ color: 'var(--green-700)', fontSize: '0.88rem' }}>{notice}</p>
      )}
    </>
  );

  return (
    <Modal title={title} closeLabel={copy.close} onClose={closeAuth}>
      {authMode === 'login' && (
        <form onSubmit={submitLogin} style={{ display: 'grid', gap: '1rem', marginTop: '0.5rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>{copy.loginLead}</p>
          <label style={field}>
            <span className="eyebrow">{copy.email}</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label style={field}>
            <span className="eyebrow">{copy.password}</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {messages}
          <button type="submit" className="btn" disabled={busy} style={{ justifyContent: 'center' }}>
            {busy ? copy.working : copy.signIn}
          </button>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            {copy.noAccount}{' '}
            <button
              type="button"
              onClick={() => openAuth('register', email)}
              style={{ background: 'none', border: 'none', color: 'var(--green-700)', fontWeight: 600 }}
            >
              {copy.switchToRegister}
            </button>
          </p>
        </form>
      )}

      {authMode === 'register' && (
        <form
          onSubmit={submitRegister}
          style={{ display: 'grid', gap: '1rem', marginTop: '0.5rem' }}
        >
          <p style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>{copy.registerLead}</p>
          <div className="stack-on-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={field}>
              <span className="eyebrow">{copy.firstName}</span>
              <input
                className="input"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </label>
            <label style={field}>
              <span className="eyebrow">{copy.lastName}</span>
              <input
                className="input"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </label>
          </div>
          <label style={field}>
            <span className="eyebrow">{copy.email}</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label style={field}>
            <span className="eyebrow">{copy.phone}</span>
            <input
              className="input"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label style={field}>
            <span className="eyebrow">{copy.password}</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {messages}
          <button type="submit" className="btn" disabled={busy} style={{ justifyContent: 'center' }}>
            {busy ? copy.working : copy.createAccount}
          </button>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            {copy.haveAccount}{' '}
            <button
              type="button"
              onClick={() => openAuth('login', email)}
              style={{ background: 'none', border: 'none', color: 'var(--green-700)', fontWeight: 600 }}
            >
              {copy.switchToLogin}
            </button>
          </p>
        </form>
      )}

      {authMode === 'verify' && (
        <form onSubmit={submitVerify} style={{ display: 'grid', gap: '1rem', marginTop: '0.5rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>{copy.verifyLead(email)}</p>
          <label style={field}>
            <span className="eyebrow">{copy.code}</span>
            <input
              className="input"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              style={{ letterSpacing: '0.35em', fontSize: '1.1rem' }}
            />
          </label>
          {!password && (
            <label style={field}>
              <span className="eyebrow">{copy.password}</span>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}
          {messages}
          <button type="submit" className="btn" disabled={busy} style={{ justifyContent: 'center' }}>
            {busy ? copy.working : copy.verifyCta}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={resend}
            disabled={busy}
            style={{ justifyContent: 'center' }}
          >
            {copy.resend}
          </button>
        </form>
      )}
    </Modal>
  );
}
