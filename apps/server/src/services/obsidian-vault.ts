/**
 * Obsidian vault inspection.
 *
 * Reads the parts of an existing Obsidian vault that Mino can honour without
 * running Obsidian: `.obsidian/` configuration, the installed community plugin
 * manifests, themes and CSS snippets.
 *
 * This module only *reads* files and never executes plugin code. Everything is
 * parsed defensively: a malformed config file degrades to "not detected" or an
 * empty list rather than crashing the server.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface ObsidianPluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  minAppVersion: string;
  /** True when the plugin requires Electron/Node APIs Mino cannot provide. */
  desktopOnly: boolean;
  /** A plugin without main.js cannot be loaded at all. */
  hasMain: boolean;
  /** Whether the vault's community-plugins.json lists it as enabled. */
  enabled: boolean;
}

export interface ObsidianVaultConfig {
  linkFormat: string;
  newFileLocation: string;
  attachmentFolder: string;
  useMarkdownLinks: boolean;
  alwaysUpdateLinks: boolean;
  showUnsupportedFiles: boolean;
  theme: string;
  cssTheme: string;
  baseFontSize: number;
}

export interface ObsidianVaultSummary {
  detected: boolean;
  /** Vault root relative to the data dir, e.g. "notes". */
  root: string;
  config: ObsidianVaultConfig | null;
  plugins: ObsidianPluginManifest[];
  themes: string[];
  snippets: string[];
  counts: {
    plugins: number;
    enabledPlugins: number;
    desktopOnlyPlugins: number;
    themes: number;
    snippets: number;
  };
  warnings: string[];
}

const EMPTY_SUMMARY: ObsidianVaultSummary = {
  detected: false,
  root: "",
  config: null,
  plugins: [],
  themes: [],
  snippets: [],
  counts: {
    plugins: 0,
    enabledPlugins: 0,
    desktopOnlyPlugins: 0,
    themes: 0,
    snippets: 0,
  },
  warnings: [],
};

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Locate the vault: an explicit override first, then the notes directory, then
 * the data dir itself. The first candidate containing `.obsidian` wins.
 */
export function findObsidianRoot(
  dataDir: string,
  explicitRoot?: string,
): { root: string; obsidianDir: string } | null {
  const candidates: string[] = [];
  if (explicitRoot) candidates.push(explicitRoot);
  candidates.push(join(dataDir, "notes"), dataDir);

  for (const candidate of candidates) {
    const obsidianDir = join(candidate, ".obsidian");
    if (isDirectory(obsidianDir)) {
      const rel = relative(dataDir, candidate);
      return { root: rel === "" ? "." : rel.split("\\").join("/"), obsidianDir };
    }
  }

  return null;
}

/**
 * `community-plugins.json` is a list of ids; older builds used an object of
 * id → boolean. Both are accepted.
 */
function readEnabledPluginIds(obsidianDir: string): Set<string> {
  const raw = readJson(join(obsidianDir, "community-plugins.json"));
  const ids = new Set<string>();

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (typeof entry === "string") ids.add(entry);
    }
  } else if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(asRecord(raw))) {
      if (value === true) ids.add(key);
    }
  }

  return ids;
}

function readPluginManifests(
  obsidianDir: string,
  enabledIds: Set<string>,
  warnings: string[],
): ObsidianPluginManifest[] {
  const pluginsDir = join(obsidianDir, "plugins");
  if (!isDirectory(pluginsDir)) return [];

  let entries: string[];
  try {
    entries = readdirSync(pluginsDir);
  } catch {
    return [];
  }

  const plugins: ObsidianPluginManifest[] = [];

  for (const entry of entries) {
    const dir = join(pluginsDir, entry);
    if (!isDirectory(dir)) continue;

    const manifestPath = join(dir, "manifest.json");
    if (!existsSync(manifestPath)) continue;

    const manifest = asRecord(readJson(manifestPath));
    const id = asString(manifest.id, entry);
    const name = asString(manifest.name, id);

    if (!id) {
      warnings.push(`Plugin folder "${entry}" has no manifest id.`);
      continue;
    }

    plugins.push({
      id,
      name,
      version: asString(manifest.version, "0.0.0"),
      author: asString(manifest.author),
      description: asString(manifest.description),
      minAppVersion: asString(manifest.minAppVersion),
      desktopOnly: asBoolean(manifest.isDesktopOnly),
      hasMain: existsSync(join(dir, "main.js")),
      enabled: enabledIds.has(id),
    });

    if (!existsSync(join(dir, "main.js"))) {
      warnings.push(`Plugin "${id}" has a manifest but no main.js bundle.`);
    }
  }

  return plugins.sort((a, b) => a.name.localeCompare(b.name));
}

function listDirectories(path: string): string[] {
  if (!isDirectory(path)) return [];
  try {
    return readdirSync(path)
      .filter((entry) => isDirectory(join(path, entry)))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function listCssFiles(path: string): string[] {
  if (!isDirectory(path)) return [];
  try {
    return readdirSync(path)
      .filter((entry) => entry.toLowerCase().endsWith(".css"))
      .filter((entry) => {
        try {
          return statSync(join(path, entry)).isFile();
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function readVaultConfig(obsidianDir: string): ObsidianVaultConfig {
  const app = asRecord(readJson(join(obsidianDir, "app.json")));
  const appearance = asRecord(readJson(join(obsidianDir, "appearance.json")));

  return {
    linkFormat: asString(app.newLinkFormat, "shortest"),
    newFileLocation: asString(app.newFileLocation, "root"),
    attachmentFolder: asString(app.attachmentFolderPath, ""),
    useMarkdownLinks: asBoolean(app.useMarkdownLinks),
    alwaysUpdateLinks: asBoolean(app.alwaysUpdateLinks, true),
    showUnsupportedFiles: asBoolean(app.showUnsupportedFiles),
    theme: asString(appearance.theme, "dark"),
    cssTheme: asString(appearance.cssTheme, ""),
    baseFontSize: asNumber(appearance.baseFontSize, 16),
  };
}

/**
 * Inspect a vault. Returns `detected: false` (not an error) when the data dir
 * simply does not contain an Obsidian vault.
 */
export function inspectObsidianVault(
  dataDir: string,
  explicitRoot?: string,
): ObsidianVaultSummary {
  const found = findObsidianRoot(dataDir, explicitRoot);
  if (!found) {
    return { ...EMPTY_SUMMARY };
  }

  const warnings: string[] = [];
  const enabledIds = readEnabledPluginIds(found.obsidianDir);
  const plugins = readPluginManifests(found.obsidianDir, enabledIds, warnings);
  const themes = listDirectories(join(found.obsidianDir, "themes"));
  const snippets = listCssFiles(join(found.obsidianDir, "snippets"));

  // A plugin listed as enabled but absent from the folder is a broken install.
  const installed = new Set(plugins.map((plugin) => plugin.id));
  for (const id of enabledIds) {
    if (!installed.has(id)) {
      warnings.push(`"${id}" is enabled in community-plugins.json but not installed.`);
    }
  }

  return {
    detected: true,
    root: found.root,
    config: readVaultConfig(found.obsidianDir),
    plugins,
    themes,
    snippets,
    counts: {
      plugins: plugins.length,
      enabledPlugins: plugins.filter((plugin) => plugin.enabled).length,
      desktopOnlyPlugins: plugins.filter((plugin) => plugin.desktopOnly).length,
      themes: themes.length,
      snippets: snippets.length,
    },
    warnings,
  };
}
