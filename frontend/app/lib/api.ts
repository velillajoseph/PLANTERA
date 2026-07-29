import { ApiError, createTokenStore, request, upload } from './http';

export { ApiError };

/**
 * Vendor-side API client. The transport lives in `http.ts`; this module only
 * owns the vendor token and the endpoint list.
 */
export const VENDOR_TOKEN_KEY = 'plantera-vendor-token';
export const vendorTokenStore = createTokenStore(VENDOR_TOKEN_KEY);

export function getToken(): string | null {
  return vendorTokenStore.get();
}

export function setToken(token: string) {
  vendorTokenStore.set(token);
}

export function clearToken() {
  vendorTokenStore.clear();
}

function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(vendorTokenStore, path, options);
}

export type VendorProfile = {
  id: number;
  name: string;
  store_discount_percent: number;
  store_discount_starts_at: string | null;
  store_discount_ends_at: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  address: string | null;
  banner_image: string | null;
  dashboard_message: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryItem = {
  id: number;
  store_id: number;
  plant_name: string;
  description: string | null;
  /** The **list** price the vivero set — never the discounted one. */
  price: number;
  discount_percent: number;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
  stock: number;
  image_url: string | null;
  tags: string | null;
  genus: string | null;
  category: string; // "plant" | "pot" | "supply"
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type TopPlant = { plant_name: string; units: number };

export type MonthlyDetail = {
  month: string; // "YYYY-MM"
  revenue: number;
  orders: number;
  top_plants: TopPlant[];
};

export type RecentOrder = {
  id: number;
  customer_name: string;
  total: number;
  items: number;
  created_at: string;
};

export type VendorStats = {
  totals: {
    orders: number;
    revenue: number;
    avg_order: number;
    active_listings: number;
  };
  monthly: MonthlyDetail[];
  top_plants: TopPlant[];
  low_stock: InventoryItem[];
  recent_orders: RecentOrder[];
};

export function vendorLogin(email: string, password: string) {
  return apiFetch<{ token: string; vendor: VendorProfile }>(
    '/api/vendor/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );
}

export function vendorLogout() {
  return apiFetch<void>('/api/vendor/logout', { method: 'POST' });
}

export function getMe() {
  return apiFetch<VendorProfile>('/api/vendor/me');
}

export function getInventory() {
  return apiFetch<InventoryItem[]>('/api/vendor/inventory');
}

export type InventoryPayload = {
  plant_name: string;
  discount_percent?: number;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
  description?: string | null;
  price: number;
  stock: number;
  image_url?: string | null;
  tags?: string | null;
  genus?: string | null;
  category?: string;
  is_active?: boolean;
  is_featured?: boolean;
};

export function createInventoryItem(payload: InventoryPayload) {
  return apiFetch<InventoryItem>('/api/vendor/inventory', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateInventoryItem(
  id: number,
  payload: Partial<InventoryPayload>,
) {
  return apiFetch<InventoryItem>(`/api/vendor/inventory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteInventoryItem(id: number) {
  return apiFetch<void>(`/api/vendor/inventory/${id}`, { method: 'DELETE' });
}

export function uploadInventoryImage(id: number, file: File) {
  return upload<InventoryItem>(
    vendorTokenStore,
    `/api/vendor/inventory/${id}/image`,
    file,
  );
}

export function removeInventoryImage(id: number) {
  return apiFetch<InventoryItem>(`/api/vendor/inventory/${id}/image`, {
    method: 'DELETE',
  });
}

export function getStats() {
  return apiFetch<VendorStats>('/api/vendor/stats');
}

export type OrderLine = {
  plant_name: string;
  quantity: number;
  unit_price: number;
};

export type VendorOrder = {
  id: number;
  customer_name: string;
  total: number;
  created_at: string;
  items: OrderLine[];
};

export type OrdersPage = {
  total: number;
  page: number;
  page_size: number;
  months: string[]; // "YYYY-MM", newest first
  orders: VendorOrder[];
};

export function getOrders(
  params: { page?: number; pageSize?: number; month?: string } = {},
) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('page_size', String(params.pageSize));
  if (params.month) query.set('month', params.month);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<OrdersPage>(`/api/vendor/orders${suffix}`);
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<void>('/api/vendor/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export function updateProfile(payload: {
  name?: string;
  store_discount_percent?: number;
  store_discount_starts_at?: string | null;
  store_discount_ends_at?: string | null;
  phone?: string | null;
  bio?: string | null;
  address?: string | null;
  banner_image?: string | null;
  dashboard_message?: string | null;
}) {
  return apiFetch<VendorProfile>('/api/vendor/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
