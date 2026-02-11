/**
 * Folder Routes — File tree and folder management.
 */

import { Hono } from "hono";
import type { AppContext } from "../types";
import { FileManager } from "../services/file-manager";

export function folderRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  /**
   * GET /api/v1/folders/tree
   * Returns the full folder tree (compacted: folder names + file counts).
   */
  router.get("/tree", async (c) => {
    const fm = new FileManager(c.get("dataDir"));
    const tree = await fm.getTree();

    return c.json({ success: true, data: tree });
  });

  /**
   * GET /api/v1/folders/tree/:path
   * Returns a subtree for a specific folder path.
   */
  router.get("/tree/:path{.+}", async (c) => {
    const folderPath = c.req.param("path");
    const fm = new FileManager(c.get("dataDir"));
    const tree = await fm.getTree(folderPath);

    return c.json({ success: true, data: tree });
  });

  return router;
}
