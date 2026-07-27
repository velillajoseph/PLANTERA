export type MonthlySales = {
  month: string;
  monthLabel: string;
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

export const salesSummaries: SalesSummary[] = [
  {
    vendorId: 'verde-valle',
    totalSales: 80,
    revenue: 3134.5,
    monthlyRevenue: [
      {
        month: 'feb',
        monthLabel: 'Febrero',
        revenue: 384.5,
        orders: 9,
        topPlants: [
          { name: 'Monstera Deliciosa', units: 5 },
          { name: 'Ficus Tineke', units: 4 },
        ],
      },
      {
        month: 'mar',
        monthLabel: 'Marzo',
        revenue: 412.0,
        orders: 10,
        topPlants: [
          { name: 'Monstera Deliciosa', units: 6 },
          { name: 'Ficus Tineke', units: 4 },
        ],
      },
      {
        month: 'abr',
        monthLabel: 'Abril',
        revenue: 468.5,
        orders: 12,
        topPlants: [
          { name: 'Monstera Deliciosa', units: 7 },
          { name: 'Ficus Tineke', units: 5 },
        ],
      },
      {
        month: 'may',
        monthLabel: 'Mayo',
        revenue: 521.0,
        orders: 13,
        topPlants: [
          { name: 'Monstera Deliciosa', units: 8 },
          { name: 'Ficus Tineke', units: 5 },
        ],
      },
      {
        month: 'jun',
        monthLabel: 'Junio',
        revenue: 612.5,
        orders: 16,
        topPlants: [
          { name: 'Monstera Deliciosa', units: 10 },
          { name: 'Ficus Tineke', units: 6 },
        ],
      },
      {
        month: 'jul',
        monthLabel: 'Julio',
        revenue: 736.0,
        orders: 20,
        topPlants: [
          { name: 'Monstera Deliciosa', units: 13 },
          { name: 'Ficus Tineke', units: 7 },
        ],
      },
    ],
  },
  {
    vendorId: 'jardines-boriken',
    totalSales: 64,
    revenue: 2346.5,
    monthlyRevenue: [
      {
        month: 'feb',
        monthLabel: 'Febrero',
        revenue: 262.5,
        orders: 7,
        topPlants: [
          { name: 'Sansevieria', units: 4 },
          { name: 'Aloe', units: 3 },
        ],
      },
      {
        month: 'mar',
        monthLabel: 'Marzo',
        revenue: 308.0,
        orders: 8,
        topPlants: [
          { name: 'Sansevieria', units: 4 },
          { name: 'Calathea Lancifolia', units: 3 },
          { name: 'Aloe', units: 2 },
        ],
      },
      {
        month: 'abr',
        monthLabel: 'Abril',
        revenue: 356.5,
        orders: 9,
        topPlants: [
          { name: 'Calathea Lancifolia', units: 4 },
          { name: 'Sansevieria', units: 3 },
          { name: 'Aloe', units: 2 },
        ],
      },
      {
        month: 'may',
        monthLabel: 'Mayo',
        revenue: 382.0,
        orders: 10,
        topPlants: [
          { name: 'Sansevieria', units: 5 },
          { name: 'Aloe', units: 4 },
        ],
      },
      {
        month: 'jun',
        monthLabel: 'Junio',
        revenue: 471.5,
        orders: 13,
        topPlants: [
          { name: 'Aloe', units: 6 },
          { name: 'Sansevieria', units: 5 },
          { name: 'Calathea Lancifolia', units: 2 },
        ],
      },
      {
        month: 'jul',
        monthLabel: 'Julio',
        revenue: 566.0,
        orders: 17,
        topPlants: [
          { name: 'Aloe', units: 8 },
          { name: 'Sansevieria', units: 6 },
          { name: 'Calathea Lancifolia', units: 3 },
        ],
      },
    ],
  },
  {
    vendorId: 'casa-tropical',
    totalSales: 107,
    revenue: 2873.5,
    monthlyRevenue: [
      {
        month: 'feb',
        monthLabel: 'Febrero',
        revenue: 318.0,
        orders: 12,
        topPlants: [
          { name: 'Suculenta Echeveria', units: 7 },
          { name: 'Cactus Cereus', units: 4 },
        ],
      },
      {
        month: 'mar',
        monthLabel: 'Marzo',
        revenue: 342.5,
        orders: 13,
        topPlants: [
          { name: 'Suculenta Echeveria', units: 8 },
          { name: 'Maranta — Planta de Oración', units: 3 },
        ],
      },
      {
        month: 'abr',
        monthLabel: 'Abril',
        revenue: 411.0,
        orders: 15,
        topPlants: [
          { name: 'Suculenta Echeveria', units: 8 },
          { name: 'Cactus Cereus', units: 5 },
          { name: 'Maranta — Planta de Oración', units: 2 },
        ],
      },
      {
        month: 'may',
        monthLabel: 'Mayo',
        revenue: 447.5,
        orders: 17,
        topPlants: [
          { name: 'Suculenta Echeveria', units: 9 },
          { name: 'Maranta — Planta de Oración', units: 5 },
          { name: 'Cactus Cereus', units: 3 },
        ],
      },
      {
        month: 'jun',
        monthLabel: 'Junio',
        revenue: 562.0,
        orders: 21,
        topPlants: [
          { name: 'Suculenta Echeveria', units: 11 },
          { name: 'Cactus Cereus', units: 6 },
          { name: 'Maranta — Planta de Oración', units: 4 },
        ],
      },
      {
        month: 'jul',
        monthLabel: 'Julio',
        revenue: 792.5,
        orders: 29,
        topPlants: [
          { name: 'Suculenta Echeveria', units: 15 },
          { name: 'Maranta — Planta de Oración', units: 8 },
          { name: 'Cactus Cereus', units: 6 },
        ],
      },
    ],
  },
];

export function getSalesSummary(vendorId: string): SalesSummary | undefined {
  return salesSummaries.find((summary) => summary.vendorId === vendorId);
}
