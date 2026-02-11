/**
 * Search Routes — Full-text search across notes.
 */

import { Hono } from "hono";
import type { AppContext } from "../types";
import { NoteService } from "../services/note-service";
import { HttpError } from "../middleware/error-handler";

export function searchRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  /**
   * GET /api/v1/search?q=...&limit=...&folder=...
   * Full-text search across all notes.
   * Returns snippets (not full content) for token efficiency.
   */
  router.get("/", async (c) => {
    const query = c.req.query("q");
    const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 100);
    const folder = c.req.query("folder");

    if (!query) {
      throw new HttpError(400, "VALIDATION_ERROR", "Query parameter 'q' is required");
    }

    const service = new NoteService(c.get("dataDir"));
    const results = await service.searchNotes(query, { limit, folder });

    return c.json({
      success: true,
      data: results,
    });
  });

  return router;
}
