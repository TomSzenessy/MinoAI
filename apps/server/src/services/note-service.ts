/**
 * NoteService — Business logic for note operations.
 *
 * Orchestrates between the FileManager (disk I/O) and the
 * markdown parser. In Phase 2, this will also synchronize
 * with the SQLite index (IndexDB).
 */

import type { Note, NoteMetadata, SearchResult } from "@mino-ink/shared";
import { FileManager } from "./file-manager";
import { parseMarkdown } from "../utils/markdown";

export class NoteService {
  private readonly fm: FileManager;
  private readonly dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.fm = new FileManager(dataDir);
  }

  /** Lists all notes (metadata only, no content). */
  async listNotes(): Promise<NoteMetadata[]> {
    const files = await this.fm.listAllFiles();
    const notes: NoteMetadata[] = [];

    for (const filePath of files) {
      const content = await this.fm.readFile(filePath);
      if (content === null) continue;

      const parsed = parseMarkdown(content);
      notes.push(this.toMetadata(filePath, parsed, content));
    }

    return notes;
  }

  /** Gets a single note with full content. */
  async getNote(path: string): Promise<Note | null> {
    const content = await this.fm.readFile(path);
    if (content === null) return null;

    const parsed = parseMarkdown(content);
    return {
      ...this.toMetadata(path, parsed, content),
      content: parsed.content,
      frontmatter: parsed.frontmatter,
    };
  }

  /** Creates a new note at the given path. */
  async createNote(path: string, content: string): Promise<Note> {
    await this.fm.writeFile(path, content);

    const parsed = parseMarkdown(content);
    return {
      ...this.toMetadata(path, parsed, content),
      content: parsed.content,
      frontmatter: parsed.frontmatter,
    };
  }

  /** Replaces the content of an existing note. */
  async updateNote(path: string, content: string): Promise<Note> {
    await this.fm.writeFile(path, content);

    const parsed = parseMarkdown(content);
    return {
      ...this.toMetadata(path, parsed, content),
      content: parsed.content,
      frontmatter: parsed.frontmatter,
    };
  }

  /** Checks if a note exists at the given path. */
  async noteExists(path: string): Promise<boolean> {
    return this.fm.fileExists(path);
  }

  /** Deletes a note at the given path. */
  async deleteNote(path: string): Promise<void> {
    await this.fm.deleteFile(path);
  }

  /** Moves a note to a new path and returns updated metadata. */
  async moveNote(fromPath: string, toPath: string): Promise<Note | null> {
    await this.fm.moveFile(fromPath, toPath);
    return this.getNote(toPath);
  }

  /**
   * Searches notes by content (simple substring match for now).
   * Phase 2 will replace this with SQLite FTS5 full-text search.
   */
  async searchNotes(
    query: string,
    options: { limit?: number; folder?: string } = {},
  ): Promise<SearchResult[]> {
    const { limit = 20, folder } = options;
    const files = await this.fm.listAllFiles(folder);
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const filePath of files) {
      if (results.length >= limit) break;

      const content = await this.fm.readFile(filePath);
      if (content === null) continue;

      const contentLower = content.toLowerCase();
      const matchIndex = contentLower.indexOf(queryLower);

      if (matchIndex !== -1) {
        const parsed = parseMarkdown(content);
        const snippetStart = Math.max(0, matchIndex - 80);
        const snippetEnd = Math.min(content.length, matchIndex + query.length + 120);
        const snippet = content.slice(snippetStart, snippetEnd).trim();

        results.push({
          path: filePath,
          title: parsed.title,
          snippet: (snippetStart > 0 ? "..." : "") + snippet + (snippetEnd < content.length ? "..." : ""),
          score: 1.0, // Phase 2: FTS5 rank score
          tags: parsed.tags,
        });
      }
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /** Converts parsed markdown + file path into NoteMetadata. */
  private toMetadata(
    path: string,
    parsed: ReturnType<typeof parseMarkdown>,
    rawContent: string,
  ): NoteMetadata {
    // Use file stats for timestamps (best effort)
    const now = new Date().toISOString();
    return {
      path,
      title: parsed.title,
      tags: parsed.tags,
      links: parsed.links,
      backlinks: [], // Phase 2: computed from index
      wordCount: parsed.wordCount,
      createdAt: (parsed.frontmatter.created as string) ?? now,
      updatedAt: now,
      checksum: parsed.checksum,
    };
  }
}
