import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  PLUGIN_REGISTRY,
  isPluginEnabled,
  readPluginConfigs,
  togglePlugin,
  writePluginConfig,
} from "../lib/plugins";

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

describe("plugins", () => {
  it("exposes plugin registry", () => {
    expect(PLUGIN_REGISTRY.length).toBeGreaterThan(0);
    expect(PLUGIN_REGISTRY.some((plugin) => plugin.id === "web-search")).toBe(true);
  });

  it("toggles plugin enable state", () => {
    const afterEnable = togglePlugin("web-search", []);
    expect(isPluginEnabled("web-search", afterEnable)).toBe(true);

    const afterDisable = togglePlugin("web-search", afterEnable);
    expect(isPluginEnabled("web-search", afterDisable)).toBe(false);
  });

  it("persists plugin config", () => {
    writePluginConfig("web-search", { apiKey: "test-key" });
    const configs = readPluginConfigs();

    expect(configs["web-search"]?.apiKey).toBe("test-key");
  });
});
