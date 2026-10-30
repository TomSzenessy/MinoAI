/**
 * Obsidian vault inspection — fixture vault, no plugin execution.
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectObsidianVault, findObsidianRoot } from "../src/services/obsidian-vault";

let root: string;

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2), "utf-8");
}

async function writeText(path: string, value: string): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, value, "utf-8");
}

async function createVault(): Promise<string> {
  const dataDir = await mkdtemp(join(tmpdir(), "mino-obsidian-"));
  const vault = join(dataDir, "notes");
  const obsidian = join(vault, ".obsidian");

  await writeJson(join(obsidian, "app.json"), {
    newLinkFormat: "relative",
    alwaysUpdateLinks: true,
    useMarkdownLinks: true,
    attachmentFolderPath: "assets",
    newFileLocation: "folder",
  });
  await writeJson(join(obsidian, "appearance.json"), {
    theme: "obsidian",
    cssTheme: "Minimal",
    baseFontSize: 17,
  });
  await writeJson(join(obsidian, "community-plugins.json"), [
    "dataview",
    "templater-obsidian",
    "ghost-plugin",
  ]);
  await writeJson(join(obsidian, "core-plugins.json"), {
    "file-explorer": true,
    graph: true,
    "page-preview": false,
  });

  await writeJson(join(obsidian, "plugins", "dataview", "manifest.json"), {
    id: "dataview",
    name: "Dataview",
    version: "0.5.67",
    author: "Michael Brenan",
    description: "Complex data views over your vault.",
    minAppVersion: "0.13.11",
  });
  await writeText(join(obsidian, "plugins", "dataview", "main.js"), "module.exports = {};");

  await writeJson(join(obsidian, "plugins", "templater-obsidian", "manifest.json"), {
    id: "templater-obsidian",
    name: "Templater",
    version: "2.4.1",
    author: "SilentVoid",
    description: "Templates with variables and functions.",
    minAppVersion: "1.1.0",
  });
  await writeText(join(obsidian, "plugins", "templater-obsidian", "main.js"), "module.exports = {};");

  await writeJson(join(obsidian, "plugins", "smart-connections", "manifest.json"), {
    id: "smart-connections",
    name: "Smart Connections",
    version: "2.2.0",
    description: "Needs Electron APIs.",
    isDesktopOnly: true,
  });

  await writeText(join(obsidian, "themes", "Minimal", "theme.css"), "body {}");
  await writeText(join(obsidian, "snippets", "tables.css"), ".table {}");

  return dataDir;
}

beforeEach(async () => {
  root = await createVault();
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("findObsidianRoot", () => {
  it("finds .obsidian under the notes directory", () => {
    const found = findObsidianRoot(root);
    expect(found).not.toBeNull();
    expect(found?.root).toBe("notes");
  });

  it("returns null for a plain notes directory", async () => {
    const plain = await mkdtemp(join(tmpdir(), "mino-plain-"));
    await mkdir(join(plain, "notes"), { recursive: true });
    expect(findObsidianRoot(plain)).toBeNull();
    await rm(plain, { recursive: true, force: true });
  });

  it("honours an explicit root override", () => {
    const found = findObsidianRoot(root, join(root, "notes"));
    expect(found?.root).toBe("notes");
  });
});

describe("inspectObsidianVault", () => {
  it("reports config, plugins, themes and snippets", () => {
    const summary = inspectObsidianVault(root);

    expect(summary.detected).toBe(true);
    expect(summary.root).toBe("notes");

    expect(summary.config).toEqual({
      linkFormat: "relative",
      newFileLocation: "folder",
      attachmentFolder: "assets",
      useMarkdownLinks: true,
      alwaysUpdateLinks: true,
      showUnsupportedFiles: false,
      theme: "obsidian",
      cssTheme: "Minimal",
      baseFontSize: 17,
    });

    expect(summary.plugins.map((plugin) => plugin.id).sort()).toEqual([
      "dataview",
      "smart-connections",
      "templater-obsidian",
    ]);

    const dataview = summary.plugins.find((plugin) => plugin.id === "dataview");
    expect(dataview).toMatchObject({
      name: "Dataview",
      version: "0.5.67",
      enabled: true,
      desktopOnly: false,
      hasMain: true,
    });

    const smart = summary.plugins.find((plugin) => plugin.id === "smart-connections");
    expect(smart?.desktopOnly).toBe(true);
    expect(smart?.enabled).toBe(false);
    expect(smart?.hasMain).toBe(false);

    expect(summary.themes).toEqual(["Minimal"]);
    expect(summary.snippets).toEqual(["tables.css"]);
    expect(summary.counts).toEqual({
      plugins: 3,
      enabledPlugins: 2,
      desktopOnlyPlugins: 1,
      themes: 1,
      snippets: 1,
    });
  });

  it("warns about enabled-but-missing and bundle-less plugins", () => {
    const summary = inspectObsidianVault(root);

    expect(summary.warnings.some((line) => line.includes("ghost-plugin"))).toBe(true);
    expect(summary.warnings.some((line) => line.includes("smart-connections"))).toBe(true);
  });

  it("degrades to not-detected instead of throwing on a broken vault", async () => {
    await writeText(join(root, "notes", ".obsidian", "community-plugins.json"), "{not json");
    const summary = inspectObsidianVault(root);
    expect(summary.detected).toBe(true);
    expect(summary.counts.enabledPlugins).toBe(0);
  });

  it("reports not detected for a data dir without a vault", async () => {
    const plain = await mkdtemp(join(tmpdir(), "mino-plain-"));
    const summary = inspectObsidianVault(plain);
    expect(summary.detected).toBe(false);
    expect(summary.plugins).toEqual([]);
    await rm(plain, { recursive: true, force: true });
  });
});
