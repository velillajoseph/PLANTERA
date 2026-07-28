import type { Localized } from './i18n';

export type CareGuide = {
  light: Localized;
  water: Localized;
  soil: Localized;
  commonIssues: Localized;
};

export type Plant = {
  slug: string;
  name: string;
  price: number;
  stock: number;
  vendorId: string;
  image: string;
  description: Localized;
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
    description: {
      es: 'La reina de las plantas tropicales. Sus hojas grandes y caladas crecen rápido y llenan cualquier sala con presencia. Ideal para espacios con buena luz natural.',
      en: 'The queen of tropical houseplants. Its large, fenestrated leaves grow fast and fill any room with presence. Ideal for spaces with good natural light.',
    },
    care: {
      light: {
        es: 'Luz brillante e indirecta. Tolera media luz, pero crece más lento y con menos aberturas en las hojas.',
        en: 'Bright, indirect light. Tolerates medium light, but grows slower with fewer leaf splits.',
      },
      water: {
        es: 'Riega cuando las primeras dos pulgadas de tierra estén secas, cada 7 a 10 días. Reduce el riego en época fresca.',
        en: 'Water when the top two inches of soil are dry, every 7 to 10 days. Reduce watering in cooler months.',
      },
      soil: {
        es: 'Sustrato con buen drenaje, con perlita o corteza de orquídea para airear las raíces.',
        en: 'Well-draining mix with perlite or orchid bark to keep the roots aerated.',
      },
      commonIssues: {
        es: 'Hojas amarillas casi siempre indican exceso de riego; bordes secos indican falta de humedad ambiental.',
        en: 'Yellow leaves almost always mean overwatering; dry edges point to low ambient humidity.',
      },
    },
  },
  {
    slug: 'ficus-tineke',
    name: 'Ficus Tineke',
    price: 48,
    stock: 7,
    vendorId: 'verde-valle',
    image: unsplash('1597055181300-e3633a917c9c'),
    description: {
      es: 'Gomero variegado de hojas gruesas en tonos crema, verde y rosa. Una pieza escultural y elegante que se adapta bien a interiores.',
      en: 'A variegated rubber tree with thick leaves in cream, green, and pink. A sculptural, elegant piece that adapts well to interiors.',
    },
    care: {
      light: {
        es: 'Luz brillante e indirecta para mantener la variegación. Evita el sol directo de la tarde.',
        en: 'Bright, indirect light to keep the variegation. Avoid direct afternoon sun.',
      },
      water: {
        es: 'Riega cuando la primera pulgada de tierra esté seca. Prefiere quedarse corto antes que encharcado.',
        en: 'Water when the top inch of soil is dry. Better slightly dry than waterlogged.',
      },
      soil: {
        es: 'Mezcla rica y con buen drenaje. Trasplanta cada 1 a 2 años.',
        en: 'Rich, well-draining mix. Repot every 1 to 2 years.',
      },
      commonIssues: {
        es: 'Pierde hojas por corrientes de aire o cambios bruscos de lugar; hojas opacas indican falta de luz.',
        en: 'Drops leaves from drafts or sudden moves; dull leaves signal not enough light.',
      },
    },
  },
  {
    slug: 'calathea-lancifolia',
    name: 'Calathea Lancifolia',
    price: 34,
    stock: 10,
    vendorId: 'jardines-boriken',
    image: unsplash('1602923668104-8f9e03e77e62'),
    description: {
      es: 'Conocida como calathea serpiente por el patrón de sus hojas alargadas. Follaje decorativo de día y hojas que se pliegan de noche. Segura para mascotas.',
      en: 'Known as the rattlesnake calathea for the pattern on its long leaves. Decorative foliage by day, folding up at night. Pet-safe.',
    },
    care: {
      light: {
        es: 'Luz media e indirecta. El sol directo desvanece el patrón de las hojas.',
        en: 'Medium, indirect light. Direct sun fades the leaf pattern.',
      },
      water: {
        es: 'Mantén el sustrato húmedo sin encharcar. Prefiere agua filtrada o de lluvia.',
        en: 'Keep the soil moist but never soggy. Prefers filtered or rain water.',
      },
      soil: {
        es: 'Mezcla a base de turba que retenga humedad con buen drenaje.',
        en: 'Peat-based mix that holds moisture while draining well.',
      },
      commonIssues: {
        es: 'Bordes crujientes casi siempre son falta de humedad ambiental; hojas enrolladas piden agua.',
        en: 'Crispy edges almost always mean low humidity; curling leaves are asking for water.',
      },
    },
  },
  {
    slug: 'maranta-fascinator',
    name: "Maranta 'Fascinator'",
    price: 28,
    stock: 18,
    vendorId: 'casa-tropical',
    image: unsplash('1637967886160-fd78dc3ce3f5'),
    description: {
      es: 'La planta de oración: sus hojas con nervaduras rosadas se elevan al anochecer como manos en oración. Compacta, llamativa y segura para mascotas.',
      en: 'The prayer plant: its pink-veined leaves rise at dusk like praying hands. Compact, striking, and pet-safe.',
    },
    care: {
      light: {
        es: 'Luz media e indirecta. Tolera menos luz que la mayoría de las tropicales.',
        en: 'Medium, indirect light. Tolerates lower light than most tropicals.',
      },
      water: {
        es: 'Mantén el sustrato ligeramente húmedo. Sensible al cloro: usa agua filtrada si es posible.',
        en: 'Keep the soil lightly moist. Sensitive to chlorine: use filtered water if possible.',
      },
      soil: {
        es: 'Mezcla ligera y aireada que retenga algo de humedad.',
        en: 'Light, airy mix that holds some moisture.',
      },
      commonIssues: {
        es: 'Puntas marrones por agua con minerales o aire seco; hojas descoloridas por exceso de sol.',
        en: 'Brown tips from mineral-heavy water or dry air; faded leaves from too much sun.',
      },
    },
  },
  {
    slug: 'sansevieria',
    name: 'Sansevieria',
    price: 26,
    stock: 20,
    vendorId: 'jardines-boriken',
    image: unsplash('1593482892290-f54927ae1bb6'),
    description: {
      es: 'Hojas verticales y esculturales que resisten casi cualquier descuido. La planta perfecta para quien empieza o viaja mucho.',
      en: 'Upright, sculptural leaves that survive almost any neglect. The perfect plant for beginners and frequent travelers.',
    },
    care: {
      light: {
        es: 'Tolera poca luz; crece más rápido con luz brillante e indirecta.',
        en: 'Tolerates low light; grows fastest in bright, indirect light.',
      },
      water: {
        es: 'Riega cada 2 a 4 semanas, dejando secar el sustrato por completo. Muy resistente a la sequía.',
        en: 'Water every 2 to 4 weeks, letting the soil dry out fully. Very drought-tolerant.',
      },
      soil: {
        es: 'Mezcla para cactus o suculentas, de drenaje rápido.',
        en: 'Fast-draining cactus or succulent mix.',
      },
      commonIssues: {
        es: 'Hojas blandas o dobladas indican exceso de riego — la causa #1 de pérdida.',
        en: 'Soft or collapsing leaves mean overwatering — the #1 cause of loss.',
      },
    },
  },
  {
    slug: 'aloe',
    name: 'Aloe',
    price: 18,
    stock: 24,
    vendorId: 'jardines-boriken',
    image: unsplash('1509423350716-97f9360b4e09'),
    description: {
      es: 'Suculenta medicinal y decorativa, hecha para el sol del Caribe. Crece feliz en balcones, patios y ventanas soleadas.',
      en: 'A medicinal, decorative succulent made for Caribbean sun. Happy on balconies, patios, and sunny windowsills.',
    },
    care: {
      light: {
        es: 'Luz brillante, incluyendo varias horas de sol directo.',
        en: 'Bright light, including several hours of direct sun.',
      },
      water: {
        es: 'Riega solo cuando el sustrato esté completamente seco, cada 2 a 3 semanas.',
        en: 'Water only when the soil is completely dry, every 2 to 3 weeks.',
      },
      soil: {
        es: 'Mezcla arenosa para suculentas con excelente drenaje.',
        en: 'Sandy succulent mix with excellent drainage.',
      },
      commonIssues: {
        es: 'Hojas traslúcidas o blandas indican exceso de agua; hojas delgadas y curvas piden riego.',
        en: 'Translucent or mushy leaves mean too much water; thin, curled leaves are asking for a drink.',
      },
    },
  },
  {
    slug: 'cactus-cereus',
    name: 'Cactus Cereus',
    price: 22,
    stock: 15,
    vendorId: 'casa-tropical',
    image: unsplash('1519336056116-bc0f1771dec8'),
    description: {
      es: 'Columnar, escultural y prácticamente indestructible. Un acento de carácter para esquinas soleadas y espacios minimalistas.',
      en: 'Columnar, sculptural, and practically indestructible. A statement accent for sunny corners and minimalist spaces.',
    },
    care: {
      light: {
        es: 'Sol directo o luz muy brillante. Mientras más luz, mejor.',
        en: 'Direct sun or very bright light. The more light, the better.',
      },
      water: {
        es: 'Riega cada 3 a 4 semanas en época cálida; casi nada en época fresca.',
        en: 'Water every 3 to 4 weeks in warm months; barely at all when it cools.',
      },
      soil: {
        es: 'Mezcla mineral para cactus, de drenaje inmediato.',
        en: 'Mineral cactus mix that drains immediately.',
      },
      commonIssues: {
        es: 'La pudrición por exceso de riego es el único enemigo real; ante la duda, no riegues.',
        en: 'Rot from overwatering is its only real enemy; when in doubt, don’t water.',
      },
    },
  },
  {
    slug: 'echeveria',
    name: 'Echeveria',
    price: 16,
    stock: 30,
    vendorId: 'casa-tropical',
    image: unsplash('1485955900006-10f4d324d411'),
    description: {
      es: 'Rosetas compactas y geométricas, perfectas para escritorios y regalos. La entrada ideal al mundo de las plantas.',
      en: 'Compact, geometric rosettes, perfect for desks and gifts. The ideal entry into the plant world.',
    },
    care: {
      light: {
        es: 'Luz brillante con algo de sol directo para mantener la forma compacta.',
        en: 'Bright light with some direct sun to keep its compact shape.',
      },
      water: {
        es: 'Riega cuando el sustrato esté seco por completo, cada 2 semanas aproximadamente.',
        en: 'Water when the soil is fully dry, roughly every 2 weeks.',
      },
      soil: {
        es: 'Mezcla para suculentas de drenaje rápido.',
        en: 'Fast-draining succulent mix.',
      },
      commonIssues: {
        es: 'Estiramiento hacia la luz indica que necesita más sol; hojas blandas, exceso de agua.',
        en: 'Stretching toward the light means it needs more sun; soft leaves mean too much water.',
      },
    },
  },
];

export function getPlantsByVendor(vendorId: string): Plant[] {
  return plants.filter((plant) => plant.vendorId === vendorId);
}

export function getPlant(slug: string): Plant | undefined {
  return plants.find((plant) => plant.slug === slug);
}
