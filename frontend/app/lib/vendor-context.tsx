'use client';

import { createContext, useContext } from 'react';
import type { VendorProfile } from './api';

export const VendorContext = createContext<{
  profile: VendorProfile;
  refreshProfile: () => Promise<void>;
} | null>(null);

export function useVendor() {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendor must be used inside the vendor portal layout');
  }
  return context;
}
