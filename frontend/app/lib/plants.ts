export type CareGuide = {
  light: string;
  water: string;
  soil: string;
  commonIssues: string;
};

export type Plant = {
  slug: string;
  name: string;
  price: number;
  stock: number;
  vendorId: string;
  image: string;
  description: string;
  care: CareGuide;
};

// Las fotos son de Unsplash (verificadas); para usar fotos propias,
// cambia el campo `image` de cada planta.
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=900&q=80`;

export const plants: Plant[] = [
  {
    slug: 'monstera-deliciosa',
    name: 'Monstera Deliciosa',
    price: 42,
    stock: 12,
    vendorId: 'verde-valle',
    image: unsplash('1614594975525-e45190c55d0b'),
    description:
      'La reina de las plantas tropicales. Sus hojas grandes y caladas crecen rápido y llenan cualquier sala con presencia. Ideal para espacios con buena luz natural.',
    care: {
      light: 'Luz brillante e indirecta. Tolera media luz, pero crece más lento y con menos aberturas en las hojas.',
      water: 'Riega cuando las primeras dos pulgadas de tierra estén secas, cada 7 a 10 días. Reduce el riego en época fresca.',
      soil: 'Sustrato con buen drenaje, con perlita o corteza de orquídea para airear las raíces.',
      commonIssues: 'Hojas amarillas casi siempre indican exceso de riego; bordes secos indican falta de humedad ambiental.',
    },
  },
  {
    slug: 'ficus-tineke',
    name: 'Ficus Tineke',
    price: 48,
    stock: 7,
    vendorId: 'verde-valle',
    image: unsplash('1597055181300-e3633a917c9c'),
    description:
      'Gomero variegado de hojas gruesas en tonos crema, verde y rosa. Una pieza escultural y elegante que se adapta bien a interiores.',
    care: {
      light: 'Luz brillante e indirecta para mantener la variegación. Evita el sol directo de la tarde.',
      water: 'Riega cuando la primera pulgada de tierra esté seca. Prefiere quedarse corto antes que encharcado.',
      soil: 'Mezcla rica y con buen drenaje. Trasplanta cada 1 a 2 años.',
      commonIssues: 'Pierde hojas por corrientes de aire o cambios bruscos de lugar; hojas opacas indican falta de luz.',
    },
  },
  {
    slug: 'calathea-lancifolia',
    name: 'Calathea Lancifolia',
    price: 34,
    stock: 10,
    vendorId: 'jardines-boriken',
    image: unsplash('1602923668104-8f9e03e77e62'),
    description:
      'Conocida como calathea serpiente por el patrón de sus hojas alargadas. Follaje decorativo de día y hojas que se pliegan de noche. Segura para mascotas.',
    care: {
      light: 'Luz media e indirecta. El sol directo desvanece el patrón de las hojas.',
      water: 'Mantén el sustrato húmedo sin encharcar. Prefiere agua filtrada o de lluvia.',
      soil: 'Mezcla a base de turba que retenga humedad con buen drenaje.',
      commonIssues: 'Bordes crujientes casi siempre son falta de humedad ambiental; hojas enrolladas piden agua.',
    },
  },
  {
    slug: 'maranta-fascinator',
    name: 'Maranta — Planta de Oración',
    price: 28,
    stock: 18,
    vendorId: 'casa-tropical',
    image: unsplash('1637967886160-fd78dc3ce3f5'),
    description:
      'Sus hojas con nervaduras rosadas se elevan al anochecer como manos en oración. Compacta, llamativa y segura para mascotas.',
    care: {
      light: 'Luz media e indirecta. Tolera menos luz que la mayoría de las tropicales.',
      water: 'Mantén el sustrato ligeramente húmedo. Sensible al cloro: usa agua filtrada si es posible.',
      soil: 'Mezcla ligera y aireada que retenga algo de humedad.',
      commonIssues: 'Puntas marrones por agua con minerales o aire seco; hojas descoloridas por exceso de sol.',
    },
  },
  {
    slug: 'sansevieria',
    name: 'Sansevieria',
    price: 26,
    stock: 20,
    vendorId: 'jardines-boriken',
    image: unsplash('1593482892290-f54927ae1bb6'),
    description:
      'Hojas verticales y esculturales que resisten casi cualquier descuido. La planta perfecta para quien empieza o viaja mucho.',
    care: {
      light: 'Tolera poca luz; crece más rápido con luz brillante e indirecta.',
      water: 'Riega cada 2 a 4 semanas, dejando secar el sustrato por completo. Muy resistente a la sequía.',
      soil: 'Mezcla para cactus o suculentas, de drenaje rápido.',
      commonIssues: 'Hojas blandas o dobladas indican exceso de riego — la causa #1 de pérdida.',
    },
  },
  {
    slug: 'aloe',
    name: 'Aloe',
    price: 18,
    stock: 24,
    vendorId: 'jardines-boriken',
    image: unsplash('1509423350716-97f9360b4e09'),
    description:
      'Suculenta medicinal y decorativa, hecha para el sol del Caribe. Crece feliz en balcones, patios y ventanas soleadas.',
    care: {
      light: 'Luz brillante, incluyendo varias horas de sol directo.',
      water: 'Riega solo cuando el sustrato esté completamente seco, cada 2 a 3 semanas.',
      soil: 'Mezcla arenosa para suculentas con excelente drenaje.',
      commonIssues: 'Hojas traslúcidas o blandas indican exceso de agua; hojas delgadas y curvas piden riego.',
    },
  },
  {
    slug: 'cactus-cereus',
    name: 'Cactus Cereus',
    price: 22,
    stock: 15,
    vendorId: 'casa-tropical',
    image: unsplash('1519336056116-bc0f1771dec8'),
    description:
      'Columnar, escultural y prácticamente indestructible. Un acento de carácter para esquinas soleadas y espacios minimalistas.',
    care: {
      light: 'Sol directo o luz muy brillante. Mientras más luz, mejor.',
      water: 'Riega cada 3 a 4 semanas en época cálida; casi nada en época fresca.',
      soil: 'Mezcla mineral para cactus, de drenaje inmediato.',
      commonIssues: 'La pudrición por exceso de riego es el único enemigo real; ante la duda, no riegues.',
    },
  },
  {
    slug: 'suculenta-echeveria',
    name: 'Suculenta Echeveria',
    price: 16,
    stock: 30,
    vendorId: 'casa-tropical',
    image: unsplash('1485955900006-10f4d324d411'),
    description:
      'Rosetas compactas y geométricas, perfectas para escritorios y regalos. La entrada ideal al mundo de las plantas.',
    care: {
      light: 'Luz brillante con algo de sol directo para mantener la forma compacta.',
      water: 'Riega cuando el sustrato esté seco por completo, cada 2 semanas aproximadamente.',
      soil: 'Mezcla para suculentas de drenaje rápido.',
      commonIssues: 'Estiramiento hacia la luz indica que necesita más sol; hojas blandas, exceso de agua.',
    },
  },
];

export function getPlantsByVendor(vendorId: string): Plant[] {
  return plants.filter((plant) => plant.vendorId === vendorId);
}

export function getPlant(slug: string): Plant | undefined {
  return plants.find((plant) => plant.slug === slug);
}
