/**
 * Mino i18n utilities.
 *
 * Static-export friendly localization based on localStorage.
 */

import en from "@/messages/en.json";
import es from "@/messages/es.json";
import de from "@/messages/de.json";

export type Locale = "en" | "es" | "de";
export type TranslationValues = Record<string, string | number>;
type TranslationDictionary = typeof en;

type JoinPath<Prefix extends string, Key extends string> = `${Prefix}.${Key}`;
type NestedLeafKeys<T> = T extends string
  ? never
  : {
      [K in keyof T & string]:
        T[K] extends string
          ? K
          : T[K] extends Record<string, unknown>
            ? JoinPath<K, NestedLeafKeys<T[K]>>
            : never;
    }[keyof T & string];

export type TranslationKey = NestedLeafKeys<TranslationDictionary>;
export type TranslationFn = (key: TranslationKey, values?: TranslationValues) => string;

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

const dictionaries: Record<Locale, TranslationDictionary> = { en, es, de };
const keyCache = new Map<Locale, Set<string>>();

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

function resolve(key: string, messages: Messages): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (full, variable) => {
    const value = values[variable];
    return value === undefined ? full : String(value);
  });
}

function humanizeKey(key: string): string {
  const segment = key.split(".").at(-1) ?? key;
  const normalized = segment
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  if (!normalized) {
    return "Missing translation";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function flattenKeys(messages: Messages, prefix = "", output: string[] = []): string[] {
  for (const [key, value] of Object.entries(messages)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      output.push(next);
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenKeys(value as Messages, next, output);
    }
  }

  return output;
}

export function getTranslationKeys(locale: Locale): Set<string> {
  const cached = keyCache.get(locale);
  if (cached) {
    return cached;
  }

  const keys = new Set(flattenKeys(dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]));
  keyCache.set(locale, keys);
  return keys;
}

export function hasTranslationKey(locale: Locale, key: string): boolean {
  return getTranslationKeys(locale).has(key);
}

export function createTranslator(locale: Locale): TranslationFn {
  const messages = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const fallback = dictionaries[DEFAULT_LOCALE];

  return (key: TranslationKey, values?: TranslationValues) => {
    const translated = resolve(key, messages);
    if (translated !== undefined) {
      return interpolate(translated, values);
    }

    const fallbackValue = resolve(key, fallback);
    if (fallbackValue !== undefined) {
      return interpolate(fallbackValue, values);
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing translation key: "${key}"`);
    }

    return humanizeKey(key);
  };
}
