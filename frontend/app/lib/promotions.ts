import { API_BASE_URL } from './http';

export type Promotion = {
  id: number;
  store_id: number;
  store_name: string;
  headline_es: string;
  headline_en: string;
  body_es: string | null;
  body_en: string | null;
  cta_label_es: string;
  cta_label_en: string;
  cta_href: string;
  image_url: string | null;
};

export async function getPromotions(): Promise<Promotion[]> {
  const response = await fetch(`${API_BASE_URL}/api/promotions`);
  if (!response.ok) throw new Error('promotions_failed');
  return response.json();
}

/**
 * Fire-and-forget analytics. A failed beacon must never surface to the shopper
 * or block a click, so every error is swallowed.
 */
export function recordPromotionEvent(id: number, type: 'impression' | 'click') {
  const url = `${API_BASE_URL}/api/promotions/${id}/event`;
  const body = JSON.stringify({ type });

  // sendBeacon survives the page unload a CTA click triggers; plain fetch
  // would be cancelled mid-navigation.
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      return;
    } catch {
      // fall through to fetch
    }
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}
