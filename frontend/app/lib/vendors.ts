export type Vendor = {
  id: string;
  name: string;
  location: string;
  tagline: string;
};

export const vendors: Vendor[] = [
  {
    id: 'verde-valle',
    name: 'Vivero Verde Valle',
    location: 'Caguas, PR',
    tagline: 'Vivero familiar especializado en plantas tropicales y de interior.',
  },
  {
    id: 'jardines-boriken',
    name: 'Jardines Borikén',
    location: 'Ponce, PR',
    tagline: 'Plantas nativas y resistentes, cultivadas para el clima de la isla.',
  },
  {
    id: 'casa-tropical',
    name: 'Vivero Casa Tropical',
    location: 'San Juan, PR',
    tagline: 'Variedades curadas y plantas de bajo mantenimiento para espacios urbanos.',
  },
];

export function getVendor(vendorId: string): Vendor | undefined {
  return vendors.find((vendor) => vendor.id === vendorId);
}
