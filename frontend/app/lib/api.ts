const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const TOKEN_KEY = 'plantera-vendor-token';

export type VendorProfile = {
  id: number;
  name: string;
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
  price: number;
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

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearToken();
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

/** Multipart upload — the browser must set its own boundary, so no JSON header. */
export async function uploadInventoryImage(id: number, file: File) {
  const token = getToken();
  const body = new FormData();
  body.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/api/vendor/inventory/${id}/image`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    },
  );

  if (response.status === 401) {
    clearToken();
    throw new ApiError(401, 'unauthorized');
  }
  if (!response.ok) {
    throw new ApiError(response.status, 'upload_failed');
  }
  return (await response.json()) as InventoryItem;
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
