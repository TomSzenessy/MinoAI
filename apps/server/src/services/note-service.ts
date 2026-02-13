/**
 * NoteService — Business logic for note operations.
 *
 * Orchestrates between the FileManager (disk I/O), the
 * markdown parser, and the SQLite index (IndexDB).
 *
 * The index is used for:
 * - Fast full-text search (FTS5)
 * - Backlink tracking
 * - Tag queries
 */

import type { Note, NoteMetadata, SearchResult } from '@mino-ink/shared';
import { FileManager } from './file-manager';
import { IndexDB } from './index-db';
import { parseMarkdown } from '../utils/markdown';
import type { SemanticSearchResult } from './semantic-search';

export class NoteService {
	private readonly fm: FileManager;
	private readonly index: IndexDB;
	private readonly dataDir: string;

	constructor(dataDir: string) {
		this.dataDir = dataDir;
		this.fm = new FileManager(dataDir);
		this.index = new IndexDB(dataDir);
		this.index.initialize();
	}

	/** Gets the underlying index for direct access. */
	getIndex(): IndexDB {
		return this.index;
	}

	/** Ensures the index is populated (lazy rebuild on first use). */
	async ensureIndex(): Promise<void> {
		if (this.index.needsRebuild()) {
			await this.index.rebuildIndex(this.dataDir);
		}
	}

	/** Lists all notes (metadata only, no content). */
	async listNotes(): Promise<NoteMetadata[]> {
		await this.ensureIndex();

		const files = await this.fm.listAllFiles();
		const notes: NoteMetadata[] = [];

		for (const filePath of files) {
			// Try to get from index first (faster)
			const indexed = this.index.getNoteMetadata(filePath);
			if (indexed) {
				notes.push(indexed);
				continue;
			}

			// Fall back to file read
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
		const backlinks = this.index.getBacklinks(path);

		return {
			...this.toMetadata(path, parsed, content),
			backlinks,
			content: parsed.content,
			frontmatter: parsed.frontmatter
		};
	}

	/** Creates a new note at the given path. */
	async createNote(path: string, content: string): Promise<Note> {
		await this.fm.writeFile(path, content);

		// Update the index
		this.index.indexNote(path, content);

		const parsed = parseMarkdown(content);
		return {
			...this.toMetadata(path, parsed, content),
			content: parsed.content,
			frontmatter: parsed.frontmatter
		};
	}

	/** Replaces the content of an existing note. */
	async updateNote(path: string, content: string): Promise<Note> {
		await this.fm.writeFile(path, content);

		// Update the index
		this.index.indexNote(path, content);

		const parsed = parseMarkdown(content);
		return {
			...this.toMetadata(path, parsed, content),
			content: parsed.content,
			frontmatter: parsed.frontmatter
		};
	}

	/** Checks if a note exists at the given path. */
	async noteExists(path: string): Promise<boolean> {
		return this.fm.fileExists(path);
	}

	/** Deletes a note at the given path. */
	async deleteNote(path: string): Promise<void> {
		await this.fm.deleteFile(path);

		// Remove from index
		this.index.removeNote(path);
	}

	/** Moves a note to a new path and returns updated metadata. */
	async moveNote(fromPath: string, toPath: string): Promise<Note | null> {
		// Read content before move
		const content = await this.fm.readFile(fromPath);
		if (content === null) return null;

		// Move the file
		await this.fm.moveFile(fromPath, toPath);

		// Update index: remove old, add new
		this.index.removeNote(fromPath);
		this.index.indexNote(toPath, content);

		return this.getNote(toPath);
	}

	/**
	 * Searches notes using SQLite FTS5 full-text search.
	 * Returns ranked results with snippets.
	 */
	async searchNotes(
		query: string,
		options: { limit?: number; folder?: string; tags?: string[] } = {}
	): Promise<SearchResult[]> {
		await this.ensureIndex();

		// Use the index for FTS5 search
		return this.index.search(query, options);
	}

	/** Gets all unique tags from the index. */
	getAllTags(): string[] {
		return this.index.getAllTags();
	}

	/** Gets notes that have a specific tag. */
	getNotesByTag(tag: string): string[] {
		return this.index.getNotesByTag(tag);
	}

	/** Gets backlinks for a note. */
	getBacklinks(path: string): string[] {
		return this.index.getBacklinks(path);
	}

	/** Rebuilds the search index from scratch. */
	async rebuildIndex(): Promise<void> {
		await this.index.rebuildIndex(this.dataDir);
	}

	/** Gets index statistics. */
	getIndexStats() {
		return this.index.getStats();
	}

	// -----------------------------------------------------------------------
	// Semantic Search Operations
	// -----------------------------------------------------------------------

	/**
	 * Performs a semantic search using vector embeddings.
	 * Returns results ranked by similarity to the query.
	 */
	async semanticSearch(
		query: string,
		options: { limit?: number; threshold?: number } = {}
	): Promise<SemanticSearchResult[]> {
		await this.ensureIndex();
		return this.index.performSemanticSearch(query, options);
	}

	/**
	 * Finds notes similar to a given note using embeddings.
	 */
	async findSimilarNotes(
		notePath: string,
		options: { limit?: number; threshold?: number } = {}
	): Promise<SemanticSearchResult[]> {
		await this.ensureIndex();
		return this.index.findSimilarNotes(notePath, options);
	}

	/**
	 * Rebuilds all embeddings for semantic search.
	 */
	async rebuildEmbeddings(): Promise<{
		total: number;
		indexed: number;
		errors: string[];
	}> {
		await this.ensureIndex();
		return this.index.rebuildAllEmbeddings();
	}

	/**
	 * Gets statistics about the semantic search index.
	 */
	getSemanticSearchStats(): {
		available: boolean;
		provider: string | null;
		embeddingCount: number;
		dimensions: number | null;
	} {
		return this.index.getSemanticSearchStats();
	}

	// -----------------------------------------------------------------------
	// Private helpers
	// -----------------------------------------------------------------------

	/** Converts parsed markdown + file path into NoteMetadata. */
	private toMetadata(
		path: string,
		parsed: ReturnType<typeof parseMarkdown>,
		rawContent: string
	): NoteMetadata {
		const now = new Date().toISOString();
		return {
			path,
			title: parsed.title,
			tags: parsed.tags,
			links: parsed.links,
			backlinks: [],
			wordCount: parsed.wordCount,
			createdAt: (parsed.frontmatter.created as string) ?? now,
			updatedAt: now,
			checksum: parsed.checksum
		};
	}
}
