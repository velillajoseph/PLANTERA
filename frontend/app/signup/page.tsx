import SignupForm from '../components/SignupForm';

const sectionStyle = {
  maxWidth: '1100px',
  margin: '0 auto',
  padding: '3rem 1.25rem',
};

const cardStyle = {
  background: '#fff',
  borderRadius: '18px',
  padding: '1.5rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 16px 40px rgba(15,23,42,0.08)',
};

export default function SignupPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <section style={{ ...sectionStyle, paddingTop: '4rem' }}>
        <div
          style={{
            display: 'grid',
            gap: '2rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <p
              style={{
                margin: 0,
                color: 'var(--accent)',
                fontWeight: 800,
                letterSpacing: '0.05em',
              }}
            >
              Sign up
            </p>
            <h1 style={{ fontSize: '2.5rem', margin: 0, lineHeight: 1.05 }}>
              Bring every storefront and product into one customer experience.
            </h1>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7 }}>
              Join the early access list to streamline store onboarding, product
              curation, and customer feedback in a single workspace.
            </p>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {["Unified data across stores", "Fast go-live playbooks", "Customer-ready insights"].map(
                (item) => (
                  <div
                    key={item}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span style={{ color: 'var(--accent)', fontWeight: 800 }}>•</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{item}</span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 0.5rem' }}>Join the waitlist</h2>
            <p style={{ margin: '0 0 1rem', color: 'var(--muted)' }}>
              Tell us about you and your store. We will email you with the next
              steps to activate your account.
            </p>
            <SignupForm />
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <h2 style={{ margin: 0 }}>What you will get</h2>
          <div
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            }}
          >
            {[
              {
                title: 'Launch blueprint',
                copy: 'Step-by-step onboarding for connecting storefronts and catalogs.',
              },
              {
                title: 'Customer-ready insights',
                copy: 'Automated metrics, alerts, and reports for every launch stage.',
              },
              {
                title: 'Product feedback loop',
                copy: 'Capture feedback and improve products with structured workflows.',
              },
            ].map(({ title, copy }) => (
              <div key={title} style={cardStyle}>
                <p style={{ margin: 0, fontWeight: 700 }}>{title}</p>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)' }}>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
