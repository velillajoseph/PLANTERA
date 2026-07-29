import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from '../app/lib/cart';
import type { CatalogItem } from '../app/lib/catalog';

const getCartPricing = vi.fn();
vi.mock('../app/lib/catalog', async () => {
  const actual = await vi.importActual<typeof import('../app/lib/catalog')>(
    '../app/lib/catalog',
  );
  return { ...actual, getCartPricing: (ids: number[]) => getCartPricing(ids) };
});

const STORAGE_KEY = 'plantera-cart';

function item(overrides: Partial<CatalogItem> & { id: number }): CatalogItem {
  return {
    plant_name: 'Monstera',
    description: null,
    price: 42,
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
    store_name: 'Vivero Test',
    store_location: null,
    ...overrides,
  };
}

/** Renders the cart state into the DOM so tests read it back rather than
 *  capturing it into a module variable during render. */
function Probe() {
  const cart = useCart();
  return (
    <div>
      <span data-testid="lines">{JSON.stringify(cart.lines)}</span>
      <span data-testid="subtotal">{cart.subtotal}</span>
      <span data-testid="savings">{cart.savings}</span>
      <span data-testid="changes">{JSON.stringify(cart.priceChanges)}</span>
      <span data-testid="removed">{JSON.stringify(cart.removedNames)}</span>
      <button type="button" data-testid="add" onClick={() => cart.add(item({ id: 1, price: 30 }))}>
        add
      </button>
      <button type="button" data-testid="reconcile" onClick={() => void cart.reconcile()}>
        reconcile
      </button>
    </div>
  );
}

const lines = () => JSON.parse(screen.getByTestId('lines').textContent || '[]');
const changes = () => JSON.parse(screen.getByTestId('changes').textContent || '[]');
const removed = () => JSON.parse(screen.getByTestId('removed').textContent || '[]');

async function mount() {
  await act(async () => {
    render(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
  });
}

beforeEach(() => {
  window.localStorage.clear();
  getCartPricing.mockReset();
  getCartPricing.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('storage migration', () => {
  it('migrates a legacy bare-array cart instead of dropping it', async () => {
    // v1 persisted a plain CartLine[] with no version envelope. Someone's cart
    // is not worth losing over a schema bump.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 1, name: 'Monstera', price: 42, image: null, vivero: 'V', stock: 5, qty: 2 },
      ]),
    );
    // A migrated cart has pricedAt 0, so it is re-priced on the first load —
    // a v1 cart has no idea whether a sale started since it was filled.
    getCartPricing.mockResolvedValue([
      { id: 1, price: 42, original_price: null, discount_percent: null, stock: 5 },
    ]);
    await mount();

    expect(lines()).toHaveLength(1);
    // listPrice backfills from price: v1 had no discounts, so they were equal.
    expect(lines()[0].listPrice).toBe(42);
    expect(lines()[0].discountPercent).toBeNull();

    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) as string);
    expect(persisted.v).toBe(2);
    expect(Array.isArray(persisted.lines)).toBe(true);
  });

  it('re-prices a migrated cart on load, since v1 predates discounts', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 1, name: 'Monstera', price: 42, image: null, vivero: 'V', stock: 5, qty: 1 },
      ]),
    );
    getCartPricing.mockResolvedValue([
      { id: 1, price: 35.7, original_price: 42, discount_percent: 15, stock: 5 },
    ]);
    await mount();

    expect(getCartPricing).toHaveBeenCalledWith([1]);
    expect(lines()[0].price).toBe(35.7);
    expect(lines()[0].discountPercent).toBe(15);
  });

  it('round-trips a v2 envelope', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: 2,
        pricedAt: Date.now(),
        lines: [
          {
            id: 1, name: 'Monstera', price: 35.7, listPrice: 42,
            discountPercent: 15, image: null, vivero: 'V', stock: 5, qty: 1,
          },
        ],
      }),
    );
    await mount();

    expect(lines()[0].price).toBe(35.7);
    expect(lines()[0].listPrice).toBe(42);
  });

  it.each(['{}', 'null', 'not json', '{"v":1,"lines":[]}'])(
    'starts empty on unusable storage: %s',
    async (raw) => {
      window.localStorage.setItem(STORAGE_KEY, raw);
      await mount();
      expect(lines()).toEqual([]);
    },
  );
});

describe('add', () => {
  it('refreshes an existing line rather than only bumping quantity', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: 2,
        pricedAt: Date.now(),
        lines: [
          {
            id: 1, name: 'Monstera', price: 42, listPrice: 42,
            discountPercent: null, image: null, vivero: 'V', stock: 5, qty: 1,
          },
        ],
      }),
    );
    await mount();

    await act(async () => {
      screen.getByTestId('add').click();
    });

    // The caller already held a fresh price; not taking it is how a line kept
    // a stale one indefinitely.
    expect(lines()[0].price).toBe(30);
    expect(lines()[0].qty).toBe(2);
  });
});

describe('subtotal and savings', () => {
  it('bills the discounted price and reports what was saved', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: 2,
        pricedAt: Date.now(),
        lines: [
          {
            id: 1, name: 'Monstera', price: 35.7, listPrice: 42,
            discountPercent: 15, image: null, vivero: 'V', stock: 5, qty: 2,
          },
        ],
      }),
    );
    await mount();

    expect(Number(screen.getByTestId('subtotal').textContent)).toBeCloseTo(71.4);
    expect(Number(screen.getByTestId('savings').textContent)).toBeCloseTo(12.6);
  });
});

describe('reconcile', () => {
  const seed = (qty = 2, stock = 5) => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: 2,
        pricedAt: Date.now(),
        lines: [
          {
            id: 1, name: 'Monstera', price: 42, listPrice: 42,
            discountPercent: null, image: null, vivero: 'V', stock, qty,
          },
        ],
      }),
    );
  };

  it('updates the price and reports the change', async () => {
    seed();
    getCartPricing.mockResolvedValue([
      { id: 1, price: 35.7, original_price: 42, discount_percent: 15, stock: 5 },
    ]);
    await mount();
    await act(async () => {
      screen.getByTestId('reconcile').click();
    });

    expect(lines()[0].price).toBe(35.7);
    expect(lines()[0].listPrice).toBe(42);
    expect(changes()).toEqual([{ id: 1, name: 'Monstera', from: 42, to: 35.7 }]);
  });

  it('clamps quantity to the stock that is left', async () => {
    seed(4, 10);
    getCartPricing.mockResolvedValue([
      { id: 1, price: 42, original_price: null, discount_percent: null, stock: 2 },
    ]);
    await mount();
    await act(async () => {
      screen.getByTestId('reconcile').click();
    });

    expect(lines()[0].qty).toBe(2);
  });

  it('drops a line the API no longer returns', async () => {
    // Absent means gone — deleted, paused, or the vivero went inactive.
    seed();
    getCartPricing.mockResolvedValue([]);
    await mount();
    await act(async () => {
      screen.getByTestId('reconcile').click();
    });

    expect(lines()).toEqual([]);
    expect(removed()).toEqual(['Monstera']);
  });

  it('drops a line that sold out', async () => {
    seed();
    getCartPricing.mockResolvedValue([
      { id: 1, price: 42, original_price: null, discount_percent: null, stock: 0 },
    ]);
    await mount();
    await act(async () => {
      screen.getByTestId('reconcile').click();
    });

    expect(lines()).toEqual([]);
    expect(removed()).toEqual(['Monstera']);
  });

  it('keeps the cart intact when the request fails', async () => {
    seed();
    getCartPricing.mockRejectedValue(new Error('offline'));
    await mount();
    await act(async () => {
      screen.getByTestId('reconcile').click();
    });

    expect(lines()).toHaveLength(1);
    expect(lines()[0].price).toBe(42);
  });
});
