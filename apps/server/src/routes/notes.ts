/**
 * Note Routes — Full CRUD for markdown notes.
 *
 * All note paths are relative to the notes directory.
 * Path traversal is prevented by the resolveNotePath utility.
 */

import { Hono } from "hono";
import type { AppContext } from "../types";
import { NoteService } from "../services/note-service";
import { HttpError } from "../middleware/error-handler";
import { validateNotePath } from "../utils/paths";

export function noteRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  /**
   * GET /api/v1/notes
   * List all notes (metadata only, no content).
   */
  router.get("/", async (c) => {
    const service = new NoteService(c.get("dataDir"));
    const notes = await service.listNotes();

    return c.json({
      success: true,
      data: notes,
    });
  });

  /**
   * GET /api/v1/notes/:path
   * Get a single note by path (full content + metadata).
   * The path is everything after /notes/ (supports nested paths via +).
   */
  router.get("/:path{.+}", async (c) => {
    const notePath = c.req.param("path");
    const pathError = validateNotePath(notePath);
    if (pathError) {
      throw new HttpError(400, "VALIDATION_ERROR", pathError);
    }

    const service = new NoteService(c.get("dataDir"));
    const note = await service.getNote(notePath);

    if (!note) {
      throw new HttpError(404, "NOTE_NOT_FOUND", `Note not found: ${notePath}`);
    }

    return c.json({ success: true, data: note });
  });

  /**
   * POST /api/v1/notes
   * Create a new note.
   * Body: { path: "folder/name.md", content: "# Title\n..." }
   */
  router.post("/", async (c) => {
    const body = await c.req.json<{ path?: string; content?: string }>();

    if (!body.path) {
      throw new HttpError(400, "VALIDATION_ERROR", "path is required");
    }
    if (body.content === undefined) {
      throw new HttpError(400, "VALIDATION_ERROR", "content is required");
    }

    const pathError = validateNotePath(body.path);
    if (pathError) {
      throw new HttpError(400, "VALIDATION_ERROR", pathError);
    }

    const service = new NoteService(c.get("dataDir"));
    const exists = await service.noteExists(body.path);
    if (exists) {
      throw new HttpError(409, "NOTE_ALREADY_EXISTS", `Note already exists: ${body.path}`);
    }

    const note = await service.createNote(body.path, body.content);
    return c.json({ success: true, data: note }, 201);
  });

  /**
   * PUT /api/v1/notes/:path
   * Replace the entire content of a note.
   * Body: { content: "# Updated content\n..." }
   */
  router.put("/:path{.+}", async (c) => {
    const notePath = c.req.param("path");
    const pathError = validateNotePath(notePath);
    if (pathError) {
      throw new HttpError(400, "VALIDATION_ERROR", pathError);
    }

    const body = await c.req.json<{ content?: string }>();
    if (body.content === undefined) {
      throw new HttpError(400, "VALIDATION_ERROR", "content is required");
    }

    const service = new NoteService(c.get("dataDir"));
    const exists = await service.noteExists(notePath);
    if (!exists) {
      throw new HttpError(404, "NOTE_NOT_FOUND", `Note not found: ${notePath}`);
    }

    const note = await service.updateNote(notePath, body.content);
    return c.json({ success: true, data: note });
  });

  /**
   * DELETE /api/v1/notes/:path
   * Delete a note (permanent).
   */
  router.delete("/:path{.+}", async (c) => {
    const notePath = c.req.param("path");
    const pathError = validateNotePath(notePath);
    if (pathError) {
      throw new HttpError(400, "VALIDATION_ERROR", pathError);
    }

    const service = new NoteService(c.get("dataDir"));
    const exists = await service.noteExists(notePath);
    if (!exists) {
      throw new HttpError(404, "NOTE_NOT_FOUND", `Note not found: ${notePath}`);
    }

    await service.deleteNote(notePath);
    return c.json({ success: true, data: { deleted: notePath } });
  });

  return router;
}
