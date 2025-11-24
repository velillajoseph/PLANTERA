const sectionStyle = {
  maxWidth: '1080px',
  margin: '0 auto',
  padding: '3rem 1rem',
};

const cardStyle = {
  background: '#fff',
  padding: '1.5rem',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
  border: '1px solid #e2e8f0',
};

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <section id="home" style={{ ...sectionStyle, paddingTop: '4rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <p
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--accent)',
                letterSpacing: '0.04em',
              }}
            >
              Grow with Plantera
            </p>
            <h1 style={{ fontSize: '2.75rem', margin: 0, lineHeight: 1.1 }}>
              Connect your stores, curate products, and delight customers.
            </h1>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              Plantera gives you a modern toolkit to launch experiences
              fast—from storefront data to product insights and customer
              feedback pipelines.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href="/signup"
                style={{
                  background: '#0f172a',
                  color: '#fff',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '14px',
                  fontWeight: 700,
                }}
              >
                Get started
              </a>
              <a
                href="#products"
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '14px',
                  fontWeight: 700,
                  boxShadow: '0 12px 28px rgba(34,197,94,0.25)',
                }}
              >
                Explore Products
              </a>
              <a
                href="/feedback"
                style={{
                  background: '#0f172a',
                  color: '#fff',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '14px',
                  fontWeight: 700,
                }}
              >
                Share Feedback
              </a>
            </div>
          </div>
          <div style={{ ...cardStyle, display: 'grid', gap: '1rem' }}>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Live snapshot</p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700 }}>Active stores</span>
                <span style={{ fontWeight: 800, fontSize: '1.5rem' }}>24</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700 }}>Products curated</span>
                <span style={{ fontWeight: 800, fontSize: '1.5rem' }}>
                  1,280
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700 }}>Avg. satisfaction</span>
                <span style={{ fontWeight: 800, fontSize: '1.5rem' }}>
                  4.8 / 5
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stores" style={sectionStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>Stores</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Centralize every storefront with unified analytics, rapid
            onboarding, and real-time health checks. Monitor performance and
            surface issues before they impact customers.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {['Unified dashboards', 'Sync pipelines', 'Store uptime'].map(
              (item) => (
                <div key={item} style={cardStyle}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{item}</p>
                  <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
                    {item === 'Unified dashboards'
                      ? 'Keep a single view of all sales channels.'
                      : item === 'Sync pipelines'
                        ? 'Integrate product and inventory changes automatically.'
                        : 'Track health and alerts with built-in monitoring.'}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        id="products"
        style={{ ...sectionStyle, background: '#fff', borderRadius: '18px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>Products</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Curate offerings quickly with structured data, smart
            recommendations, and feedback loops that keep your catalog relevant.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {['Catalog curation', 'Insights', 'Launch playbooks'].map(
              (item) => (
                <div key={item} style={{ ...cardStyle, boxShadow: 'none' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{item}</p>
                  <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
                    {item === 'Catalog curation'
                      ? 'Merge inventory data with merchandising in minutes.'
                      : item === 'Insights'
                        ? 'See what customers want with trend-aware analytics.'
                        : 'Ship repeatable launches with checklists and automations.'}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section id="contact" style={sectionStyle}>
        <div
          style={{
            ...cardStyle,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <h2 style={{ margin: 0 }}>Contact Us</h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Ready to see Plantera in action? Reach out and our team will tailor
            a demo for your stores and products.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <a
              href="mailto:hello@plantera.app"
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              Email us
            </a>
            <a
              href="/feedback"
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: '14px',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              Send product feedback
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
