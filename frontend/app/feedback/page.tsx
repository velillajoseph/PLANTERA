import FeedbackForm from '../components/FeedbackForm';

export default function FeedbackPage() {
  return (
    <section
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        display: 'grid',
        gap: '1.5rem',
      }}
    >
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          Share your thoughts
        </h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          Submit feedback and it will be stored in the backend SQLite database
          through the API.
        </p>
      </div>
      <FeedbackForm />
    </section>
  );
}
