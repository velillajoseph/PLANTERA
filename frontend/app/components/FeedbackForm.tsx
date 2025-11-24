'use client';

import { FormEvent, useState } from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

type FeedbackFormState = 'idle' | 'loading' | 'error' | 'success';

type ErrorState = {
  message: string;
} | null;

export default function FeedbackForm() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<FeedbackFormState>('idle');
  const [error, setError] = useState<ErrorState>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message }),
      });

      if (!response.ok) {
        throw new Error('Could not submit feedback');
      }

      setStatus('success');
      setName('');
      setMessage('');
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
      style={{ display: 'grid', gap: '1rem', maxWidth: '480px' }}
    >
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
          }}
        />
      </div>
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          rows={4}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
          }}
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding: '0.75rem',
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 700,
        }}
      >
        {status === 'loading' ? 'Sending…' : 'Send feedback'}
      </button>
      {status === 'success' && (
        <p role="status" style={{ color: 'green', margin: 0 }}>
          Thanks for your feedback!
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
