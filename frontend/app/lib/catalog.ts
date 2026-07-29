const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export type CatalogItem = {
  id: number;
  plant_name: string;
  description: string | null;
  /**
   * The **effective** price — what the shopper pays, discount already applied.
   * Deliberately the opposite meaning to `InventoryItem.price` in `api.ts`,
   * which is the vivero's list price.
   */
  price: number;
  /** The pre-discount price. Null unless a discount is live — never 0. */
  original_price: number | null;
  discount_percent: number | null;
  /** "item" | "store" — which rule produced the discount. */
  discount_source: string | null;
  stock: number;
  image_url: string | null;
  tags: string | null;
  genus: string | null;
  category: string; // "plant" | "pot" | "supply"
  is_featured: boolean;
  created_at: string;
  store_id: number;
  store_name: string;
  store_location: string | null;
};

export type CatalogVivero = {
  id: number;
  name: string;
  location: string | null;
  item_count: number;
};

export type CatalogFacets = {
  genera: string[];
  categories: string[];
  viveros: CatalogVivero[];
};

export type CatalogResponse = {
  total: number;
  items: CatalogItem[];
  facets: CatalogFacets;
};

/** Just enough to re-price a cart line; see `getCartPricing`. */
export type CatalogPricing = {
  id: number;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  stock: number;
};

export type CatalogDetail = {
  item: CatalogItem;
  related: CatalogItem[];
};

export class CatalogError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function catalogFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new CatalogError(response.status, 'catalog_request_failed');
  }
  return response.json() as Promise<T>;
}

export function getCatalog() {
  return catalogFetch<CatalogResponse>('/api/catalog');
}

/**
 * Current price and stock for a set of listings. An id missing from the
 * response means the listing is gone — deleted, paused, or from a vivero that
 * went inactive.
 */
export function getCartPricing(ids: number[]): Promise<CatalogPricing[]> {
  if (!ids.length) return Promise.resolve([]);
  return catalogFetch<CatalogPricing[]>(`/api/catalog/pricing?ids=${ids.join(',')}`);
}

export function getCatalogItem(id: number) {
  return catalogFetch<CatalogDetail>(`/api/catalog/${id}`);
}

/** Newest-first ordering is what "new arrivals" means across the storefront. */
export function sortByNewest(items: CatalogItem[]): CatalogItem[] {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/**
 * `image_url` holds either an absolute URL (seeded photos) or a local upload
 * path like `/uploads/abc.jpg`, which is served by the API rather than Next.
 */
export function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url}`;
}

export function splitTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
