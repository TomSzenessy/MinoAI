/**
 * Semantic Search Service — Vector similarity search for notes.
 *
 * Uses embeddings to find semantically similar notes, enabling
 * search beyond simple keyword matching.
 *
 * Features:
 * - Vector storage in SQLite using JSON serialization
 * - Cosine similarity search
 * - Incremental embedding updates
 * - Integration with existing IndexDB
 */

import { Database } from 'bun:sqlite';
import { logger } from '../utils/logger';
import {
	type EmbeddingVector,
	generateEmbedding,
	getEmbeddingProvider,
	cosineSimilarity,
	getEmbeddingProviderInfo
} from './embeddings';

/** Semantic search result */
export interface SemanticSearchResult {
	/** Note path */
	path: string;
	/** Note title */
	title: string;
	/** Similarity score (0-1) */
	similarity: number;
	/** Note snippet */
	snippet: string;
}

/** Embedding record stored in database */
interface EmbeddingRecord {
	path: string;
	embedding: string; // JSON serialized
	dimension: number;
	model: string;
	created_at: string;
	updated_at: string;
}

/** Options for semantic search */
export interface SemanticSearchOptions {
	/** Maximum number of results */
	limit?: number;
	/** Minimum similarity threshold (0-1) */
	threshold?: number;
	/** Filter by folder path prefix */
	folder?: string;
}

/**
 * Semantic search service for vector similarity search.
 */
export class SemanticSearchService {
	private db: Database;
	private isInitialized = false;

	constructor(db: Database) {
		this.db = db;
	}

	/** Initialize the semantic search tables */
	initialize(): void {
		if (this.isInitialized) return;

		// Create embeddings table
		this.db.run(`
			CREATE TABLE IF NOT EXISTS note_embeddings (
				path TEXT PRIMARY KEY,
				embedding TEXT NOT NULL,
				dimension INTEGER NOT NULL,
				model TEXT NOT NULL,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			)
		`);

		// Create index on path for faster lookups
		this.db.run(`
			CREATE INDEX IF NOT EXISTS idx_embeddings_path ON note_embeddings(path)
		`);

		this.isInitialized = true;
		logger.info('Semantic search service initialized');
	}

	/**
	 * Generate and store embedding for a note.
	 */
	async indexNote(path: string, content: string): Promise<void> {
		this.initialize();

		try {
			const embedding = await generateEmbedding(content);
			const provider = await getEmbeddingProvider();
			const now = new Date().toISOString();

			// Serialize embedding to JSON
			const embeddingJson = JSON.stringify(embedding);

			// Upsert embedding
			this.db.run(`
					INSERT INTO note_embeddings (path, embedding, dimension, model, created_at, updated_at)
					VALUES (?, ?, ?, ?, ?, ?)
					ON CONFLICT(path) DO UPDATE SET
						embedding = excluded.embedding,
						dimension = excluded.dimension,
						model = excluded.model,
						updated_at = excluded.updated_at
				`, [path, embeddingJson, provider.dimension, provider.model, now, now]);

			logger.debug(`Indexed embedding for: ${path}`);
		} catch (error) {
			logger.error(`Failed to index embedding for ${path}`, { error });
		}
	}

	/**
	 * Remove embedding for a note.
	 */
	removeNote(path: string): void {
		this.initialize();

		this.db.run('DELETE FROM note_embeddings WHERE path = ?', [path]);
		logger.debug(`Removed embedding for: ${path}`);
	}

	/**
	 * Perform semantic search using query text.
	 */
	async search(
		query: string,
		options: SemanticSearchOptions = {}
	): Promise<SemanticSearchResult[]> {
		this.initialize();

		const { limit = 10, threshold = 0.5, folder } = options;

		// Generate embedding for query
		const queryEmbedding = await generateEmbedding(query);

		// Get all embeddings
		let sql = 'SELECT path, embedding, dimension, model FROM note_embeddings';
		const params: string[] = [];

		if (folder) {
			sql += ' WHERE path LIKE ?';
			params.push(`${folder}%`);
		}

		const rows = this.db.prepare(sql).all(...params) as EmbeddingRecord[];

		// Calculate similarities
		const results: Array<{ path: string; similarity: number }> = [];

		for (const row of rows) {
			try {
				const embedding = JSON.parse(row.embedding) as EmbeddingVector;
				const similarity = cosineSimilarity(queryEmbedding, embedding);

				if (similarity >= threshold) {
					results.push({ path: row.path, similarity });
				}
			} catch (error) {
				logger.warn(`Failed to parse embedding for ${row.path}`, { error });
			}
		}

		// Sort by similarity (descending) and take top results
		results.sort((a, b) => b.similarity - a.similarity);
		const topResults = results.slice(0, limit);

		// Get note titles and snippets from notes table
		const searchResults: SemanticSearchResult[] = [];

		for (const result of topResults) {
			const note = this.db.prepare(`
				SELECT title, content FROM notes WHERE path = ?
			`).get(result.path) as { title: string; content: string } | undefined;

			if (note) {
				searchResults.push({
					path: result.path,
					title: note.title,
					similarity: result.similarity,
					snippet: this.generateSnippet(note.content, 150)
				});
			}
		}

		return searchResults;
	}

	/**
	 * Find similar notes to a given note.
	 */
	async findSimilar(
		notePath: string,
		options: SemanticSearchOptions = {}
	): Promise<SemanticSearchResult[]> {
		this.initialize();

		const { limit = 5, threshold = 0.6 } = options;

		// Get the note's embedding
		const row = this.db.prepare(`
			SELECT embedding FROM note_embeddings WHERE path = ?
		`).get(notePath) as EmbeddingRecord | undefined;

		if (!row) {
			return [];
		}

		const noteEmbedding = JSON.parse(row.embedding) as EmbeddingVector;

		// Get all other embeddings
		const rows = this.db.prepare(`
			SELECT path, embedding FROM note_embeddings WHERE path != ?
		`).all(notePath) as EmbeddingRecord[];

		// Calculate similarities
		const results: Array<{ path: string; similarity: number }> = [];

		for (const otherRow of rows) {
			try {
				const embedding = JSON.parse(otherRow.embedding) as EmbeddingVector;
				const similarity = cosineSimilarity(noteEmbedding, embedding);

				if (similarity >= threshold) {
					results.push({ path: otherRow.path, similarity });
				}
			} catch (error) {
				logger.warn(`Failed to parse embedding for ${otherRow.path}`, { error });
			}
		}

		// Sort by similarity (descending) and take top results
		results.sort((a, b) => b.similarity - a.similarity);
		const topResults = results.slice(0, limit);

		// Get note titles and snippets
		const searchResults: SemanticSearchResult[] = [];

		for (const result of topResults) {
			const note = this.db.prepare(`
				SELECT title, content FROM notes WHERE path = ?
			`).get(result.path) as { title: string; content: string } | undefined;

			if (note) {
				searchResults.push({
					path: result.path,
					title: note.title,
					similarity: result.similarity,
					snippet: this.generateSnippet(note.content, 150)
				});
			}
		}

		return searchResults;
	}

	/**
	 * Get statistics about semantic search.
	 */
	getStats(): {
		indexedCount: number;
		provider: string;
		model: string;
		dimension: number;
	} {
		this.initialize();

		const count = (
			this.db.prepare('SELECT COUNT(*) as count FROM note_embeddings').get() as {
				count: number;
			}
		).count;

		// Get provider info synchronously (we'll use cached values)
		return {
			indexedCount: count,
			provider: 'auto-detected',
			model: 'unknown',
			dimension: 0
		};
	}

	/**
	 * Get async stats with provider info.
	 */
	async getStatsAsync(): Promise<{
		indexedCount: number;
		provider: string;
		model: string;
		dimension: number;
	}> {
		const stats = this.getStats();
		const providerInfo = await getEmbeddingProviderInfo();

		return {
			...stats,
			provider: providerInfo.name,
			model: providerInfo.model,
			dimension: providerInfo.dimension
		};
	}

	/**
	 * Rebuild all embeddings from notes table.
	 */
	async rebuildEmbeddings(): Promise<{ total: number; success: number; failed: number }> {
		this.initialize();

		// Get all notes
		const notes = this.db.prepare(`
			SELECT path, content FROM notes
		`).all() as Array<{ path: string; content: string }>;

		let success = 0;
		let failed = 0;

		for (const note of notes) {
			try {
				await this.indexNote(note.path, note.content);
				success++;
			} catch {
				failed++;
			}
		}

		logger.info(`Rebuilt embeddings: ${success} success, ${failed} failed`);

		return {
			total: notes.length,
			success,
			failed
		};
	}

	/**
	 * Generate a text snippet from content.
	 */
	private generateSnippet(content: string, maxLength: number): string {
		// Remove markdown formatting
		const cleaned = content
			.replace(/#{1,6}\s/g, '')
			.replace(/\*\*/g, '')
			.replace(/\*/g, '')
			.replace(/`/g, '')
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
			.replace(/\n+/g, ' ')
			.trim();

		if (cleaned.length <= maxLength) {
			return cleaned;
		}

		return cleaned.slice(0, maxLength - 3) + '...';
	}
}

/** Singleton instance */
let semanticSearchService: SemanticSearchService | null = null;

/**
 * Get the semantic search service instance.
 */
export function getSemanticSearchService(db: Database): SemanticSearchService {
	if (!semanticSearchService) {
		semanticSearchService = new SemanticSearchService(db);
	}
	return semanticSearchService;
}
