'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CatalogItem } from './catalog';

const STORAGE_KEY = 'plantera-cart';

export type CartLine = {
  id: number;
  name: string;
  price: number;
  image: string | null;
  vivero: string;
  stock: number;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  /** Increments when an item is added, so the badge can animate. */
  lastAddedAt: number;
  add: (item: CatalogItem, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restores the cart from localStorage after hydration
        if (Array.isArray(parsed)) setLines(parsed as CartLine[]);
      } catch {
        // Corrupt cart data is not worth surfacing; start empty.
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marks hydration complete so we don't overwrite storage on first render
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((item: CatalogItem, qty = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.id === item.id);
      if (existing) {
        return current.map((line) =>
          line.id === item.id
            ? { ...line, qty: Math.min(line.qty + qty, line.stock) }
            : line,
        );
      }
      return [
        ...current,
        {
          id: item.id,
          name: item.plant_name,
          price: item.price,
          image: item.image_url,
          vivero: item.store_name,
          stock: item.stock,
          qty: Math.min(qty, item.stock),
        },
      ];
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

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.qty, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0);
    return { lines, count, subtotal, lastAddedAt, add, setQty, remove, clear };
  }, [lines, lastAddedAt, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
