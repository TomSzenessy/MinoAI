import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { readSettings, writeSettings } from "../lib/settings";

type LocalStorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function createLocalStorageMock(): LocalStorageMock {
  const data = new Map<string, string>();

  return {
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

const originalWindow = globalThis.window;

beforeEach(() => {
  const localStorage = createLocalStorageMock();
  Object.defineProperty(globalThis, "window", {
    value: { localStorage },
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

describe("settings storage", () => {
  it("returns defaults when empty", () => {
    const settings = readSettings();
    expect(settings.locale).toBe("en");
    expect(settings.theme).toBe("dark");
    expect(settings.agent.permissions.delete).toBe(false);
  });

  it("writes and reads user settings", () => {
    const saved = writeSettings({ locale: "de", theme: "light", enabledPlugins: ["web-search"] });
    const loaded = readSettings();

    expect(saved.locale).toBe("de");
    expect(loaded.theme).toBe("light");
    expect(loaded.enabledPlugins).toEqual(["web-search"]);
  });

  it("merges partial nested updates", () => {
    writeSettings({
      agent: {
        enabled: true,
        model: "openai/gpt-5",
        apiKey: "abc",
        permissions: {
          read: true,
          write: true,
          edit: true,
          delete: false,
          organize: false,
        },
      },
    });

    const next = writeSettings({
      agent: {
        permissions: {
          delete: true,
          organize: true,
        },
      },
    });

    expect(next.agent.permissions.read).toBe(true);
    expect(next.agent.permissions.delete).toBe(true);
    expect(next.agent.permissions.organize).toBe(true);
  });
});
