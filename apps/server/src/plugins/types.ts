export type PluginSource = "builtin" | "installed";

export interface PluginCatalogManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  source: "builtin";
  defaultEnabled: boolean;
  channels?: string[];
  configSchema?: Record<string, unknown>;
}

export interface InstalledPluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  enabled: boolean;
  source: PluginSource;
  config?: Record<string, unknown>;
  channels?: string[];
  configSchema?: Record<string, unknown>;
  installedAt: string;
  updatedAt: string;
}

export interface PluginRuntimeRegistry {
  plugins: InstalledPluginManifest[];
  enabledPluginIds: string[];
  diagnostics: string[];
}
