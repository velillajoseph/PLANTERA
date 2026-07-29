import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import ShopHeader from '../components/shop/ShopHeader';
import ShopFooter from '../components/shop/ShopFooter';
import { CartProvider } from '../lib/cart';
import { CustomerProvider } from '../lib/customer-auth';

export const metadata: Metadata = {
  title: 'Plantera — Plantas de viveros locales de Puerto Rico',
  description:
    'Compra plantas, macetas y accesorios de los mejores viveros de Puerto Rico. Fotografía real, guías de cuidado y entrega coordinada.',
};

// Stays a server component (it owns `metadata`); the providers are client
// children, which is fine. CustomerProvider never gates — the whole storefront
// remains public, and only /account switches on the signed-in state.
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerProvider>
      <CartProvider>
        <ShopHeader />
        <main>{children}</main>
        <ShopFooter />
      </CartProvider>
    </CustomerProvider>
  );
}
