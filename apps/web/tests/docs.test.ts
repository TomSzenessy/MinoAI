import { describe, expect, it } from "bun:test";
import { readdirSync } from "node:fs";
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
  it("indexes only docstart markdown pages", () => {
    const pages = getAllDocPages();

    const workspaceRoot = resolve(process.cwd(), "../..");
    const docstartCount = countMarkdownFiles(join(workspaceRoot, "docstart"));

    expect(pages.length).toBe(docstartCount);
    expect(pages.every((page) => !page.relativePath.startsWith("docs/"))).toBe(true);
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
