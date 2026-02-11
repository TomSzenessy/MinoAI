import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export type DocSource = "blueprint" | "docstart";

export interface DocPageMeta {
  source: DocSource;
  slug: string[];
  title: string;
  absolutePath: string;
  relativePath: string;
}

function findWorkspaceRoot(start = process.cwd()): string {
  let current = resolve(start);

  while (true) {
    const hasWorkspaceMarker = existsSync(join(current, "pnpm-workspace.yaml"));
    const hasDocsDirs =
      existsSync(join(current, "docs")) &&
      existsSync(join(current, "docstart"));

    if (hasWorkspaceMarker || hasDocsDirs) {
      return current;
    }

    const parent = resolve(current, "..");
    if (parent === current) {
      return start;
    }

    current = parent;
  }
}

function sourceDirectory(source: DocSource): string {
  const root = findWorkspaceRoot();
  return source === "blueprint" ? join(root, "docs") : join(root, "docstart");
}

function fileToSlug(relativePath: string): string[] {
  const noExt = relativePath.replace(/\.md$/i, "");
  const segments = noExt.split(/[\\/]/).filter(Boolean);

  if (segments.length === 0) {
    return ["index"];
  }

  const last = segments[segments.length - 1];
  if (last && last.toLowerCase() === "readme") {
    segments[segments.length - 1] = "index";
  }

  return segments.map((segment) => segment.toLowerCase());
}

function titleFromMarkdown(content: string, fallback: string): string {
  const firstHeading = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));

  if (firstHeading) {
    return firstHeading.replace(/^#\s+/, "").trim();
  }

  return fallback;
}

function walkMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const absolute = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(absolute));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(absolute);
    }
  }

  return files;
}

export function getAllDocPages(): DocPageMeta[] {
  const sources: DocSource[] = ["blueprint", "docstart"];
  const pages: DocPageMeta[] = [];

  for (const source of sources) {
    const root = sourceDirectory(source);

    for (const file of walkMarkdownFiles(root)) {
      const rel = relative(root, file);
      const content = readFileSync(file, "utf-8");
      const slug = fileToSlug(rel);
      const fallbackTitle = rel.replace(/\.md$/i, "");

      pages.push({
        source,
        slug,
        title: titleFromMarkdown(content, fallbackTitle),
        absolutePath: file,
        relativePath: rel,
      });
    }
  }

  return pages.sort((a, b) => {
    if (a.source !== b.source) {
      return a.source.localeCompare(b.source);
    }

    return a.relativePath.localeCompare(b.relativePath);
  });
}

export function getDocPage(source: DocSource, slug: string[]): (DocPageMeta & { content: string }) | null {
  const allPages = getAllDocPages();
  const joined = slug.join("/").toLowerCase();

  const found = allPages.find(
    (page) => page.source === source && page.slug.join("/").toLowerCase() === joined,
  );

  if (!found) {
    return null;
  }

  return {
    ...found,
    content: readFileSync(found.absolutePath, "utf-8"),
  };
}

export function toDocHref(page: DocPageMeta): string {
  return `/docs/${page.source}/${page.slug.join("/")}`;
}
