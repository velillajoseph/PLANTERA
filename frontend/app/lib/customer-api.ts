import { ApiError, createTokenStore, request } from './http';

export { ApiError };

/**
 * Customer-side API client. Separate token store from the vendor client on
 * purpose: one browser can hold both sessions, and a 401 on one must not sign
 * the other out.
 */
export const CUSTOMER_TOKEN_KEY = 'plantera-customer-token';
export const customerTokenStore = createTokenStore(CUSTOMER_TOKEN_KEY);

function customerFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(customerTokenStore, path, options);
}

export type CustomerProfile = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_verified: boolean;
  created_at: string;
};

export type RegistrationResponse = {
  customer: CustomerProfile;
  verification_required: boolean;
  /** Only present when the server is configured to echo the emailed code. */
  verification_preview: string | null;
  message: string;
};

export type PlantPreview = {
  id: number;
  store_id: number;
  store_name: string | null;
  title: string;
  /** Effective price — discount already applied, like CatalogItem.price. */
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  image_url: string | null;
};

export type FavoriteItem = {
  id: number;
  customer_id: number;
  created_at: string;
  plant: PlantPreview;
};

export type OrderLine = {
  plant_name: string;
  quantity: number;
  unit_price: number;
};

export type CustomerOrder = {
  id: number;
  store_name: string;
  total: number;
  created_at: string;
  items: OrderLine[];
};

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  password: string;
};

export function customerRegister(payload: RegisterPayload) {
  return customerFetch<RegistrationResponse>('/api/customers/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function customerVerify(email: string, code: string) {
  return customerFetch<CustomerProfile>('/api/customers/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function customerResendCode(email: string) {
  return customerFetch<RegistrationResponse>('/api/customers/resend-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function customerLogin(email: string, password: string) {
  return customerFetch<{
    token: string;
    customer: CustomerProfile;
    expires_at: string;
  }>('/api/customers/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function customerLogout() {
  return customerFetch<void>('/api/customers/logout', { method: 'POST' });
}

export function getCustomerMe() {
  return customerFetch<CustomerProfile>('/api/customers/me');
}

export function updateCustomerProfile(payload: {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
}) {
  return customerFetch<CustomerProfile>('/api/customers/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function changeCustomerPassword(
  currentPassword: string,
  newPassword: string,
) {
  return customerFetch<void>('/api/customers/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

/** Explicit keep-alive behind the "stay signed in" button. */
export function touchCustomerSession() {
  return customerFetch<{ expires_at: string }>('/api/customers/session/touch', {
    method: 'POST',
  });
}

export function getFavorites() {
  return customerFetch<FavoriteItem[]>('/api/customers/favorites');
}

export function getFavoriteIds() {
  return customerFetch<{ ids: number[] }>('/api/customers/favorites/ids');
}

export function addFavorite(inventoryItemId: number) {
  return customerFetch<FavoriteItem>('/api/customers/favorites', {
    method: 'POST',
    body: JSON.stringify({ inventory_item_id: inventoryItemId }),
  });
}

export function removeFavorite(inventoryItemId: number) {
  return customerFetch<void>(`/api/customers/favorites/${inventoryItemId}`, {
    method: 'DELETE',
  });
}

export function getCustomerOrders() {
  return customerFetch<CustomerOrder[]>('/api/customers/orders');
}
