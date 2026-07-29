import { splitTags, type CatalogFacets, type CatalogItem } from './catalog';

/**
 * Catalog search. Runs in the browser because `/api/catalog` already ships the
 * whole catalog in one response — this module is the single place to change if
 * that ever moves server-side.
 */

/**
 * Fold accents so "sabila" finds "Sábila" and "boriken" finds "Borikén".
 * NFD splits a letter from its diacritic; the range strips the diacritics.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function tokenize(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean);
}

/**
 * Field weights. A token matching the plant's own name should always outrank
 * the same token appearing in a description.
 */
const WEIGHTS = {
  name: 10,
  genus: 6,
  tags: 4,
  vivero: 3,
  description: 1,
} as const;

/** A prefix match is a stronger signal than a match buried mid-word. */
function scoreField(haystack: string, token: string, weight: number): number {
  if (!haystack) return 0;
  const at = haystack.indexOf(token);
  if (at === -1) return 0;
  if (at === 0) return weight * 2;
  if (haystack[at - 1] === ' ') return Math.round(weight * 1.5);
  return weight;
}

type Indexed = {
  item: CatalogItem;
  name: string;
  genus: string;
  tags: string;
  vivero: string;
  description: string;
};

function index(item: CatalogItem): Indexed {
  return {
    item,
    name: normalize(item.plant_name),
    genus: normalize(item.genus ?? ''),
    tags: normalize(splitTags(item.tags).join(' ')),
    vivero: normalize(item.store_name),
    description: normalize(item.description ?? ''),
  };
}

export type ScoredItem = { item: CatalogItem; score: number };

export function searchItems(items: CatalogItem[], query: string): ScoredItem[] {
  const tokens = tokenize(query);
  if (!tokens.length) return items.map((item) => ({ item, score: 0 }));

  const results: ScoredItem[] = [];

  for (const entry of items.map(index)) {
    let total = 0;
    // Every token must land somewhere, so "monstera grande" doesn't match a
    // plant that is merely large. Words may match different fields.
    const matchedAll = tokens.every((token) => {
      const score =
        scoreField(entry.name, token, WEIGHTS.name) +
        scoreField(entry.genus, token, WEIGHTS.genus) +
        scoreField(entry.tags, token, WEIGHTS.tags) +
        scoreField(entry.vivero, token, WEIGHTS.vivero) +
        scoreField(entry.description, token, WEIGHTS.description);
      total += score;
      return score > 0;
    });

    if (matchedAll) {
      // Featured stock breaks ties, matching the shop's default sort.
      results.push({ item: entry.item, score: total + (entry.item.is_featured ? 1 : 0) });
    }
  }

  return results.sort(
    (a, b) => b.score - a.score || a.item.plant_name.localeCompare(b.item.plant_name),
  );
}

export function filterItems(items: CatalogItem[], query: string): CatalogItem[] {
  return searchItems(items, query).map((result) => result.item);
}

export type Suggestion =
  | { kind: 'item'; item: CatalogItem }
  | { kind: 'genus'; label: string; href: string }
  | { kind: 'vivero'; label: string; href: string };

const MAX_ITEM_SUGGESTIONS = 5;
const MAX_FACET_SUGGESTIONS = 3;

export function suggest(
  items: CatalogItem[],
  facets: CatalogFacets | null,
  query: string,
): Suggestion[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  const suggestions: Suggestion[] = searchItems(items, query)
    .slice(0, MAX_ITEM_SUGGESTIONS)
    .map((result) => ({ kind: 'item', item: result.item }));

  if (!facets) return suggestions;

  const matches = (label: string) =>
    tokens.every((token) => normalize(label).includes(token));

  facets.genera
    .filter(matches)
    .slice(0, MAX_FACET_SUGGESTIONS)
    .forEach((genus) =>
      suggestions.push({
        kind: 'genus',
        label: genus,
        href: `/shop?genus=${encodeURIComponent(genus)}`,
      }),
    );

  facets.viveros
    .filter((vivero) => matches(vivero.name))
    .slice(0, MAX_FACET_SUGGESTIONS)
    .forEach((vivero) =>
      suggestions.push({
        kind: 'vivero',
        label: vivero.name,
        href: `/shop?vivero=${vivero.id}`,
      }),
    );

  return suggestions;
}

const RECENT_KEY = 'plantera-recent-searches';
const MAX_RECENT = 5;

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function rememberSearch(query: string): void {
  const term = query.trim();
  if (!term || typeof window === 'undefined') return;
  try {
    const existing = getRecentSearches().filter(
      (entry) => normalize(entry) !== normalize(term),
    );
    const next = [term, ...existing].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode; recent searches are a nicety, not a requirement.
  }
}
