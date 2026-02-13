/**
 * IndexDB — SQLite FTS5 full-text search index for notes.
 *
 * This service manages a SQLite database that indexes all notes
 * for fast full-text search. The index is derived from the file
 * system and can be rebuilt at any time.
 *
 * Features:
 * - FTS5 full-text search with ranking
 * - Tag extraction and indexing
 * - Backlink tracking
 * - Incremental updates via checksum comparison
 */

import { Database } from 'bun:sqlite';
import { join } from 'node:path';
import type { SearchResult, NoteMetadata, FolderNode } from '@mino-ink/shared';
import { parseMarkdown } from '../utils/markdown';
import { FileManager } from './file-manager';

/** Index statistics */
export interface IndexStats {
	/** Total number of indexed notes. */
	noteCount: number;
	/** Total number of unique tags. */
	tagCount: number;
	/** Total number of internal links. */
	linkCount: number;
	/** Time of last full index (ISO string). */
	lastIndexedAt: string | null;
	/** Whether the index is currently being rebuilt. */
	isIndexing: boolean;
}

/** Options for search queries. */
export interface SearchOptions {
	/** Maximum number of results. */
	limit?: number;
	/** Filter by folder path prefix. */
	folder?: string;
	/** Filter by tags (AND logic). */
	tags?: string[];
	/** Include snippet context. */
	includeSnippet?: boolean;
}

/** Internal note record for indexing. */
interface NoteRecord {
	path: string;
	title: string;
	content: string;
	tags: string;
	checksum: string;
	word_count: number;
	created_at: string;
	updated_at: string;
	frontmatter_json: string;
}

/**
 * SQLite-based index for full-text search.
 * Uses FTS5 for efficient text search with ranking.
 */
export class IndexDB {
	private db: Database;
	private dbPath: string;
	private isInitialized = false;
	private indexingPromise: Promise<void> | null = null;

	constructor(dataDir: string) {
		this.dbPath = join(dataDir, 'mino.db');
		this.db = new Database(this.dbPath);
		// Enable WAL mode for better concurrent performance
		this.db.run('PRAGMA journal_mode = WAL');
		this.db.run('PRAGMA synchronous = NORMAL');
	}

	/** Initializes the database schema if not already done. */
	initialize(): void {
		if (this.isInitialized) return;

		// Create notes table
		this.db.run(`
	      CREATE TABLE IF NOT EXISTS notes (
	        path TEXT PRIMARY KEY,
	        title TEXT NOT NULL,
	        content TEXT NOT NULL DEFAULT '',
	        tags TEXT NOT NULL DEFAULT '',
	        content_hash TEXT NOT NULL,
	        word_count INTEGER,
	        created_at TEXT,
	        updated_at TEXT,
	        frontmatter_json TEXT
	      )
	    `);
		this.ensureNotesColumn('content', "TEXT NOT NULL DEFAULT ''");
		this.ensureNotesColumn('tags', "TEXT NOT NULL DEFAULT ''");

		// Create FTS5 virtual table for full-text search
		this.db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
        path,
        title,
        content,
        tags,
        content='notes',
        content_rowid='rowid',
        tokenize='porter unicode61'
      )
    `);

		// Recreate triggers to keep FTS in sync with notes table.
		// We intentionally drop/recreate here so older databases pick up trigger fixes.
		this.db.run('DROP TRIGGER IF EXISTS notes_ai');
		this.db.run('DROP TRIGGER IF EXISTS notes_ad');
		this.db.run('DROP TRIGGER IF EXISTS notes_au');

		// Create triggers to keep FTS in sync with notes table
		this.db.run(`
	      CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
	        INSERT INTO notes_fts(rowid, path, title, content, tags)
	        VALUES (new.rowid, new.path, new.title, new.content, new.tags);
	      END
	    `);

		this.db.run(`
	      CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
	        INSERT INTO notes_fts(notes_fts, rowid, path, title, content, tags)
	        VALUES('delete', old.rowid, old.path, old.title, old.content, old.tags);
	      END
	    `);

		this.db.run(`
	      CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
	        INSERT INTO notes_fts(notes_fts, rowid, path, title, content, tags)
	        VALUES('delete', old.rowid, old.path, old.title, old.content, old.tags);
	        INSERT INTO notes_fts(rowid, path, title, content, tags)
	        VALUES (new.rowid, new.path, new.title, new.content, new.tags);
	      END
	    `);

		// Tags table
		this.db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        tag TEXT,
        note_path TEXT,
        PRIMARY KEY (tag, note_path)
      )
    `);

		// Links table for backlink tracking
		this.db.run(`
      CREATE TABLE IF NOT EXISTS links (
        source_path TEXT,
        target_path TEXT,
        PRIMARY KEY (source_path, target_path)
      )
    `);

		// Index metadata
		this.db.run(`
      CREATE TABLE IF NOT EXISTS index_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

		this.isInitialized = true;
	}

	private ensureNotesColumn(name: string, definition: string): void {
		const columns = this.db
			.prepare('PRAGMA table_info(notes)')
			.all() as Array<{ name: string }>;
		if (columns.some((column) => column.name === name)) {
			return;
		}

		this.db.run(`ALTER TABLE notes ADD COLUMN ${name} ${definition}`);
	}

	/** Closes the database connection. */
	close(): void {
		this.db.close();
	}

	/** Gets the database path. */
	getDbPath(): string {
		return this.dbPath;
	}

	// ===========================================================================
	// Indexing Operations
	// ===========================================================================

	/**
	 * Rebuilds the entire index from the file system.
	 * This is safe to run at any time - the index is derived data.
	 */
	async rebuildIndex(dataDir: string): Promise<void> {
		// Prevent concurrent indexing
		if (this.indexingPromise) {
			return this.indexingPromise;
		}

		this.indexingPromise = this.doRebuildIndex(dataDir);
		try {
			await this.indexingPromise;
		} finally {
			this.indexingPromise = null;
		}
	}

	private async doRebuildIndex(dataDir: string): Promise<void> {
		this.initialize();

		const fm = new FileManager(dataDir);
		const files = await fm.listAllFiles();

		// Clear existing index
		this.db.run('DELETE FROM notes');
		this.db.run('DELETE FROM tags');
		this.db.run('DELETE FROM links');

		// Use transaction for performance
		const insertNote = this.db.prepare(`
	      INSERT INTO notes (path, title, content, tags, content_hash, word_count, created_at, updated_at, frontmatter_json)
	      VALUES ($path, $title, $content, $tags, $contentHash, $wordCount, $createdAt, $updatedAt, $frontmatterJson)
	    `);

		const insertTag = this.db.prepare(`
      INSERT OR IGNORE INTO tags (tag, note_path) VALUES ($tag, $path)
    `);

		const insertLink = this.db.prepare(`
      INSERT OR IGNORE INTO links (source_path, target_path) VALUES ($source, $target)
    `);

		const transaction = this.db.transaction((notes: NoteRecord[]) => {
			for (const note of notes) {
				insertNote.run({
					$path: note.path,
					$title: note.title,
					$content: note.content,
					$tags: note.tags,
					$contentHash: note.checksum,
					$wordCount: note.word_count,
					$createdAt: note.created_at,
					$updatedAt: note.updated_at,
					$frontmatterJson: note.frontmatter_json
				});

				for (const tag of note.tags.split(',').filter(Boolean)) {
					insertTag.run({ $tag: tag, $path: note.path });
				}
			}
		});

		const noteRecords: NoteRecord[] = [];

		for (const filePath of files) {
			const content = await fm.readFile(filePath);
			if (content === null) continue;

			const parsed = parseMarkdown(content);
			const now = new Date().toISOString();

			noteRecords.push({
				path: filePath,
				title: parsed.title,
				content: parsed.content,
				tags: parsed.tags.join(','),
				checksum: parsed.checksum,
				word_count: parsed.wordCount,
				created_at: (parsed.frontmatter.created as string) ?? now,
				updated_at: now,
				frontmatter_json: JSON.stringify(parsed.frontmatter)
			});

			// Process links
			for (const link of parsed.links) {
				insertLink.run({ $source: filePath, $target: link });
			}
		}

		transaction(noteRecords);

		// Update last indexed timestamp
		this.db.run(
			`
      INSERT OR REPLACE INTO index_meta (key, value) VALUES ('lastIndexedAt', ?)
    `,
			[new Date().toISOString()]
		);
	}

	/**
	 * Updates the index for a single note.
	 * Called when a note is created or updated.
	 */
	indexNote(path: string, content: string): void {
		this.initialize();

		const parsed = parseMarkdown(content);
		const now = new Date().toISOString();

		const existing = this.db
			.prepare('SELECT content_hash FROM notes WHERE path = ?')
			.get(path) as { content_hash: string } | undefined;

		// Skip if checksum matches (no changes)
		if (existing && existing.content_hash === parsed.checksum) {
			return;
		}

		const transaction = this.db.transaction(() => {
			// Delete existing record if present
			this.db.run('DELETE FROM notes WHERE path = ?', [path]);
			this.db.run('DELETE FROM tags WHERE note_path = ?', [path]);
			this.db.run('DELETE FROM links WHERE source_path = ?', [path]);

			// Insert new record
			this.db.run(
				`
		        INSERT INTO notes (path, title, content, tags, content_hash, word_count, created_at, updated_at, frontmatter_json)
		        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		      `,
				[
					path,
					parsed.title,
					parsed.content,
					parsed.tags.join(','),
					parsed.checksum,
					parsed.wordCount,
					(parsed.frontmatter.created as string) ?? now,
					now,
					JSON.stringify(parsed.frontmatter)
				]
			);

			// Insert tags
			for (const tag of parsed.tags) {
				this.db.run(
					'INSERT OR IGNORE INTO tags (tag, note_path) VALUES (?, ?)',
					[tag, path]
				);
			}

			// Insert links
			for (const link of parsed.links) {
				this.db.run(
					'INSERT OR IGNORE INTO links (source_path, target_path) VALUES (?, ?)',
					[path, link]
				);
			}
		});

		transaction();
	}

	/** Removes a note from the index. */
	removeNote(path: string): void {
		this.initialize();

		const transaction = this.db.transaction(() => {
			this.db.run('DELETE FROM notes WHERE path = ?', [path]);
			this.db.run('DELETE FROM tags WHERE note_path = ?', [path]);
			this.db.run('DELETE FROM links WHERE source_path = ?', [path]);
			this.db.run('DELETE FROM links WHERE target_path = ?', [path]);
		});

		transaction();
	}

	// ===========================================================================
	// Search Operations
	// ===========================================================================

	/**
	 * Performs a full-text search across all notes.
	 * Returns ranked results with snippets.
	 */
	search(query: string, options: SearchOptions = {}): SearchResult[] {
		this.initialize();

		const { limit = 20, folder, tags } = options;
		const tagFilters = (tags ?? []).map((tag) => tag.trim()).filter(Boolean);

		// Build the FTS query with proper escaping
		const escapedQuery = query.replace(/['"]/g, "''");
		const ftsQuery = this.buildFtsQuery(escapedQuery, { folder, tags });
		const tagClauses =
			tagFilters.length > 0
				? tagFilters
						.map(
							() =>
								'EXISTS (SELECT 1 FROM tags tf WHERE tf.note_path = n.path AND tf.tag = ?)'
						)
						.join(' AND ')
				: '';
		const sql = `
	      SELECT 
	        n.path,
	        n.title,
	        snippet(notes_fts, 2, '...', '...', '', 60) as snippet,
	        bm25(notes_fts) as score,
	        (
	          SELECT GROUP_CONCAT(t.tag, ',')
	          FROM tags t
	          WHERE t.note_path = n.path
	        ) as tags
	      FROM notes_fts
	      JOIN notes n ON notes_fts.rowid = n.rowid
	      WHERE notes_fts MATCH ?
	      ${folder ? "AND n.path LIKE ? || '%'" : ''}
	      ${tagClauses ? `AND ${tagClauses}` : ''}
	      ORDER BY score ASC
	      LIMIT ?
	    `;
		const params: Array<string | number> = [ftsQuery];
		if (folder) {
			params.push(folder);
		}
		params.push(...tagFilters);
		params.push(limit);

		// Execute search with ranking
		const results = this.db.prepare(sql).all(...params) as Array<{
				path: string;
				title: string;
				snippet: string;
				score: number;
				tags: string | null;
			}>;

		// Convert to SearchResult format
		return results.map((row) => ({
			path: row.path,
			title: row.title,
			snippet: row.snippet || '',
			score: Math.abs(row.score), // BM25 returns negative scores
			tags: row.tags ? row.tags.split(',') : []
		}));
	}

	/** Builds an FTS5 query string from user input. */
	private buildFtsQuery(
		query: string,
		options: { folder?: string; tags?: string[] }
	): string {
		// Simple tokenization - each word must match
		const tokens = query.split(/\s+/).filter(Boolean);

		if (tokens.length === 0) {
			return '*'; // Match all
		}

		// Join with AND for stricter matching
		return tokens.map((t) => `"${t}"*`).join(' AND ');
	}

	// ===========================================================================
	// Metadata Operations
	// ===========================================================================

	/** Gets statistics about the index. */
	getStats(): IndexStats {
		this.initialize();

		const noteCount = (
			this.db.prepare('SELECT COUNT(*) as count FROM notes').get() as {
				count: number;
			}
		).count;
		const tagCount = (
			this.db
				.prepare('SELECT COUNT(DISTINCT tag) as count FROM tags')
				.get() as { count: number }
		).count;
		const linkCount = (
			this.db.prepare('SELECT COUNT(*) as count FROM links').get() as {
				count: number;
			}
		).count;

		const lastIndexed = this.db
			.prepare("SELECT value FROM index_meta WHERE key = 'lastIndexedAt'")
			.get() as { value: string } | undefined;

		return {
			noteCount,
			tagCount,
			linkCount,
			lastIndexedAt: lastIndexed?.value ?? null,
			isIndexing: this.indexingPromise !== null
		};
	}

	/** Gets backlinks for a note (notes that link to it). */
	getBacklinks(path: string): string[] {
		this.initialize();

		const results = this.db
			.prepare(
				`
      SELECT source_path FROM links WHERE target_path = ?
    `
			)
			.all(path) as Array<{ source_path: string }>;

		return results.map((r) => r.source_path);
	}

	/** Gets all notes with a specific tag. */
	getNotesByTag(tag: string): string[] {
		this.initialize();

		const results = this.db
			.prepare(
				`
      SELECT note_path FROM tags WHERE tag = ?
    `
			)
			.all(tag) as Array<{ note_path: string }>;

		return results.map((r) => r.note_path);
	}

	/** Gets all unique tags. */
	getAllTags(): string[] {
		this.initialize();

		const results = this.db
			.prepare(
				`
      SELECT DISTINCT tag FROM tags ORDER BY tag
    `
			)
			.all() as Array<{ tag: string }>;

		return results.map((r) => r.tag);
	}

	/** Gets note metadata from the index (fast, no file read). */
	getNoteMetadata(path: string): NoteMetadata | null {
		this.initialize();

		const row = this.db
			.prepare(
				`
      SELECT 
        n.path,
        n.title,
        n.word_count,
        n.created_at,
        n.updated_at,
        n.content_hash,
        GROUP_CONCAT(t.tag, ',') as tags
      FROM notes n
      LEFT JOIN tags t ON t.note_path = n.path
      WHERE n.path = ?
      GROUP BY n.path
    `
			)
			.get(path) as
			| {
					path: string;
					title: string;
					word_count: number;
					created_at: string;
					updated_at: string;
					content_hash: string;
					tags: string | null;
			  }
			| undefined;

		if (!row) return null;

		const backlinks = this.getBacklinks(path);

		return {
			path: row.path,
			title: row.title,
			tags: row.tags ? row.tags.split(',') : [],
			links: [], // Would need to query links table
			backlinks,
			wordCount: row.word_count,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
			checksum: row.content_hash
		};
	}

	/** Checks if the index is empty and needs rebuilding. */
	needsRebuild(): boolean {
		this.initialize();

		const count = (
			this.db.prepare('SELECT COUNT(*) as count FROM notes').get() as {
				count: number;
			}
		).count;
		return count === 0;
	}
}
