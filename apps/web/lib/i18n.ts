/**
 * Mino i18n — Lightweight client-side internationalization.
 *
 * Supports: English (en), Spanish (es), German (de).
 * Locale is stored in localStorage and applied on page load.
 * Works with Next.js static export (no server-side locale detection).
 */

import en from "@/messages/en.json";
import es from "@/messages/es.json";
import de from "@/messages/de.json";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

/** Supported locale codes. */
export type Locale = "en" | "es" | "de";

/** All supported locales in display order. */
export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "es", "de"] as const;

/** Human-readable locale names for the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
};

/** The fallback locale when none is stored or the stored value is invalid. */
export const DEFAULT_LOCALE: Locale = "en";

/** localStorage key for the user's chosen locale. */
const STORAGE_KEY = "mino.locale";

// ---------------------------------------------------------------------------
// Message dictionaries
// ---------------------------------------------------------------------------

type Messages = Record<string, unknown>;

const dictionaries: Record<Locale, Messages> = { en, es, de };

// ---------------------------------------------------------------------------
// Locale persistence
// ---------------------------------------------------------------------------

/**
 * Read the stored locale from localStorage.
 * Falls back to {@link DEFAULT_LOCALE} when nothing is stored, the value is
 * invalid, or the code runs on the server.
 */
export function getLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }

  return DEFAULT_LOCALE;
}

/**
 * Persist a locale choice to localStorage.
 * Dispatches a `storage` event so other tabs can react.
 */
export function setLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, locale);

  // Notify other components listening for locale changes.
  window.dispatchEvent(new Event("mino:locale-change"));
}

// ---------------------------------------------------------------------------
// Translation function
// ---------------------------------------------------------------------------

/**
 * Resolve a dot-separated key against a nested messages object.
 *
 * @example
 * resolve("hero.title", { hero: { title: "Hello" } }) // → "Hello"
 */
function resolve(key: string, messages: Messages): string {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (current === null || typeof current !== "object") return key;
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : key;
}

/**
 * Create a translation function for the given locale.
 * Returns the raw key if the translation is missing (fail-open).
 */
export function createTranslator(locale: Locale): (key: string) => string {
  const messages = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const fallback = dictionaries[DEFAULT_LOCALE];

  return (key: string): string => {
    const result = resolve(key, messages);
    // If the key wasn't found in the target locale, try the fallback.
    if (result === key && locale !== DEFAULT_LOCALE) {
      return resolve(key, fallback);
    }
    return result;
  };
}
