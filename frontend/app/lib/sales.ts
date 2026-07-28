import type { Localized } from './i18n';

export type MonthlySales = {
  month: Localized;
  monthLabel: Localized;
  revenue: number;
  orders: number;
  topPlants: { name: string; units: number }[];
};

export type SalesSummary = {
  vendorId: string;
  totalSales: number;
  revenue: number;
  monthlyRevenue: MonthlySales[];
};

const MONTHS: Record<string, { month: Localized; monthLabel: Localized }> = {
  feb: {
    month: { es: 'feb', en: 'Feb' },
    monthLabel: { es: 'Febrero', en: 'February' },
  },
  mar: {
    month: { es: 'mar', en: 'Mar' },
    monthLabel: { es: 'Marzo', en: 'March' },
  },
  abr: {
    month: { es: 'abr', en: 'Apr' },
    monthLabel: { es: 'Abril', en: 'April' },
  },
  may: {
    month: { es: 'may', en: 'May' },
    monthLabel: { es: 'Mayo', en: 'May' },
  },
  jun: {
    month: { es: 'jun', en: 'Jun' },
    monthLabel: { es: 'Junio', en: 'June' },
  },
  jul: {
    month: { es: 'jul', en: 'Jul' },
    monthLabel: { es: 'Julio', en: 'July' },
  },
};

function month(
  key: keyof typeof MONTHS,
  revenue: number,
  orders: number,
  topPlants: { name: string; units: number }[],
): MonthlySales {
  return { ...MONTHS[key], revenue, orders, topPlants };
}

export const salesSummaries: SalesSummary[] = [
  {
    vendorId: 'verde-valle',
    totalSales: 80,
    revenue: 3134.5,
    monthlyRevenue: [
      month('feb', 384.5, 9, [
        { name: 'Monstera Deliciosa', units: 5 },
        { name: 'Ficus Tineke', units: 4 },
      ]),
      month('mar', 412.0, 10, [
        { name: 'Monstera Deliciosa', units: 6 },
        { name: 'Ficus Tineke', units: 4 },
      ]),
      month('abr', 468.5, 12, [
        { name: 'Monstera Deliciosa', units: 7 },
        { name: 'Ficus Tineke', units: 5 },
      ]),
      month('may', 521.0, 13, [
        { name: 'Monstera Deliciosa', units: 8 },
        { name: 'Ficus Tineke', units: 5 },
      ]),
      month('jun', 612.5, 16, [
        { name: 'Monstera Deliciosa', units: 10 },
        { name: 'Ficus Tineke', units: 6 },
      ]),
      month('jul', 736.0, 20, [
        { name: 'Monstera Deliciosa', units: 13 },
        { name: 'Ficus Tineke', units: 7 },
      ]),
    ],
  },
  {
    vendorId: 'jardines-boriken',
    totalSales: 64,
    revenue: 2346.5,
    monthlyRevenue: [
      month('feb', 262.5, 7, [
        { name: 'Sansevieria', units: 4 },
        { name: 'Aloe', units: 3 },
      ]),
      month('mar', 308.0, 8, [
        { name: 'Sansevieria', units: 4 },
        { name: 'Calathea Lancifolia', units: 3 },
        { name: 'Aloe', units: 2 },
      ]),
      month('abr', 356.5, 9, [
        { name: 'Calathea Lancifolia', units: 4 },
        { name: 'Sansevieria', units: 3 },
        { name: 'Aloe', units: 2 },
      ]),
      month('may', 382.0, 10, [
        { name: 'Sansevieria', units: 5 },
        { name: 'Aloe', units: 4 },
      ]),
      month('jun', 471.5, 13, [
        { name: 'Aloe', units: 6 },
        { name: 'Sansevieria', units: 5 },
        { name: 'Calathea Lancifolia', units: 2 },
      ]),
      month('jul', 566.0, 17, [
        { name: 'Aloe', units: 8 },
        { name: 'Sansevieria', units: 6 },
        { name: 'Calathea Lancifolia', units: 3 },
      ]),
    ],
  },
  {
    vendorId: 'casa-tropical',
    totalSales: 107,
    revenue: 2873.5,
    monthlyRevenue: [
      month('feb', 318.0, 12, [
        { name: 'Echeveria', units: 7 },
        { name: 'Cactus Cereus', units: 4 },
      ]),
      month('mar', 342.5, 13, [
        { name: 'Echeveria', units: 8 },
        { name: "Maranta 'Fascinator'", units: 3 },
      ]),
      month('abr', 411.0, 15, [
        { name: 'Echeveria', units: 8 },
        { name: 'Cactus Cereus', units: 5 },
        { name: "Maranta 'Fascinator'", units: 2 },
      ]),
      month('may', 447.5, 17, [
        { name: 'Echeveria', units: 9 },
        { name: "Maranta 'Fascinator'", units: 5 },
        { name: 'Cactus Cereus', units: 3 },
      ]),
      month('jun', 562.0, 21, [
        { name: 'Echeveria', units: 11 },
        { name: 'Cactus Cereus', units: 6 },
        { name: "Maranta 'Fascinator'", units: 4 },
      ]),
      month('jul', 792.5, 29, [
        { name: 'Echeveria', units: 15 },
        { name: "Maranta 'Fascinator'", units: 8 },
        { name: 'Cactus Cereus', units: 6 },
      ]),
    ],
  },
];

export function getSalesSummary(vendorId: string): SalesSummary | undefined {
  return salesSummaries.find((summary) => summary.vendorId === vendorId);
}
