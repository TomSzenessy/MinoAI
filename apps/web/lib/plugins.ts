/**
 * Mino Plugin Registry — Plugin metadata and state management.
 *
 * Defines all available plugins with their metadata. Plugin enabled/disabled
 * state is stored via the settings module (lib/settings.ts → enabledPlugins).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PluginStatus = "available" | "coming-soon";

export interface PluginDefinition {
  /** Unique identifier for the plugin. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Short description of what the plugin does. */
  description: string;
  /** Emoji icon for the plugin card. */
  icon: string;
  /** Whether the plugin is ready to use or coming soon. */
  status: PluginStatus;
  /** Whether the plugin requires an API key to configure. */
  requiresApiKey: boolean;
  /** Priority level (P0 = highest). */
  priority: "P0" | "P1" | "P2";
}

export interface PluginConfig {
  apiKey?: string;
}

export type PluginConfigMap = Record<string, PluginConfig>;

// ---------------------------------------------------------------------------
// Plugin Registry
// ---------------------------------------------------------------------------

/**
 * All available plugins, ordered by priority.
 * Matches the plugin list from MASTER_PLAN.md § 9.2.
 */
export const PLUGIN_REGISTRY: readonly PluginDefinition[] = [
  {
    id: "web-search",
    name: "Web Search",
    description: "Search the web via Perplexity, Google, or DuckDuckGo and save results as notes.",
    icon: "🔍",
    status: "available",
    requiresApiKey: true,
    priority: "P0",
  },
  {
    id: "obsidian-import",
    name: "Obsidian Import",
    description: "Import your existing Obsidian vault into Mino with full link and tag preservation.",
    icon: "💎",
    status: "available",
    requiresApiKey: false,
    priority: "P0",
  },
  {
    id: "youtube-transcript",
    name: "YouTube Transcript",
    description: "Import video transcripts from YouTube as formatted markdown notes.",
    icon: "📺",
    status: "available",
    requiresApiKey: false,
    priority: "P1",
  },
  {
    id: "voice-notes",
    name: "Voice Notes",
    description: "Record and transcribe voice memos using Whisper speech-to-text.",
    icon: "🎙️",
    status: "coming-soon",
    requiresApiKey: true,
    priority: "P1",
  },
  {
    id: "email-import",
    name: "Email Import",
    description: "Import emails from Gmail as formatted notes via the Gmail API.",
    icon: "📧",
    status: "coming-soon",
    requiresApiKey: true,
    priority: "P1",
  },
  {
    id: "telegram-bot",
    name: "Telegram Bot",
    description: "Ingest Telegram messages through a secure webhook and run AI actions.",
    icon: "✈️",
    status: "available",
    requiresApiKey: true,
    priority: "P1",
  },
  {
    id: "whatsapp-bot",
    name: "WhatsApp Bot",
    description: "Ingest WhatsApp messages through Meta webhooks and run AI actions.",
    icon: "💚",
    status: "available",
    requiresApiKey: true,
    priority: "P1",
  },
  {
    id: "git-integration",
    name: "Git Integration",
    description: "Auto-commit note changes to a git repository for version history.",
    icon: "🔀",
    status: "coming-soon",
    requiresApiKey: false,
    priority: "P1",
  },
  {
    id: "image-ocr",
    name: "Image OCR",
    description: "Extract text from images and screenshots using optical character recognition.",
    icon: "📷",
    status: "coming-soon",
    requiresApiKey: true,
    priority: "P2",
  },
  {
    id: "rss-feeds",
    name: "RSS / News",
    description: "Follow RSS feeds and clip articles directly into your vault.",
    icon: "📰",
    status: "coming-soon",
    requiresApiKey: false,
    priority: "P2",
  },
  {
    id: "calendar",
    name: "Calendar Sync",
    description: "Import calendar events as daily notes for automatic journaling.",
    icon: "📅",
    status: "coming-soon",
    requiresApiKey: true,
    priority: "P2",
  },
  {
    id: "social-media",
    name: "Social Media",
    description: "Save tweets, threads, and posts from Twitter/X and other platforms.",
    icon: "💬",
    status: "coming-soon",
    requiresApiKey: true,
    priority: "P2",
  },
] as const;

/**
 * Check if a plugin is enabled in the user's settings.
 */
export function isPluginEnabled(pluginId: string, enabledPlugins: string[]): boolean {
  return enabledPlugins.includes(pluginId);
}

/**
 * Toggle a plugin's enabled state. Returns the updated enabled list.
 */
export function togglePlugin(pluginId: string, enabledPlugins: string[]): string[] {
  if (enabledPlugins.includes(pluginId)) {
    return enabledPlugins.filter((id) => id !== pluginId);
  }
  return [...enabledPlugins, pluginId];
}

const PLUGIN_CONFIG_STORAGE_KEY = "mino.pluginConfigs.v1";

export function readPluginConfigs(): PluginConfigMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(PLUGIN_CONFIG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PluginConfigMap;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function writePluginConfig(pluginId: string, config: PluginConfig): PluginConfigMap {
  const current = readPluginConfigs();
  const next: PluginConfigMap = {
    ...current,
    [pluginId]: {
      ...current[pluginId],
      ...config,
    },
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(PLUGIN_CONFIG_STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}
