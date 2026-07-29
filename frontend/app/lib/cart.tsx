'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getCartPricing, type CatalogItem } from './catalog';

const STORAGE_KEY = 'plantera-cart';

/**
 * Bumped when the persisted shape changes. The key itself must never change —
 * a new key silently empties every cart that is already out there.
 */
const STORAGE_VERSION = 2;

/** How stale a cart may be before it is re-priced on load. */
const STALE_AFTER_MS = 5 * 60 * 1000;

export type CartLine = {
  id: number;
  name: string;
  /** What the shopper pays — the effective price at the last reconcile. */
  price: number;
  /** The pre-discount price, for the strikethrough. Equals `price` when not on sale. */
  listPrice: number;
  discountPercent: number | null;
  image: string | null;
  vivero: string;
  stock: number;
  qty: number;
};

export type PriceChange = { id: number; name: string; from: number; to: number };

type StoredCart = { v: number; lines: CartLine[]; pricedAt: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  /** Total saved against list prices; 0 when nothing is discounted. */
  savings: number;
  /** Increments when an item is added, so the badge can animate. */
  lastAddedAt: number;
  add: (item: CatalogItem, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  /** Re-reads prices and stock from the API and updates every line. */
  reconcile: () => Promise<void>;
  priceChanges: PriceChange[];
  removedNames: string[];
  dismissNotice: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineFromItem(item: CatalogItem, qty: number): CartLine {
  return {
    id: item.id,
    name: item.plant_name,
    price: item.price,
    listPrice: item.original_price ?? item.price,
    discountPercent: item.discount_percent,
    image: item.image_url,
    vivero: item.store_name,
    stock: item.stock,
    qty: Math.min(qty, item.stock),
  };
}

function readStored(raw: string): StoredCart | null {
  try {
    const parsed = JSON.parse(raw);
    // v1 persisted a bare CartLine[]. Migrate rather than discard — someone's
    // cart is not worth losing over a schema bump. `listPrice` backfills from
    // `price`, which is right: v1 had no discounts.
    if (Array.isArray(parsed)) {
      return {
        v: STORAGE_VERSION,
        pricedAt: 0,
        lines: parsed.map((line: CartLine) => ({
          ...line,
          listPrice: line.listPrice ?? line.price,
          discountPercent: line.discountPercent ?? null,
        })),
      };
    }
    if (parsed && parsed.v === STORAGE_VERSION && Array.isArray(parsed.lines)) {
      return { v: STORAGE_VERSION, lines: parsed.lines, pricedAt: parsed.pricedAt ?? 0 };
    }
  } catch {
    // Corrupt cart data is not worth surfacing; start empty.
  }
  return null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const [removedNames, setRemovedNames] = useState<string[]>([]);
  // A timestamp, not state: it must not trigger a render, and it is read
  // inside the reconcile effect without becoming a dependency.
  const pricedAt = useRef(0);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = readStored(raw);
      if (stored) {
        pricedAt.current = stored.pricedAt;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restores the cart from localStorage after hydration
        setLines(stored.lines);
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marks hydration complete so we don't overwrite storage on first render
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: StoredCart = { v: STORAGE_VERSION, lines, pricedAt: pricedAt.current };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [lines, hydrated]);

  const reconcile = useCallback(async () => {
    const ids = lines.map((line) => line.id);
    if (!ids.length) return;

    let pricing;
    try {
      pricing = await getCartPricing(ids);
    } catch {
      // Keep the last known prices rather than emptying the cart on a blip.
      return;
    }

    const byId = new Map(pricing.map((entry) => [entry.id, entry]));
    const changes: PriceChange[] = [];
    const removed: string[] = [];

    const next = lines.flatMap((line) => {
      const fresh = byId.get(line.id);
      // Absent means gone — deleted, paused, or the vivero went inactive.
      if (!fresh || fresh.stock <= 0) {
        removed.push(line.name);
        return [];
      }
      if (fresh.price !== line.price) {
        changes.push({ id: line.id, name: line.name, from: line.price, to: fresh.price });
      }
      return [
        {
          ...line,
          price: fresh.price,
          listPrice: fresh.original_price ?? fresh.price,
          discountPercent: fresh.discount_percent,
          stock: fresh.stock,
          qty: Math.min(line.qty, fresh.stock),
        },
      ];
    });

    pricedAt.current = Date.now();
    setLines(next);
    setPriceChanges(changes);
    setRemovedNames(removed);
  }, [lines]);

  // One catch-up pass after hydration. Deliberately not on every mount: the
  // cart page re-runs it unconditionally, and the mini-cart would be chatty.
  const caughtUp = useRef(false);
  useEffect(() => {
    if (!hydrated || caughtUp.current) return;
    caughtUp.current = true;
    if (lines.length && Date.now() - pricedAt.current > STALE_AFTER_MS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one catch-up re-price after the cart is restored from storage
      void reconcile();
    }
  }, [hydrated, lines.length, reconcile]);

  const add = useCallback((item: CatalogItem, qty = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.id === item.id);
      if (existing) {
        // Refresh from the incoming item rather than only bumping quantity —
        // this is the one moment the caller already holds a fresh price, and
        // not taking it is how a line kept a stale price indefinitely.
        const merged = lineFromItem(item, existing.qty + qty);
        return current.map((line) => (line.id === item.id ? merged : line));
      }
      return [...current, lineFromItem(item, qty)];
    });
    setLastAddedAt(Date.now());
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    setLines((current) =>
      current.flatMap((line) => {
        if (line.id !== id) return [line];
        const next = Math.min(Math.max(qty, 0), line.stock);
        return next === 0 ? [] : [{ ...line, qty: next }];
      }),
    );
  }, []);

  const remove = useCallback((id: number) => {
    setLines((current) => current.filter((line) => line.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const dismissNotice = useCallback(() => {
    setPriceChanges([]);
    setRemovedNames([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.qty, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0);
    const listTotal = lines.reduce((sum, line) => sum + line.qty * line.listPrice, 0);
    return {
      lines,
      count,
      subtotal,
      savings: Math.max(listTotal - subtotal, 0),
      lastAddedAt,
      add,
      setQty,
      remove,
      clear,
      reconcile,
      priceChanges,
      removedNames,
      dismissNotice,
    };
  }, [
    lines,
    lastAddedAt,
    add,
    setQty,
    remove,
    clear,
    reconcile,
    priceChanges,
    removedNames,
    dismissNotice,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
