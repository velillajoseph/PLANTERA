import { describe, expect, it } from 'vitest';
import {
  filterItems,
  normalize,
  searchItems,
  suggest,
} from '../app/lib/search';
import type { CatalogFacets, CatalogItem } from '../app/lib/catalog';

function item(overrides: Partial<CatalogItem> & { id: number }): CatalogItem {
  return {
    plant_name: 'Planta',
    description: null,
    price: 20,
    original_price: null,
    discount_percent: null,
    discount_source: null,
    stock: 5,
    image_url: null,
    tags: null,
    genus: null,
    category: 'plant',
    is_featured: false,
    created_at: '2026-01-01T00:00:00',
    store_id: 1,
    store_name: 'Vivero Verde Valle',
    store_location: 'Caguas, PR',
    ...overrides,
  };
}

const CATALOG: CatalogItem[] = [
  item({ id: 1, plant_name: 'Monstera Deliciosa', genus: 'Monstera', tags: 'tropical, interior' }),
  item({ id: 2, plant_name: 'Sábila', genus: 'Aloe', description: 'Suculenta medicinal.' }),
  item({
    id: 3,
    plant_name: 'Maceta de terracota',
    category: 'pot',
    store_name: 'Jardines Borikén',
    description: 'Clásica con drenaje, ideal para monstera pequeña.',
  }),
  item({ id: 4, plant_name: 'Calathea Lancifolia', genus: 'Calathea', tags: 'sombra, grande' }),
];

describe('normalize', () => {
  it('folds accents so unaccented typing still matches', () => {
    expect(normalize('Sábila')).toBe('sabila');
    expect(normalize('Jardines Borikén')).toBe('jardines boriken');
  });

  it('lowercases and trims', () => {
    expect(normalize('  MONSTERA  ')).toBe('monstera');
  });
});

describe('searchItems', () => {
  it('finds an accented name from unaccented input', () => {
    const results = filterItems(CATALOG, 'sabila');
    expect(results.map((entry) => entry.id)).toEqual([2]);
  });

  it('finds an accented vivero name from unaccented input', () => {
    const results = filterItems(CATALOG, 'boriken');
    expect(results.map((entry) => entry.id)).toEqual([3]);
  });

  it('requires every token to match, across any field', () => {
    // "grande" is a tag on 4; "calathea" is its name. Both must land.
    expect(filterItems(CATALOG, 'calathea grande').map((e) => e.id)).toEqual([4]);
    // Nothing has both of these, even though each matches something.
    expect(filterItems(CATALOG, 'calathea terracota')).toEqual([]);
  });

  it('matches tokens that are not contiguous in the source text', () => {
    // The old substring search required the exact phrase; this must not.
    expect(filterItems(CATALOG, 'deliciosa monstera').map((e) => e.id)).toEqual([1]);
  });

  it('ranks a name match above a description match', () => {
    const results = filterItems(CATALOG, 'monstera');
    // Item 1 is named Monstera; item 3 only mentions it in its description.
    expect(results.map((entry) => entry.id)).toEqual([1, 3]);
  });

  it('searches the description, which the old implementation ignored', () => {
    expect(filterItems(CATALOG, 'medicinal').map((e) => e.id)).toEqual([2]);
  });

  it('returns everything for an empty query', () => {
    expect(searchItems(CATALOG, '   ')).toHaveLength(CATALOG.length);
  });

  it('returns nothing when a token matches nothing', () => {
    expect(filterItems(CATALOG, 'orquidea')).toEqual([]);
  });
});

describe('suggest', () => {
  const facets: CatalogFacets = {
    genera: ['Monstera', 'Aloe', 'Calathea'],
    categories: ['plant', 'pot'],
    viveros: [
      { id: 1, name: 'Vivero Verde Valle', location: 'Caguas, PR', item_count: 3 },
      { id: 2, name: 'Jardines Borikén', location: 'Ponce, PR', item_count: 1 },
    ],
  };

  it('returns products first, then genus and vivero shortcuts', () => {
    const results = suggest(CATALOG, facets, 'monstera');
    expect(results[0]).toMatchObject({ kind: 'item' });
    expect(results.some((entry) => entry.kind === 'genus')).toBe(true);
  });

  it('suggests a vivero by its unaccented name', () => {
    const results = suggest(CATALOG, facets, 'boriken');
    const vivero = results.find((entry) => entry.kind === 'vivero');
    expect(vivero).toMatchObject({ kind: 'vivero', href: '/shop?vivero=2' });
  });

  it('is empty for a blank query', () => {
    expect(suggest(CATALOG, facets, '  ')).toEqual([]);
  });
});
