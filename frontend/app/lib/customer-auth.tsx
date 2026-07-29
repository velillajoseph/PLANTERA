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
import AuthModal from '../components/shop/AuthModal';
import IdleWarningModal from '../components/IdleWarningModal';
import {
  ApiError,
  addFavorite,
  customerLogin,
  customerLogout,
  CUSTOMER_TOKEN_KEY,
  customerTokenStore,
  getCustomerMe,
  getFavoriteIds,
  removeFavorite,
  touchCustomerSession,
  type CustomerProfile,
} from './customer-api';
import { useIdleLogout } from './use-idle-logout';

/** Customers browse for longer than vendors work, so their window is looser. */
const CUSTOMER_IDLE_MS = 60 * 60 * 1000;

export type AuthMode = 'login' | 'register' | 'verify';

export type CustomerAuthValue = {
  status: 'loading' | 'anon' | 'authed';
  customer: CustomerProfile | null;
  favoriteIds: ReadonlySet<number>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isFavorite: (itemId: number) => boolean;
  toggleFavorite: (itemId: number) => Promise<void>;
  authMode: AuthMode | null;
  openAuth: (mode: AuthMode, email?: string) => void;
  closeAuth: () => void;
  pendingEmail: string;
};

const CustomerAuthContext = createContext<CustomerAuthValue | null>(null);

const EMPTY: ReadonlySet<number> = new Set();

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'anon' | 'authed'>('loading');
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<number>>(EMPTY);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');

  const reset = useCallback(() => {
    setCustomer(null);
    setFavoriteIds(EMPTY);
    setStatus('anon');
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const { ids } = await getFavoriteIds();
      setFavoriteIds(new Set(ids));
    } catch {
      // A failed favorites fetch shouldn't block the signed-in state.
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setCustomer(await getCustomerMe());
      setStatus('authed');
      void loadFavorites();
    } catch {
      // Any failure here — expired token, server down — means "not signed in".
      // The storefront stays fully usable either way.
      customerTokenStore.clear();
      reset();
    }
  }, [loadFavorites, reset]);

  useEffect(() => {
    if (!customerTokenStore.get()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resolves the initial anon state on mount
      setStatus('anon');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial profile fetch on mount
    void loadProfile();
  }, [loadProfile]);

  // Signing out in one tab signs out the rest.
  useEffect(
    () =>
      customerTokenStore.subscribe((token) => {
        if (!token) reset();
      }),
    [reset],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await customerLogin(email, password);
      customerTokenStore.set(result.token);
      setCustomer(result.customer);
      setStatus('authed');
      setAuthMode(null);
      void loadFavorites();
    },
    [loadFavorites],
  );

  const logout = useCallback(async () => {
    try {
      await customerLogout();
    } catch {
      // Unreachable server or an already-revoked session; clear locally anyway.
    }
    customerTokenStore.clear();
    reset();
  }, [reset]);

  const refresh = useCallback(async () => {
    if (!customerTokenStore.get()) return;
    await loadProfile();
  }, [loadProfile]);

  const openAuth = useCallback((mode: AuthMode, email = '') => {
    setAuthMode(mode);
    setPendingEmail(email);
  }, []);

  const closeAuth = useCallback(() => setAuthMode(null), []);

  const isFavorite = useCallback(
    (itemId: number) => favoriteIds.has(itemId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (itemId: number) => {
      if (status !== 'authed') {
        // Sign-in is contextual: the modal opens over the page the person is
        // already on, so nothing is lost and the URL never changes.
        openAuth('login');
        return;
      }

      const wasFavorite = favoriteIds.has(itemId);
      const optimistic = new Set(favoriteIds);
      if (wasFavorite) optimistic.delete(itemId);
      else optimistic.add(itemId);
      setFavoriteIds(optimistic);

      try {
        if (wasFavorite) await removeFavorite(itemId);
        else await addFavorite(itemId);
      } catch (error) {
        setFavoriteIds(favoriteIds);
        if (error instanceof ApiError && error.status === 401) {
          reset();
          openAuth('login');
        }
      }
    },
    [status, favoriteIds, openAuth, reset],
  );

  const { warning, secondsLeft, staySignedIn } = useIdleLogout({
    enabled: status === 'authed',
    idleMs: CUSTOMER_IDLE_MS,
    activityKey: 'plantera-customer-activity',
    tokenKey: CUSTOMER_TOKEN_KEY,
    onIdle: () => void logout(),
    onExtend: touchCustomerSession,
  });

  const value = useMemo<CustomerAuthValue>(
    () => ({
      status,
      customer,
      favoriteIds,
      login,
      logout,
      refresh,
      isFavorite,
      toggleFavorite,
      authMode,
      openAuth,
      closeAuth,
      pendingEmail,
    }),
    [
      status,
      customer,
      favoriteIds,
      login,
      logout,
      refresh,
      isFavorite,
      toggleFavorite,
      authMode,
      openAuth,
      closeAuth,
      pendingEmail,
    ],
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
      <AuthModal />
      <IdleWarningModal
        open={warning}
        secondsLeft={secondsLeft}
        onStay={staySignedIn}
        onLogout={() => void logout()}
      />
    </CustomerAuthContext.Provider>
  );
}

export function useCustomer(): CustomerAuthValue {
  const value = useContext(CustomerAuthContext);
  if (!value) {
    throw new Error('useCustomer must be used inside CustomerProvider');
  }
  return value;
}
