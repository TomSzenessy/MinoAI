import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export interface DocPageMeta {
  slug: string[];
  title: string;
  absolutePath: string;
  relativePath: string;
}

let cachedSignature: string | null = null;
let cachedPages: DocPageMeta[] | null = null;

function findWorkspaceRoot(start = process.cwd()): string {
  let current = resolve(start);

  while (true) {
    if (existsSync(join(current, "pnpm-workspace.yaml"))) {
      return current;
    }

    const parent = resolve(current, "..");
    if (parent === current) {
      return start;
    }

    current = parent;
  }
}

function sourceDirectory(): string {
  return join(findWorkspaceRoot(), "docstart");
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

function docsSignature(files: string[]): string {
  return files
    .map((file) => {
      const stat = statSync(file);
      return `${file}:${stat.mtimeMs}`;
    })
    .join("|");
}

function computePages(files: string[], root: string): DocPageMeta[] {
  return files
    .map((file): DocPageMeta => {
      const rel = relative(root, file);
      const content = readFileSync(file, "utf-8");
      const fallbackTitle = rel.replace(/\.md$/i, "");

      return {
        slug: fileToSlug(rel),
        title: titleFromMarkdown(content, fallbackTitle),
        absolutePath: file,
        relativePath: rel,
      };
    })
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function getAllDocPages(): DocPageMeta[] {
  const root = sourceDirectory();
  const files = walkMarkdownFiles(root);
  const signature = docsSignature(files);

  if (cachedPages && cachedSignature === signature) {
    return cachedPages;
  }

  const pages = computePages(files, root);
  cachedPages = pages;
  cachedSignature = signature;

  return pages;
}

export function getDocPage(slug: string[]): (DocPageMeta & { content: string }) | null {
  const allPages = getAllDocPages();
  const joined = slug.join("/").toLowerCase();

  const found = allPages.find((page) => page.slug.join("/").toLowerCase() === joined);

  if (!found) {
    return null;
  }

  return {
    ...found,
    content: readFileSync(found.absolutePath, "utf-8"),
  };
}

export function toDocHref(page: DocPageMeta): string {
  return `/docs/${page.slug.join("/")}`;
}
