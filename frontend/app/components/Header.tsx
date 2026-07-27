import Link from 'next/link';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/#coleccion', label: 'Plantas' },
  { href: '/#para-viveros', label: 'Para Viveros' },
  { href: '/#contacto', label: 'Contacto' },
];

export default function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(247,244,238,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
          paddingTop: '1.1rem',
          paddingBottom: '1.1rem',
        }}
      >
        <Link
          href="/"
          className="serif"
          style={{ fontSize: '1.05rem', letterSpacing: '0.32em' }}
        >
          PLANTERA
        </Link>
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.9rem',
            fontWeight: 500,
            flexWrap: 'wrap',
          }}
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/dashboard"
          className="btn btn--ghost"
          style={{ padding: '0.55rem 1.2rem', fontSize: '0.82rem' }}
        >
          Demo para viveros
        </Link>
      </div>
    </header>
  );
}
