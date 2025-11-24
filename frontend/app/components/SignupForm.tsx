'use client';

import { FormEvent, useState } from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

type SignupStatus = 'idle' | 'loading' | 'success' | 'error';

type ErrorState = {
  message: string;
} | null;

export default function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<SignupStatus>('idle');
  const [error, setError] = useState<ErrorState>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company: company || null }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.detail || 'Could not complete sign up';
        throw new Error(message);
      }

      setStatus('success');
      setName('');
      setEmail('');
      setCompany('');
    } catch (err) {
      setStatus('error');
      setError({
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{
        display: 'grid',
        gap: '1rem',
        padding: '1.25rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: '#fff',
        boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
      }}
    >
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <label htmlFor="name" style={{ fontWeight: 600 }}>
          Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          placeholder="Alex Johnson"
          style={{
            padding: '0.85rem',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <label htmlFor="email" style={{ fontWeight: 600 }}>
          Work email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="alex@company.com"
          style={{
            padding: '0.85rem',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <label htmlFor="company" style={{ fontWeight: 600 }}>
          Company (optional)
        </label>
        <input
          id="company"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          placeholder="Plantera Labs"
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
        {status === 'loading' ? 'Submitting…' : 'Join the waitlist'}
      </button>

      {status === 'success' && (
        <p role="status" style={{ color: 'green', margin: 0 }}>
          Thanks! You are on the list. We will reach out shortly.
        </p>
      )}

      {status === 'error' && error && (
        <p role="alert" style={{ color: 'red', margin: 0 }}>
          {error.message}
        </p>
      )}
    </form>
  );
}
