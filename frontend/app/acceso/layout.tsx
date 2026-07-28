import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Vendor portal: never indexed, never linked from the customer storefront.
// (The child layouts are client components, so the tag is declared here.)
export const metadata: Metadata = {
  title: 'Plantera · Acceso viveros',
  robots: { index: false, follow: false },
};

export default function AccesoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
