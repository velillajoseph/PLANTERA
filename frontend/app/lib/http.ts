/**
 * Transport shared by the vendor and customer API clients.
 *
 * Two independent token stores exist because a browser can hold both a vendor
 * session and a customer session at once. Keeping them separate means a 401 on
 * one side never silently signs the other side out.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/** Server-reported session expiry, so the idle timer can correct its own clock. */
const SESSION_HEADER = 'X-Session-Expires-At';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type TokenStore = {
  key: string;
  get(): string | null;
  set(token: string): void;
  clear(): void;
  /** Fires on local writes AND on the storage event from other tabs. */
  subscribe(fn: (token: string | null) => void): () => void;
};

export function createTokenStore(key: string): TokenStore {
  const listeners = new Set<(token: string | null) => void>();

  const notify = (token: string | null) => {
    listeners.forEach((fn) => fn(token));
  };

  return {
    key,
    get() {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    },
    set(token: string) {
      window.localStorage.setItem(key, token);
      // The native storage event only fires in *other* tabs, so this tab has
      // to be told explicitly or it never learns about its own writes.
      notify(token);
    },
    clear() {
      window.localStorage.removeItem(key);
      notify(null);
    },
    subscribe(fn) {
      listeners.add(fn);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) fn(event.newValue);
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', onStorage);
      }
      return () => {
        listeners.delete(fn);
        if (typeof window !== 'undefined') {
          window.removeEventListener('storage', onStorage);
        }
      };
    },
  };
}

type SessionWindowListener = (key: string, expiresAt: Date) => void;

const sessionWindowListeners = new Set<SessionWindowListener>();

/** Subscribe to the server's view of when the current session dies. */
export function onSessionWindow(fn: SessionWindowListener): () => void {
  sessionWindowListeners.add(fn);
  return () => {
    sessionWindowListeners.delete(fn);
  };
}

function publishSessionWindow(store: TokenStore, response: Response) {
  // Requires CORS expose_headers on the API, or this is always null.
  const raw = response.headers.get(SESSION_HEADER);
  if (!raw) return;
  const expiresAt = new Date(raw);
  if (Number.isNaN(expiresAt.getTime())) return;
  sessionWindowListeners.forEach((fn) => fn(store.key, expiresAt));
}

async function handle<T>(store: TokenStore, response: Response): Promise<T> {
  publishSessionWindow(store, response);

  if (response.status === 401) {
    store.clear();
    throw new ApiError(401, 'unauthorized');
  }
  if (!response.ok) {
    let detail = 'request_failed';
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      // keep generic detail
    }
    throw new ApiError(response.status, detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function request<T>(
  store: TokenStore,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = store.get();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return handle<T>(store, response);
}

/** Multipart upload — the browser must set its own boundary, so no JSON header. */
export async function upload<T>(
  store: TokenStore,
  path: string,
  file: File,
): Promise<T> {
  const token = store.get();
  const body = new FormData();
  body.append('file', file);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  return handle<T>(store, response);
}
