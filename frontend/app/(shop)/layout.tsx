import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import ShopHeader from '../components/shop/ShopHeader';
import ShopFooter from '../components/shop/ShopFooter';
import { CartProvider } from '../lib/cart';

export const metadata: Metadata = {
  title: 'Plantera — Plantas de viveros locales de Puerto Rico',
  description:
    'Compra plantas, macetas y accesorios de los mejores viveros de Puerto Rico. Fotografía real, guías de cuidado y entrega coordinada.',
};

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <ShopHeader />
      <main>{children}</main>
      <ShopFooter />
    </CartProvider>
  );
}
