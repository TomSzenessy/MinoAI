/**
 * Markdown — Frontmatter parsing and content utilities.
 *
 * Uses gray-matter for frontmatter extraction and provides
 * helpers for title extraction, word counts, and link parsing.
 */

import matter from "gray-matter";
import type { NoteFrontmatter } from "@mino-ink/shared";
import { sha256 } from "./crypto";

export interface ParsedNote {
  /** Parsed YAML frontmatter. */
  frontmatter: NoteFrontmatter;
  /** Markdown content (without frontmatter). */
  content: string;
  /** Title extracted from first # heading or frontmatter. */
  title: string;
  /** Tags from frontmatter. */
  tags: string[];
  /** Internal links found in the content. */
  links: string[];
  /** Word count (body only, excluding frontmatter). */
  wordCount: number;
  /** SHA-256 hash of the raw file content. */
  checksum: string;
}

/**
 * Parses a raw markdown file into structured data.
 * Extracts frontmatter, title, tags, links, word count, and checksum.
 */
export function parseMarkdown(rawContent: string): ParsedNote {
  const { data, content } = matter(rawContent);
  const frontmatter = data as NoteFrontmatter;

  return {
    frontmatter,
    content,
    title: extractTitle(content, frontmatter),
    tags: extractTags(frontmatter),
    links: extractLinks(content),
    wordCount: countWords(content),
    checksum: sha256(rawContent),
  };
}

/** Extracts the title from the first `# heading` or frontmatter `title` field. */
function extractTitle(content: string, frontmatter: NoteFrontmatter): string {
  // Prefer frontmatter title
  if (typeof frontmatter.title === "string" && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }

  // Fall back to first H1 heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }

  return "Untitled";
}

/** Extracts tags from frontmatter (supports string[] or comma-separated string). */
function extractTags(frontmatter: NoteFrontmatter): string[] {
  if (!frontmatter.tags) return [];

  if (Array.isArray(frontmatter.tags)) {
    return frontmatter.tags.filter((t): t is string => typeof t === "string");
  }

  if (typeof frontmatter.tags === "string") {
    return frontmatter.tags.split(",").map((t) => t.trim()).filter(Boolean);
  }

  return [];
}

/**
 * Extracts internal links from markdown content.
 * Supports both [[wiki-links]] and [text](path.md) formats.
 */
function extractLinks(content: string): string[] {
  const links: string[] = [];

  // Wiki-style links: [[note-name]] or [[path/to/note]]
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    if (match[1]) links.push(match[1]);
  }

  // Markdown links to local .md files: [text](path.md) — skip URLs
  const mdLinkRegex = /\[([^\]]*)\]\(([^)]+\.md)\)/g;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const href = match[2];
    if (href && !href.startsWith("http://") && !href.startsWith("https://")) {
      links.push(href);
    }
  }

  return [...new Set(links)]; // deduplicate
}

/** Counts words in markdown content (excludes code blocks and HTML). */
function countWords(content: string): number {
  // Remove code blocks
  const withoutCode = content.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "");
  // Remove HTML tags
  const withoutHtml = withoutCode.replace(/<[^>]+>/g, "");
  // Split on whitespace and count non-empty tokens
  return withoutHtml.split(/\s+/).filter((word) => word.length > 0).length;
}
