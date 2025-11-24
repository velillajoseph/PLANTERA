'use client';

import { FormEvent, useState } from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

type Stage = 'register' | 'verify' | 'done';
type Status = 'idle' | 'loading' | 'error';

type RegistrationResponse = {
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
    is_verified: boolean;
  };
  verification_required: boolean;
  verification_preview?: string | null;
  message: string;
};

type ErrorState = {
  message: string;
} | null;

export default function SignupForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [stage, setStage] = useState<Stage>('register');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<ErrorState>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  const handleRegistration = async (event: FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError({ message: 'Passwords must match' });
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.detail || 'Could not create your account';
        throw new Error(message);
      }

      const data = (await response.json()) as RegistrationResponse;
      setMessage(data.message);
      setRegisteredEmail(data.customer.email);
      setStage('verify');
      setPreviewCode(data.verification_preview || null);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError({
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleVerification = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail, code: verificationCode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.detail || 'Verification failed';
        throw new Error(message);
      }

      setStage('done');
      setMessage('Your account is verified and ready to shop.');
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError({
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const resendCode = async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.detail || 'Could not resend the code';
        throw new Error(message);
      }

      const data = (await response.json()) as RegistrationResponse;
      setMessage(data.message);
      setPreviewCode(data.verification_preview || null);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError({
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: '1.25rem',
        padding: '1.25rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: '#fff',
        boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
      }}
    >
      {stage === 'register' && (
        <form onSubmit={handleRegistration} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <label htmlFor="firstName" style={{ fontWeight: 600 }}>
              First name
            </label>
            <input
              id="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              placeholder="Alex"
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <label htmlFor="lastName" style={{ fontWeight: 600 }}>
              Last name
            </label>
            <input
              id="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              placeholder="Johnson"
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <label htmlFor="email" style={{ fontWeight: 600 }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <label htmlFor="phone" style={{ fontWeight: 600 }}>
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(555) 123-4567"
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <label htmlFor="password" style={{ fontWeight: 600 }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <label htmlFor="confirmPassword" style={{ fontWeight: 600 }}>
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              placeholder="Re-enter your password"
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '0.9rem',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {status === 'loading' ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}

      {stage === 'verify' && (
        <form onSubmit={handleVerification} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <p style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
              Check your email for a 6-digit security code
            </p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Enter the code we sent to <strong>{registeredEmail}</strong> to
              finish your registration.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <label htmlFor="verificationCode" style={{ fontWeight: 600 }}>
              Security code
            </label>
            <input
              id="verificationCode"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              required
              minLength={6}
              maxLength={6}
              placeholder="123456"
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                letterSpacing: '0.08em',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '0.9rem',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {status === 'loading' ? 'Verifying…' : 'Verify and continue'}
          </button>

          <button
            type="button"
            onClick={resendCode}
            disabled={status === 'loading'}
            style={{
              padding: '0.85rem',
              background: 'transparent',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Resend code
          </button>

          {previewCode && (
            <p style={{ margin: 0, color: '#0f172a' }}>
              Dev preview code: <strong>{previewCode}</strong>
            </p>
          )}
        </form>
      )}

      {stage === 'done' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <p style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
            Account verified
          </p>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            You can now browse and purchase from stores across Plantera.
          </p>
        </div>
      )}

      {message && (
        <p role="status" style={{ color: 'green', margin: 0 }}>
          {message}
        </p>
      )}

      {status === 'error' && error && (
        <p role="alert" style={{ color: 'red', margin: 0 }}>
          {error.message}
        </p>
      )}
    </div>
  );
}
