import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Internal pitch material: kept out of search results and unlinked from the shop.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PitchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
