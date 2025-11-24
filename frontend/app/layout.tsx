import './globals.css';
import Link from 'next/link';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Plantera',
  description: 'Plantera demo application'
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            padding: '1.25rem 2rem',
            background: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
            <Link href="/" style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
              Plantera
            </Link>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontWeight: 600 }}>
              <Link href="#home">Home</Link>
              <Link href="#stores">Stores</Link>
              <Link href="#products">Products</Link>
              <Link href="#contact">Contact Us</Link>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                style={{
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  padding: '0.55rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 600
                }}
              >
                Log In
              </button>
              <button
                style={{
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  padding: '0.55rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  boxShadow: '0 10px 25px rgba(34,197,94,0.25)'
                }}
              >
                Sign Up
              </button>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
