import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createTranslator, getLocale, setLocale } from "../lib/i18n";

type LocalStorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function createLocalStorageMock(): LocalStorageMock {
  const storage = new Map<string, string>();

  return {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      storage.set(key, value);
    },
    removeItem(key) {
      storage.delete(key);
    },
  };
}

const originalWindow = globalThis.window;

beforeEach(() => {
  const windowMock = {
    localStorage: createLocalStorageMock(),
    dispatchEvent: () => true,
  } as unknown as Window;

  Object.defineProperty(globalThis, "window", {
    value: windowMock,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, "localStorage", {
    value: windowMock.localStorage,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  if (originalWindow) {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  } else {
    delete (globalThis as { window?: Window }).window;
  }
});

describe("i18n", () => {
  it("returns default locale when no preference is set", () => {
    expect(getLocale()).toBe("en");
  });

  it("persists locale with setLocale and returns it", () => {
    setLocale("es");
    expect(getLocale()).toBe("es");
  });

  it("translates known keys", () => {
    const t = createTranslator("de");
    expect(t("nav.home")).toBe("Startseite");
  });

  it("falls back to english when key is missing in target locale", () => {
    const t = createTranslator("es");
    expect(t("testing.onlyEnFallback")).toBe("Fallback from English");
  });
});
