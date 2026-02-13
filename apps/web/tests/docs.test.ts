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
    const docFile = join(tempRoot, "docs-site", "guides", "intro.md");

    try {
      mkdirSync(nestedCwd, { recursive: true });
      mkdirSync(join(tempRoot, "docs-site", "guides"), { recursive: true });
      writeFileSync(
        docFile,
        "---\ntitle: Intro Guide\n---\n\n# Intro\n\nWelcome.",
      );

      process.chdir(nestedCwd);

      const pages = getAllDocPages();
      const intro = pages.find((page) => page.slug.join("/") === "guides/intro");

      expect(intro).toBeDefined();
      expect(intro?.title).toBe("Intro Guide");
      expect(intro?.relativePath).toBe("guides/intro.md");
    } finally {
      process.chdir(originalCwd);
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("indexes only docs-site markdown pages", () => {
    const pages = getAllDocPages();

    const workspaceRoot = resolve(process.cwd(), "../..");
    const docsCount = countMarkdownFiles(join(workspaceRoot, "docs-site"));

    expect(pages.length).toBe(docsCount);
    expect(pages.every((page) => !page.relativePath.startsWith("../"))).toBe(true);
  });

  it("strips frontmatter from rendered page content", () => {
    const page = getDocPage(["introduction"]);
    expect(page).not.toBeNull();

    if (!page) {
      return;
    }

    expect(toDocHref(page)).toBe("/docs/introduction");
    expect(page.content.includes("---\ntitle:")).toBe(false);
    expect(page.content.length).toBeGreaterThan(0);
  });
});
