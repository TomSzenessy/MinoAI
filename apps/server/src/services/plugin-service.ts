import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  enabled: boolean;
}

export class PluginService {
  private readonly pluginsDir: string;

  constructor(dataDir: string) {
    this.pluginsDir = join(dataDir, "plugins");
    if (!existsSync(this.pluginsDir)) {
      mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  async listPlugins(): Promise<PluginManifest[]> {
    if (!existsSync(this.pluginsDir)) return [];

    const entries = readdirSync(this.pluginsDir, { withFileTypes: true });
    const plugins: PluginManifest[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const manifestPath = join(this.pluginsDir, entry.name, "manifest.json");
        if (existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
            plugins.push({
              ...manifest,
              id: entry.name,
              enabled: manifest.enabled ?? true,
            });
          } catch (err) {
            console.error(`Failed to read manifest for plugin ${entry.name}:`, err);
          }
        }
      }
    }

    return plugins;
  }

  async togglePlugin(id: string, enabled: boolean): Promise<PluginManifest | null> {
    const manifestPath = join(this.pluginsDir, id, "manifest.json");
    if (!existsSync(manifestPath)) return null;

    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      manifest.enabled = enabled;
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      return { ...manifest, id, enabled };
    } catch (err) {
      console.error(`Failed to toggle plugin ${id}:`, err);
      return null;
    }
  }
}
