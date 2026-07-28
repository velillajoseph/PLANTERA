import type { Localized } from './i18n';

export type Vendor = {
  id: string;
  name: string;
  location: string;
  tagline: Localized;
};

export const vendors: Vendor[] = [
  {
    id: 'verde-valle',
    name: 'Vivero Verde Valle',
    location: 'Caguas, PR',
    tagline: {
      es: 'Vivero familiar especializado en plantas tropicales y de interior.',
      en: 'Family-run vivero specializing in tropical and indoor plants.',
    },
  },
  {
    id: 'jardines-boriken',
    name: 'Jardines Borikén',
    location: 'Ponce, PR',
    tagline: {
      es: 'Plantas nativas y resistentes, cultivadas para el clima de la isla.',
      en: 'Native, resilient plants grown for the island climate.',
    },
  },
  {
    id: 'casa-tropical',
    name: 'Vivero Casa Tropical',
    location: 'San Juan, PR',
    tagline: {
      es: 'Variedades curadas y plantas de bajo mantenimiento para espacios urbanos.',
      en: 'Curated varieties and low-maintenance plants for urban spaces.',
    },
  },
];

export function getVendor(vendorId: string): Vendor | undefined {
  return vendors.find((vendor) => vendor.id === vendorId);
}
