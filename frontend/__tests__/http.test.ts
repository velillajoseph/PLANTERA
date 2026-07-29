import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  createTokenStore,
  onSessionWindow,
  request,
} from '../app/lib/http';

function respond(
  status: number,
  body: unknown = {},
  headers: Record<string, string> = {},
) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createTokenStore', () => {
  it('notifies local subscribers on set and clear', () => {
    const store = createTokenStore('probe-token');
    const seen: (string | null)[] = [];
    const unsubscribe = store.subscribe((token) => seen.push(token));

    store.set('abc');
    store.clear();
    unsubscribe();
    store.set('ignored');

    // The native storage event only fires in *other* tabs, so a store that
    // relied on it alone would never tell this tab about its own writes.
    expect(seen).toEqual(['abc', null]);
  });

  it('picks up writes from another tab', () => {
    const store = createTokenStore('cross-tab-token');
    const seen: (string | null)[] = [];
    store.subscribe((token) => seen.push(token));

    window.dispatchEvent(
      new StorageEvent('storage', { key: 'cross-tab-token', newValue: 'xyz' }),
    );
    // A different key must not trip it.
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'other-token', newValue: 'nope' }),
    );

    expect(seen).toEqual(['xyz']);
  });
});

describe('request', () => {
  it('sends the store bearer token', async () => {
    const store = createTokenStore('bearer-token');
    store.set('secret');
    const fetchMock = vi.fn().mockResolvedValue(respond(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await request(store, '/api/thing');

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer secret');
  });

  it('a 401 clears only the store that made the request', async () => {
    const vendor = createTokenStore('vendor-token');
    const customer = createTokenStore('customer-token');
    vendor.set('v');
    customer.set('c');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(401)));

    await expect(request(vendor, '/api/vendor/me')).rejects.toBeInstanceOf(ApiError);

    expect(vendor.get()).toBeNull();
    // One browser can hold both sessions; a vendor 401 must not sign the
    // shopper out of the storefront.
    expect(customer.get()).toBe('c');
  });

  it('surfaces the server detail on a non-401 failure', async () => {
    const store = createTokenStore('detail-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respond(400, { detail: 'email_not_verified' })),
    );

    await expect(request(store, '/api/x')).rejects.toMatchObject({
      status: 400,
      message: 'email_not_verified',
    });
  });

  it('resolves undefined for 204', async () => {
    const store = createTokenStore('empty-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(204)));

    await expect(request(store, '/api/x', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('publishes the session window from the response header', async () => {
    const store = createTokenStore('window-token');
    const seen: Array<[string, string]> = [];
    const unsubscribe = onSessionWindow((key, expiresAt) =>
      seen.push([key, expiresAt.toISOString()]),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        respond(200, {}, { 'X-Session-Expires-At': '2026-07-28T12:20:00Z' }),
      ),
    );

    await request(store, '/api/x');
    unsubscribe();

    expect(seen).toEqual([['window-token', '2026-07-28T12:20:00.000Z']]);
  });

  it('ignores a malformed expiry header rather than corrupting the clock', async () => {
    const store = createTokenStore('bad-window-token');
    const seen: string[] = [];
    const unsubscribe = onSessionWindow((key) => seen.push(key));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respond(200, {}, { 'X-Session-Expires-At': 'soon' })),
    );

    await request(store, '/api/x');
    unsubscribe();

    expect(seen).toEqual([]);
  });
});
