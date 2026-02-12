"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LOCALE_EVENT,
  LOCALE_STORAGE_KEY,
  LOCALE_NAMES,
  SUPPORTED_LOCALES,
  createTranslator,
  getLocale,
  setLocale as persistLocale,
  type Locale,
} from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getLocale());

    const handleLocaleEvent = () => setLocaleState(getLocale());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY) {
        setLocaleState(getLocale());
      }
    };

    window.addEventListener(LOCALE_EVENT, handleLocaleEvent);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(LOCALE_EVENT, handleLocaleEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const changeLocale = useCallback((next: Locale) => {
    persistLocale(next);
    setLocaleState(next);
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);
  const value = useMemo(
    () => ({ locale, setLocale: changeLocale, t }),
    [locale, changeLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider.");
  }
  return context;
}

export { LOCALE_NAMES, SUPPORTED_LOCALES };
