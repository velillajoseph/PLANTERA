import './globals.css';
import type { Metadata, Viewport } from 'next';
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

// viewportFit: 'cover' is what makes env(safe-area-inset-*) resolve on notched
// iPhones; without it the insets are always 0 and content hides under the notch.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f7f4ee',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="es"
      className={`${tenorSans.variable} ${inter.variable}`}
      // iOS Safari only honours the -webkit- form, and autoprefixer strips it
      // from the stylesheet during the production build. Setting it inline
      // bypasses PostCSS so phones stop inflating text relative to desktop.
      style={{ WebkitTextSizeAdjust: '100%' }}
    >
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
