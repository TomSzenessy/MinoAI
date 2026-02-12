/**
 * Mino Settings — User preferences persistence.
 *
 * Stores settings in localStorage. Provides typed read/write access
 * with defaults for every field. Settings are separate from server
 * profiles (which live in storage.ts).
 */

import type { Locale } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentSettings {
  enabled: boolean;
  model: string;
  apiKey: string;
  permissions: {
    read: boolean;
    write: boolean;
    edit: boolean;
    delete: boolean;
    organize: boolean;
  };
}

export interface UserSettings {
  locale: Locale;
  theme: "dark" | "light" | "system";
  agent: AgentSettings;
  enabledPlugins: string[];
}

export interface UserSettingsUpdate {
  locale?: UserSettings["locale"];
  theme?: UserSettings["theme"];
  enabledPlugins?: UserSettings["enabledPlugins"];
  agent?: Partial<Omit<AgentSettings, "permissions">> & {
    permissions?: Partial<AgentSettings["permissions"]>;
  };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: UserSettings = {
  locale: "en",
  theme: "dark",
  agent: {
    enabled: false,
    model: "anthropic/claude-sonnet-4-20250514",
    apiKey: "",
    permissions: {
      read: true,
      write: true,
      edit: true,
      delete: false,
      organize: false,
    },
  },
  enabledPlugins: [],
};

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = "mino.settings.v1";

/**
 * Read user settings from localStorage, merging with defaults.
 * Returns the full settings object even if only partial data is stored.
 */
export function readSettings(): UserSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };

    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      locale: parsed.locale ?? DEFAULT_SETTINGS.locale,
      theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
      agent: {
        ...DEFAULT_SETTINGS.agent,
        ...parsed.agent,
        permissions: {
          ...DEFAULT_SETTINGS.agent.permissions,
          ...parsed.agent?.permissions,
        },
      },
      enabledPlugins: parsed.enabledPlugins ?? DEFAULT_SETTINGS.enabledPlugins,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Write user settings to localStorage.
 * Accepts a partial update — merges with existing settings.
 */
export function writeSettings(update: UserSettingsUpdate): UserSettings {
  const current = readSettings();
  const next: UserSettings = {
    ...current,
    ...update,
    agent: update.agent
      ? {
          ...current.agent,
          ...update.agent,
          permissions: {
            ...current.agent.permissions,
            ...update.agent.permissions,
          },
        }
      : current.agent,
    enabledPlugins: update.enabledPlugins ?? current.enabledPlugins,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

/**
 * Reset all settings to defaults and clear storage.
 */
export function resetSettings(): UserSettings {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return { ...DEFAULT_SETTINGS };
}
