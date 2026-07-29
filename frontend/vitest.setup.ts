// vitest.setup.ts
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with all jest-dom matchers
expect.extend(matchers);

// This jsdom build starts without localStorage unless Node is given
// --localstorage-file. The app leans on it for the cart, language, session
// tokens, and recent searches, so tests get a real in-memory implementation
// rather than each one working around its absence.
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}
