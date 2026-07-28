import type { Localized } from './i18n';

/**
 * Care knowledge is genus-level, not listing-level: how you care for a Monstera
 * doesn't change per vivero. Keying by genus keeps this out of the database and
 * spares vendors from re-typing it on every listing.
 */
export type CareGuide = {
  genus: string;
  common: Localized;
  summary: Localized;
  light: Localized;
  water: Localized;
  soil: Localized;
  commonIssues: Localized;
  difficulty: Localized;
  petSafe: boolean;
};

export const careGuides: CareGuide[] = [
  {
    genus: 'Monstera',
    common: { es: 'Costilla de Adán', en: 'Swiss cheese plant' },
    summary: {
      es: 'Tropical de crecimiento rápido cuyas hojas se abren con la madurez y la buena luz.',
      en: 'A fast-growing tropical whose leaves split open with maturity and good light.',
    },
    light: {
      es: 'Luz brillante e indirecta. Tolera media luz, pero crece más lento y con menos aberturas.',
      en: 'Bright, indirect light. Tolerates medium light, but grows slower with fewer splits.',
    },
    water: {
      es: 'Riega cuando las primeras dos pulgadas de sustrato estén secas, cada 7 a 10 días.',
      en: 'Water when the top two inches of soil are dry, every 7 to 10 days.',
    },
    soil: {
      es: 'Sustrato aireado con perlita o corteza de orquídea para oxigenar las raíces.',
      en: 'Airy mix with perlite or orchid bark so the roots can breathe.',
    },
    commonIssues: {
      es: 'Hojas amarillas casi siempre son exceso de riego; bordes secos, falta de humedad.',
      en: 'Yellow leaves are almost always overwatering; dry edges mean low humidity.',
    },
    difficulty: { es: 'Fácil', en: 'Easy' },
    petSafe: false,
  },
  {
    genus: 'Ficus',
    common: { es: 'Gomero', en: 'Rubber plant' },
    summary: {
      es: 'Follaje grueso y escultural que premia la constancia y odia las mudanzas.',
      en: 'Thick, sculptural foliage that rewards consistency and hates being moved.',
    },
    light: {
      es: 'Luz brillante e indirecta para conservar la variegación. Evita el sol de la tarde.',
      en: 'Bright, indirect light to keep the variegation. Avoid harsh afternoon sun.',
    },
    water: {
      es: 'Riega cuando la primera pulgada esté seca. Prefiere quedarse corto antes que encharcado.',
      en: 'Water when the top inch is dry. Better slightly dry than waterlogged.',
    },
    soil: {
      es: 'Mezcla rica con buen drenaje. Trasplanta cada 1 a 2 años.',
      en: 'Rich, well-draining mix. Repot every 1 to 2 years.',
    },
    commonIssues: {
      es: 'Pierde hojas por corrientes de aire o cambios de lugar; hojas opacas, poca luz.',
      en: 'Drops leaves from drafts or relocation; dull leaves mean not enough light.',
    },
    difficulty: { es: 'Intermedia', en: 'Intermediate' },
    petSafe: false,
  },
  {
    genus: 'Calathea',
    common: { es: 'Calathea', en: 'Prayer-plant family' },
    summary: {
      es: 'Follaje decorativo que se pliega de noche. Exige humedad, recompensa con patrones.',
      en: 'Decorative foliage that folds at night. Demands humidity, repays with patterns.',
    },
    light: {
      es: 'Luz media e indirecta. El sol directo desvanece el patrón de las hojas.',
      en: 'Medium, indirect light. Direct sun fades the leaf pattern.',
    },
    water: {
      es: 'Sustrato húmedo sin encharcar. Prefiere agua filtrada o de lluvia.',
      en: 'Keep soil moist but never soggy. Prefers filtered or rain water.',
    },
    soil: {
      es: 'Mezcla a base de turba que retenga humedad y drene bien.',
      en: 'Peat-based mix that holds moisture while draining well.',
    },
    commonIssues: {
      es: 'Bordes crujientes son falta de humedad ambiental; hojas enrolladas piden agua.',
      en: 'Crispy edges mean low humidity; curling leaves are asking for water.',
    },
    difficulty: { es: 'Exigente', en: 'Demanding' },
    petSafe: true,
  },
  {
    genus: 'Maranta',
    common: { es: 'Planta de oración', en: 'Prayer plant' },
    summary: {
      es: 'Sus hojas con nervaduras rosadas se elevan al anochecer como manos en oración.',
      en: 'Pink-veined leaves that rise at dusk like praying hands.',
    },
    light: {
      es: 'Luz media e indirecta. Tolera menos luz que la mayoría de las tropicales.',
      en: 'Medium, indirect light. Tolerates lower light than most tropicals.',
    },
    water: {
      es: 'Sustrato ligeramente húmedo. Sensible al cloro: usa agua filtrada si puedes.',
      en: 'Keep soil lightly moist. Sensitive to chlorine: use filtered water if you can.',
    },
    soil: { es: 'Mezcla ligera y aireada que retenga algo de humedad.', en: 'Light, airy mix that holds some moisture.' },
    commonIssues: {
      es: 'Puntas marrones por minerales del agua o aire seco; hojas pálidas por exceso de sol.',
      en: 'Brown tips from water minerals or dry air; pale leaves from too much sun.',
    },
    difficulty: { es: 'Intermedia', en: 'Intermediate' },
    petSafe: true,
  },
  {
    genus: 'Sansevieria',
    common: { es: 'Lengua de suegra', en: 'Snake plant' },
    summary: {
      es: 'La planta más indulgente que existe: sobrevive poca luz, sequía y olvido.',
      en: 'The most forgiving plant there is: survives low light, drought, and neglect.',
    },
    light: {
      es: 'Tolera poca luz; crece más rápido con luz brillante e indirecta.',
      en: 'Tolerates low light; grows fastest in bright, indirect light.',
    },
    water: {
      es: 'Riega cada 2 a 4 semanas, dejando secar el sustrato por completo.',
      en: 'Water every 2 to 4 weeks, letting the soil dry out fully.',
    },
    soil: { es: 'Mezcla para cactus, de drenaje rápido.', en: 'Fast-draining cactus mix.' },
    commonIssues: {
      es: 'Hojas blandas o dobladas indican exceso de riego — la causa #1 de pérdida.',
      en: 'Soft or folding leaves mean overwatering — the #1 cause of loss.',
    },
    difficulty: { es: 'Muy fácil', en: 'Very easy' },
    petSafe: false,
  },
  {
    genus: 'Aloe',
    common: { es: 'Sábila', en: 'Aloe' },
    summary: {
      es: 'Suculenta medicinal hecha para el sol del Caribe. Feliz en balcones y patios.',
      en: 'A medicinal succulent made for Caribbean sun. Happy on balconies and patios.',
    },
    light: { es: 'Luz brillante, incluyendo varias horas de sol directo.', en: 'Bright light, including several hours of direct sun.' },
    water: {
      es: 'Riega solo cuando el sustrato esté completamente seco, cada 2 a 3 semanas.',
      en: 'Water only when the soil is fully dry, every 2 to 3 weeks.',
    },
    soil: { es: 'Mezcla arenosa para suculentas con excelente drenaje.', en: 'Sandy succulent mix with excellent drainage.' },
    commonIssues: {
      es: 'Hojas traslúcidas o blandas son exceso de agua; hojas delgadas piden riego.',
      en: 'Translucent or mushy leaves mean too much water; thin leaves want a drink.',
    },
    difficulty: { es: 'Muy fácil', en: 'Very easy' },
    petSafe: false,
  },
  {
    genus: 'Cereus',
    common: { es: 'Cactus columnar', en: 'Columnar cactus' },
    summary: {
      es: 'Escultural y prácticamente indestructible. Un acento de carácter para esquinas soleadas.',
      en: 'Sculptural and practically indestructible. A characterful accent for sunny corners.',
    },
    light: { es: 'Sol directo o luz muy brillante. Mientras más luz, mejor.', en: 'Direct sun or very bright light. The more, the better.' },
    water: {
      es: 'Riega cada 3 a 4 semanas en época cálida; casi nada cuando refresca.',
      en: 'Water every 3 to 4 weeks in warm months; barely at all when it cools.',
    },
    soil: { es: 'Mezcla mineral para cactus, de drenaje inmediato.', en: 'Mineral cactus mix that drains immediately.' },
    commonIssues: {
      es: 'La pudrición por exceso de riego es su único enemigo real; ante la duda, no riegues.',
      en: 'Rot from overwatering is its only real enemy; when in doubt, skip the water.',
    },
    difficulty: { es: 'Muy fácil', en: 'Very easy' },
    petSafe: true,
  },
  {
    genus: 'Echeveria',
    common: { es: 'Rosa de alabastro', en: 'Echeveria' },
    summary: {
      es: 'Rosetas compactas y geométricas, la entrada ideal al mundo de las plantas.',
      en: 'Compact geometric rosettes — the ideal entry into the plant world.',
    },
    light: {
      es: 'Luz brillante con algo de sol directo para mantener la forma compacta.',
      en: 'Bright light with some direct sun to keep its compact shape.',
    },
    water: {
      es: 'Riega cuando el sustrato esté seco por completo, cada 2 semanas aproximadamente.',
      en: 'Water when soil is fully dry, roughly every 2 weeks.',
    },
    soil: { es: 'Mezcla para suculentas de drenaje rápido.', en: 'Fast-draining succulent mix.' },
    commonIssues: {
      es: 'Si se estira hacia la luz necesita más sol; hojas blandas, exceso de agua.',
      en: 'Stretching toward the light means it needs more sun; soft leaves mean too much water.',
    },
    difficulty: { es: 'Fácil', en: 'Easy' },
    petSafe: true,
  },
];

export function getCareGuide(genus: string | null): CareGuide | undefined {
  if (!genus) return undefined;
  return careGuides.find(
    (guide) => guide.genus.toLowerCase() === genus.toLowerCase(),
  );
}
