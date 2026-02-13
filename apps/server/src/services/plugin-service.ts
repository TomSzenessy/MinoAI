import { existsSync, rmSync } from "node:fs";
import {
  buildPluginRuntimeRegistry,
  createInstalledManifest,
  discoverBundledPluginCatalog,
  ensurePluginsDir,
  loadInstalledPlugins,
  resolvePluginInstallDir,
  writeInstalledManifest,
} from "../plugins/registry";
import type {
  InstalledPluginManifest,
  PluginCatalogManifest,
  PluginRuntimeRegistry,
} from "../plugins/types";

export interface PluginManifest extends InstalledPluginManifest {}

export interface PluginCatalogItem {
  id: string;
  name: string;
  version: string;
  description: string;
  source: "builtin";
  defaultEnabled: boolean;
  channels?: string[];
  configSchema?: Record<string, unknown>;
}

export interface ResolvedPluginCatalogItem extends PluginCatalogItem {
  installed: boolean;
  enabled: boolean;
}

function toCatalogItem(entry: PluginCatalogManifest): PluginCatalogItem {
  return {
    id: entry.id,
    name: entry.name,
    version: entry.version,
    description: entry.description,
    source: entry.source,
    defaultEnabled: entry.defaultEnabled,
    channels: entry.channels,
    configSchema: entry.configSchema,
  };
}

export class PluginService {
  private readonly dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    ensurePluginsDir(dataDir);
  }

  async listPlugins(): Promise<PluginManifest[]> {
    return loadInstalledPlugins(this.dataDir);
  }

  async runtimeRegistry(): Promise<PluginRuntimeRegistry> {
    return buildPluginRuntimeRegistry(this.dataDir);
  }

  async togglePlugin(id: string, enabled: boolean): Promise<PluginManifest | null> {
    const plugins = await this.listPlugins();
    const manifest = plugins.find((plugin) => plugin.id === id);
    if (!manifest) {
      return null;
    }

    const next: PluginManifest = {
      ...manifest,
      enabled,
      updatedAt: new Date().toISOString(),
    };
    writeInstalledManifest(this.dataDir, id, next);
    return next;
  }

  async listCatalog(): Promise<ResolvedPluginCatalogItem[]> {
    const catalog = discoverBundledPluginCatalog().map(toCatalogItem);
    const installed = await this.listPlugins();
    const installedMap = new Map(installed.map((plugin) => [plugin.id, plugin]));

    return catalog.map((entry) => {
      const manifest = installedMap.get(entry.id);
      return {
        ...entry,
        installed: Boolean(manifest),
        enabled: manifest?.enabled ?? false,
      };
    });
  }

  async installPlugin(id: string): Promise<PluginManifest | null> {
    const catalogItem = discoverBundledPluginCatalog().find((entry) => entry.id === id);
    if (!catalogItem) {
      return null;
    }

    const existing = (await this.listPlugins()).find((entry) => entry.id === id);
    const manifest = createInstalledManifest(catalogItem, existing);
    writeInstalledManifest(this.dataDir, id, manifest);
    return manifest;
  }

  async uninstallPlugin(id: string): Promise<boolean> {
    const pluginDir = resolvePluginInstallDir(this.dataDir, id);
    if (!existsSync(pluginDir)) {
      return false;
    }

    rmSync(pluginDir, { recursive: true, force: true });
    return true;
  }

  async updatePluginConfig(
    id: string,
    config: Record<string, unknown>,
  ): Promise<PluginManifest | null> {
    const manifest = (await this.listPlugins()).find((plugin) => plugin.id === id);
    if (!manifest) {
      return null;
    }

    const next: PluginManifest = {
      ...manifest,
      config: {
        ...(manifest.config ?? {}),
        ...config,
      },
      updatedAt: new Date().toISOString(),
    };

    writeInstalledManifest(this.dataDir, id, next);
    return next;
  }
}
