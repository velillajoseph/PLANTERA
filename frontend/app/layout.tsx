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
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
