import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { getAllDocPages, getDocPage, toDocHref } from "../lib/docs";

function countMarkdownFiles(dir: string): number {
  const entries = readdirSync(dir, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    const absolute = join(dir, entry.name);

    if (entry.isDirectory()) {
      count += countMarkdownFiles(absolute);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      count += 1;
    }
  }

  return count;
}

describe("docs", () => {
  it("finds docs when workspace marker file is absent", () => {
    const originalCwd = process.cwd();
    const tempRoot = mkdtempSync(join(tmpdir(), "mino-docs-"));
    const nestedCwd = join(tempRoot, "apps", "web");
    const docFile = join(tempRoot, "docs", "getting-started", "intro.md");

    try {
      mkdirSync(nestedCwd, { recursive: true });
      mkdirSync(join(tempRoot, "docs", "getting-started"), { recursive: true });
      writeFileSync(docFile, "# Intro\n\nWelcome.");

      process.chdir(nestedCwd);

      const pages = getAllDocPages();
      const intro = pages.find((page) => page.slug.join("/") === "getting-started/intro");

      expect(intro).toBeDefined();
      expect(intro?.relativePath).toBe("getting-started/intro.md");
    } finally {
      process.chdir(originalCwd);
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("indexes only docs markdown pages", () => {
    const pages = getAllDocPages();

    const workspaceRoot = resolve(process.cwd(), "../..");
    const docsCount = countMarkdownFiles(join(workspaceRoot, "docs"));

    expect(pages.length).toBe(docsCount);
    expect(pages.every((page) => !page.relativePath.startsWith("docstart/"))).toBe(true);
  });

  it("resolves index page and href", () => {
    const page = getDocPage(["index"]);
    expect(page).not.toBeNull();

    if (!page) {
      return;
    }

    expect(toDocHref(page)).toBe("/docs/index");
    expect(page.content.length).toBeGreaterThan(0);
  });
});
