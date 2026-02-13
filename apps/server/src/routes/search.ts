/**
 * Search Routes — Full-text and semantic search across notes.
 */

import { Hono } from 'hono';
import type { AppContext } from '../types';
import { NoteService } from '../services/note-service';
import { HttpError } from '../middleware/error-handler';

export function searchRoutes(): Hono<AppContext> {
	const router = new Hono<AppContext>();

	/**
	 * GET /api/v1/search?q=...&limit=...&folder=...
	 * Full-text search across all notes.
	 * Returns snippets (not full content) for token efficiency.
	 */
	router.get('/', async (c) => {
		const query = c.req.query('q');
		const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 100);
		const folder = c.req.query('folder');

		if (!query) {
			throw new HttpError(
				400,
				'VALIDATION_ERROR',
				"Query parameter 'q' is required"
			);
		}

		const service = new NoteService(c.get('dataDir'));
		const results = await service.searchNotes(query, { limit, folder });

		return c.json({
			success: true,
			data: results
		});
	});

	/**
	 * GET /api/v1/search/semantic?q=...&limit=...&threshold=...
	 * Semantic search using vector embeddings.
	 * Returns results ranked by similarity to the query.
	 */
	router.get('/semantic', async (c) => {
		const query = c.req.query('q');
		const limit = Math.min(parseInt(c.req.query('limit') ?? '10', 10), 50);
		const threshold = parseFloat(c.req.query('threshold') ?? '0.5');

		if (!query) {
			throw new HttpError(
				400,
				'VALIDATION_ERROR',
				"Query parameter 'q' is required"
			);
		}

		if (threshold < 0 || threshold > 1) {
			throw new HttpError(
				400,
				'VALIDATION_ERROR',
				'Threshold must be between 0 and 1'
			);
		}

		const service = new NoteService(c.get('dataDir'));
		const results = await service.semanticSearch(query, {
			limit,
			threshold
		});

		return c.json({
			success: true,
			data: results
		});
	});

	/**
	 * GET /api/v1/search/similar/:path
	 * Find notes similar to a given note using embeddings.
	 */
	router.get('/similar/:path{.*}', async (c) => {
		const notePath = c.req.param('path');
		const limit = Math.min(parseInt(c.req.query('limit') ?? '5', 10), 20);
		const threshold = parseFloat(c.req.query('threshold') ?? '0.6');

		if (threshold < 0 || threshold > 1) {
			throw new HttpError(
				400,
				'VALIDATION_ERROR',
				'Threshold must be between 0 and 1'
			);
		}

		const service = new NoteService(c.get('dataDir'));
		const results = await service.findSimilarNotes(notePath, {
			limit,
			threshold
		});

		return c.json({
			success: true,
			data: results
		});
	});

	/**
	 * POST /api/v1/search/embeddings/rebuild
	 * Rebuild all embeddings for semantic search.
	 */
	router.post('/embeddings/rebuild', async (c) => {
		const service = new NoteService(c.get('dataDir'));
		const result = await service.rebuildEmbeddings();

		return c.json({
			success: true,
			data: result
		});
	});

	/**
	 * GET /api/v1/search/embeddings/stats
	 * Get statistics about the semantic search index.
	 */
	router.get('/embeddings/stats', async (c) => {
		const service = new NoteService(c.get('dataDir'));
		const stats = await service.getSemanticSearchStats();

		return c.json({
			success: true,
			data: stats
		});
	});

	return router;
}
