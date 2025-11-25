"use client";

import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Header from './components/Header';

export const metadata: Metadata = {
  title: 'Plantera',
  description: 'Plantera demo application',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
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
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
