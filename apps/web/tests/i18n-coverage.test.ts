import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import de from "../messages/de.json";
import en from "../messages/en.json";
import es from "../messages/es.json";

type Messages = Record<string, unknown>;

function flattenKeys(messages: Messages, prefix = "", keys: string[] = []): string[] {
  for (const [key, value] of Object.entries(messages)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      keys.push(next);
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenKeys(value as Messages, next, keys);
    }
  }

  return keys;
}

function walkTsxFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTsxFiles(absolute, files);
      continue;
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

function resolveWebRoot(): string {
  const cwd = process.cwd();
  if (existsSync(join(cwd, "app")) && existsSync(join(cwd, "components"))) {
    return cwd;
  }
  return resolve(cwd, "apps/web");
}

function collectStaticTranslationKeys(webRoot: string): Set<string> {
  const sourceFiles = [
    ...walkTsxFiles(join(webRoot, "app")),
    ...walkTsxFiles(join(webRoot, "components")),
  ];

  const keys = new Set<string>();
  const regex = /\bt\(\s*["']([A-Za-z0-9_.-]+)["']\s*[,)]/g;

  for (const file of sourceFiles) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(regex)) {
      const key = match[1];
      if (key) {
        keys.add(key);
      }
    }
  }

  return keys;
}

function collectDynamicTranslationKeys(): Set<string> {
  const keys = new Set<string>();

  for (const feature of [
    "features.smartImport",
    "features.aiOrganization",
    "features.intelligentRetrieval",
    "features.selfHosted",
    "features.agentNative",
    "features.everywhere",
  ]) {
    keys.add(`${feature}.title`);
    keys.add(`${feature}.description`);
  }

  for (const step of [1, 2, 3]) {
    keys.add(`howItWorks.step${step}.title`);
    keys.add(`howItWorks.step${step}.description`);
  }

  for (const capability of [1, 2, 3, 4]) {
    keys.add(`agent.capability${capability}Title`);
    keys.add(`agent.capability${capability}Desc`);
  }

  for (const techItem of ["bun", "hono", "nextjs", "expo", "sqlite", "yjs", "mcp", "md"]) {
    keys.add(`tech.items.${techItem}`);
  }

  return keys;
}

describe("i18n coverage", () => {
  it("keeps locale key sets aligned", () => {
    const enKeys = new Set(flattenKeys(en as Messages));
    const locales = {
      de: new Set(flattenKeys(de as Messages)),
      es: new Set(flattenKeys(es as Messages)),
    };

    for (const [locale, keys] of Object.entries(locales)) {
      const missing = [...enKeys].filter((key) => !keys.has(key));
      const extra = [...keys].filter((key) => !enKeys.has(key));
      expect(missing, `${locale} missing keys`).toEqual([]);
      expect(extra, `${locale} extra keys`).toEqual([]);
    }
  });

  it("ensures statically referenced translation keys exist", () => {
    const webRoot = resolveWebRoot();
    const enKeys = new Set(flattenKeys(en as Messages));
    const usedKeys = collectStaticTranslationKeys(webRoot);
    const dynamicKeys = collectDynamicTranslationKeys();
    for (const key of dynamicKeys) {
      usedKeys.add(key);
    }
    const missing = [...usedKeys].filter((key) => !enKeys.has(key)).sort();

    expect(missing).toEqual([]);
  });
});
