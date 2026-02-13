import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type {
  InstalledPluginManifest,
  PluginCatalogManifest,
  PluginRuntimeRegistry,
} from "./types";

const BUNDLED_PLUGIN_DIR = join(import.meta.dir, "builtin");

function readJsonFileSafe(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function normalizeCatalogManifest(value: unknown): PluginCatalogManifest | null {
  const raw = asRecord(value);
  if (!raw) {
    return null;
  }

  const id = asString(raw.id);
  const name = asString(raw.name);
  const version = asString(raw.version);
  const description = asString(raw.description);

  if (!id || !name || !version || !description) {
    return null;
  }

  return {
    id,
    name,
    version,
    description,
    source: "builtin",
    defaultEnabled: asBoolean(raw.defaultEnabled),
    channels: asStringArray(raw.channels),
    configSchema: asRecord(raw.configSchema),
  };
}

function normalizeInstalledManifest(
  value: unknown,
  fallbackId: string,
): InstalledPluginManifest | null {
  const raw = asRecord(value);
  if (!raw) {
    return null;
  }

  const id = asString(raw.id) ?? fallbackId;
  const name = asString(raw.name) ?? fallbackId;
  const version = asString(raw.version) ?? "0.0.0";
  const description = asString(raw.description) ?? undefined;
  const source = (asString(raw.source) as InstalledPluginManifest["source"]) ?? "installed";
  const installedAt = asString(raw.installedAt) ?? new Date().toISOString();
  const updatedAt = asString(raw.updatedAt) ?? installedAt;

  return {
    id,
    name,
    version,
    description,
    enabled: asBoolean(raw.enabled, true),
    source: source === "builtin" || source === "installed" ? source : "installed",
    config: asRecord(raw.config) as Record<string, unknown> | undefined,
    channels: asStringArray(raw.channels),
    configSchema: asRecord(raw.configSchema),
    installedAt,
    updatedAt,
  };
}

export function discoverBundledPluginCatalog(): PluginCatalogManifest[] {
  if (!existsSync(BUNDLED_PLUGIN_DIR)) {
    return [];
  }

  const entries = readdirSync(BUNDLED_PLUGIN_DIR, { withFileTypes: true });
  const discovered: PluginCatalogManifest[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifestPath = join(BUNDLED_PLUGIN_DIR, entry.name, "plugin.json");
    if (!existsSync(manifestPath)) {
      continue;
    }

    const manifest = normalizeCatalogManifest(readJsonFileSafe(manifestPath));
    if (!manifest) {
      continue;
    }

    discovered.push(manifest);
  }

  return discovered.sort((a, b) => a.id.localeCompare(b.id));
}

export function resolvePluginsDir(dataDir: string): string {
  return join(dataDir, "plugins");
}

export function ensurePluginsDir(dataDir: string): string {
  const dir = resolvePluginsDir(dataDir);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function resolvePluginInstallDir(dataDir: string, pluginId: string): string {
  return join(ensurePluginsDir(dataDir), pluginId);
}

export function loadInstalledPlugins(dataDir: string): InstalledPluginManifest[] {
  const pluginsDir = ensurePluginsDir(dataDir);
  const entries = readdirSync(pluginsDir, { withFileTypes: true });
  const installed: InstalledPluginManifest[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifestPath = join(pluginsDir, entry.name, "manifest.json");
    if (!existsSync(manifestPath) || !statSync(manifestPath).isFile()) {
      continue;
    }

    const parsed = normalizeInstalledManifest(readJsonFileSafe(manifestPath), entry.name);
    if (!parsed) {
      continue;
    }

    installed.push(parsed);
  }

  return installed.sort((a, b) => a.id.localeCompare(b.id));
}

export function writeInstalledManifest(
  dataDir: string,
  pluginId: string,
  manifest: InstalledPluginManifest,
): void {
  const pluginDir = resolvePluginInstallDir(dataDir, pluginId);
  if (!existsSync(pluginDir)) {
    mkdirSync(pluginDir, { recursive: true });
  }

  const manifestPath = join(pluginDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

export function createInstalledManifest(
  catalog: PluginCatalogManifest,
  existing?: InstalledPluginManifest,
): InstalledPluginManifest {
  const now = new Date().toISOString();
  return {
    id: catalog.id,
    name: catalog.name,
    version: catalog.version,
    description: catalog.description,
    enabled: existing?.enabled ?? catalog.defaultEnabled,
    source: existing?.source ?? "builtin",
    config: existing?.config ?? {},
    channels: catalog.channels,
    configSchema: catalog.configSchema,
    installedAt: existing?.installedAt ?? now,
    updatedAt: now,
  };
}

export function buildPluginRuntimeRegistry(dataDir: string): PluginRuntimeRegistry {
  const plugins = loadInstalledPlugins(dataDir);
  const enabledPluginIds = plugins.filter((plugin) => plugin.enabled).map((plugin) => plugin.id);
  const diagnostics = plugins
    .filter((plugin) => !plugin.id || !plugin.name)
    .map((plugin) => `invalid plugin metadata: ${plugin.id || "unknown"}`);

  return {
    plugins,
    enabledPluginIds,
    diagnostics,
  };
}
