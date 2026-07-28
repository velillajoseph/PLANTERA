'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Lang = 'es' | 'en';

export type Localized = { es: string; en: string };

const STORAGE_KEY = 'plantera-lang';

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
}>({ lang: 'es', setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage after hydration
      setLangState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
