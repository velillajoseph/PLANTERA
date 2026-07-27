import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="dark-section" style={{ marginTop: '5rem' }}>
      <div
        className="container"
        style={{ paddingTop: '4rem', paddingBottom: '3rem' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <span
              className="serif"
              style={{ fontSize: '1.3rem', letterSpacing: '0.3em' }}
            >
              PLANTERA
            </span>
            <p className="lead" style={{ fontSize: '0.95rem' }}>
              Del vivero a tu puerta, en toda la isla.
            </p>
          </div>
          <nav
            style={{
              display: 'grid',
              gap: '0.6rem',
              fontSize: '0.92rem',
              fontWeight: 500,
            }}
          >
            <Link href="/#coleccion">La colección</Link>
            <Link href="/#para-viveros">Para viveros</Link>
            <Link href="/#contacto">Contacto</Link>
            <Link href="/dashboard">Panel para viveros</Link>
          </nav>
          <div style={{ display: 'grid', gap: '0.6rem', fontSize: '0.92rem' }}>
            <span className="eyebrow">Contacto</span>
            <a href="mailto:hola@plantera.pr">hola@plantera.pr</a>
            <span style={{ color: '#8a9488' }}>Puerto Rico</span>
          </div>
        </div>
        <hr
          className="hairline"
          style={{ borderColor: 'rgba(243,239,230,0.15)', margin: '2.5rem 0 1.25rem' }}
        />
        <p style={{ fontSize: '0.78rem', color: '#8a9488' }}>
          © 2026 Plantera · Vista de demostración
        </p>
      </div>
    </footer>
  );
}
