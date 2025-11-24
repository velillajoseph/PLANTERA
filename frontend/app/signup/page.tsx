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
              Create your Plantera account
            </p>
            <h1 style={{ fontSize: '2.5rem', margin: 0, lineHeight: 1.05 }}>
              Shop across connected stores with one secure login.
            </h1>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7 }}>
              Register to browse curated products, manage your orders, and get
              updates from every Plantera store you love. We will verify your
              email with a security code before unlocking your account.
            </p>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {["One login for every Plantera store", "Email verified for purchase security", "Order-ready profile with phone details"].map(
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
            <h2 style={{ margin: '0 0 0.5rem' }}>Sign up to start shopping</h2>
            <p style={{ margin: '0 0 1rem', color: 'var(--muted)' }}>
              Enter your details, set a password, and confirm the security code
              we email you. You will be ready to purchase once verified.
            </p>
            <SignupForm />
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <h2 style={{ margin: 0 }}>Why verify your email?</h2>
          <div
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            }}
          >
            {[
              {
                title: 'Protect purchases',
                copy: 'Verification ensures only you can confirm orders and manage delivery updates.',
              },
              {
                title: 'Secure account recovery',
                copy: 'Verified contact details help recover your account quickly if you lose access.',
              },
              {
                title: 'Trusted store network',
                copy: 'Stores know verified shoppers are real customers, unlocking promotions and rewards.',
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
