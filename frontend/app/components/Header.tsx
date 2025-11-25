"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function Header() {
  const [session, setSession] = useState<
    | {
        role: 'admin' | 'store' | 'customer';
        cartCount?: number;
        favoriteCount?: number;
      }
    | null
  >(null);

  useEffect(() => {
    const readSession = () => {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem('plantera-session');
      if (!raw) {
        setSession(null);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        setSession(parsed);
      } catch (error) {
        console.error('Unable to parse session', error);
        setSession(null);
      }
    };

    const handleSessionUpdate = () => readSession();

    readSession();
    window.addEventListener('storage', handleSessionUpdate);
    window.addEventListener('plantera-session-update', handleSessionUpdate as EventListener);
    return () => {
      window.removeEventListener('storage', handleSessionUpdate);
      window.removeEventListener('plantera-session-update', handleSessionUpdate as EventListener);
    };
  }, []);

  const navLinks = useMemo(() => {
    if (session?.role === 'customer') {
      return [
        { href: '#home', label: 'Home' },
        { href: '#stores', label: 'Stores' },
        { href: '#products', label: 'Shop plants' },
        { href: '/login#customer-view', label: 'Favorites' },
      ];
    }
    return [
      { href: '#home', label: 'Home' },
      { href: '#stores', label: 'Stores' },
      { href: '#products', label: 'Products' },
      { href: '#contact', label: 'Contact Us' },
    ];
  }, [session?.role]);

  const isCustomer = session?.role === 'customer';
  const cartCount = session?.cartCount ?? 0;
  const favoriteCount = session?.favoriteCount ?? 0;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        padding: '1.25rem 2rem',
        background: '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 800,
            fontSize: '1.25rem',
            letterSpacing: '-0.01em',
          }}
        >
          Plantera
        </Link>
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            fontWeight: 600,
          }}
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isCustomer ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              >
                <span role="img" aria-label="favorite">
                  ❤️
                </span>
                <span style={{ fontWeight: 700 }}>{favoriteCount}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#0f172a',
                  color: '#fff',
                  padding: '0.55rem 0.9rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  boxShadow: '0 10px 25px rgba(15,23,42,0.25)',
                }}
              >
                <span role="img" aria-label="cart">
                  🛒
                </span>
                <span>{cartCount} in cart</span>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  padding: '0.55rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                style={{
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  padding: '0.55rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  boxShadow: '0 10px 25px rgba(34,197,94,0.25)',
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
