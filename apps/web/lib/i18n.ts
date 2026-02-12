/**
 * Mino i18n utilities.
 *
 * Static-export friendly localization based on localStorage.
 */

import en from "@/messages/en.json";
import es from "@/messages/es.json";
import de from "@/messages/de.json";

export type Locale = "en" | "es" | "de";

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "es", "de"] as const;
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "mino.locale";
export const LOCALE_EVENT = "mino:locale-change";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
};

type Messages = Record<string, unknown>;

const dictionaries: Record<Locale, Messages> = { en, es, de };

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "es" || value === "de";
}

export function getLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function setLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  window.dispatchEvent(new Event(LOCALE_EVENT));
}

function resolve(key: string, messages: Messages): string {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (current === null || typeof current !== "object") return key;
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : key;
}

export function createTranslator(locale: Locale): (key: string) => string {
  const messages = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const fallback = dictionaries[DEFAULT_LOCALE];

  return (key: string) => {
    const translated = resolve(key, messages);
    if (translated === key && locale !== DEFAULT_LOCALE) {
      return resolve(key, fallback);
    }
    return translated;
  };
}
