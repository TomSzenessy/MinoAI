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

function hasDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

function findWorkspaceRoot(start = process.cwd()): string {
  let current = resolve(start);

  while (true) {
    if (hasDirectory(join(current, "docs-site"))) {
      return current;
    }

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
  return join(findWorkspaceRoot(), "docs-site");
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

function stripQuotes(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseFrontmatter(content: string): { attributes: Record<string, string>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { attributes: {}, body: content };
  }

  const raw = match[1] ?? "";
  const attributes: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const kv = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (!kv) {
      continue;
    }

    const key = (kv[1] ?? "").trim().toLowerCase();
    const value = stripQuotes((kv[2] ?? "").trim());
    if (key) {
      attributes[key] = value;
    }
  }

  return {
    attributes,
    body: content.slice(match[0].length),
  };
}

function titleFromMarkdown(content: string, fallback: string, frontmatterTitle?: string): string {
  if (frontmatterTitle && frontmatterTitle.trim()) {
    return frontmatterTitle.trim();
  }

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
      const parsed = parseFrontmatter(content);
      const fallbackTitle = rel.replace(/\.md$/i, "");

      return {
        slug: fileToSlug(rel),
        title: titleFromMarkdown(parsed.body, fallbackTitle, parsed.attributes.title),
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
    content: parseFrontmatter(readFileSync(found.absolutePath, "utf-8")).body,
  };
}

export function toDocHref(page: DocPageMeta): string {
  return `/docs/${page.slug.join("/")}`;
}
