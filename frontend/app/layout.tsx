import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Tenor_Sans, Inter } from 'next/font/google';
import { LanguageProvider } from './lib/i18n';

const tenorSans = Tenor_Sans({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Plantera — Del vivero a tu puerta',
  description:
    'Plantera conecta a compradores de plantas en Puerto Rico con los mejores viveros locales — fotografía profesional, guías de cuidado y entrega coordinada.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" className={`${tenorSans.variable} ${inter.variable}`}>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
