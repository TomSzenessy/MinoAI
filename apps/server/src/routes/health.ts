/**
 * Health Route — Simple health check endpoint.
 *
 * Public (no auth required). Used by Docker HEALTHCHECK,
 * load balancers, and monitoring systems.
 */

import { Hono } from "hono";
import type { AppContext } from "../types";
import { getDbPath } from "../utils/paths";
import { existsSync } from "node:fs";

/** Server start time, used to calculate uptime. */
const startedAt = Date.now();

export function healthRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  /**
   * GET /api/v1/health
   * Returns server health status, version, and uptime.
   */
  router.get("/health", (c) => {
    const version = c.get("version");
    const dataDir = c.get("dataDir");
    const dbExists = existsSync(getDbPath(dataDir));

    return c.json({
      success: true,
      data: {
        status: dbExists ? "ok" : "degraded",
        version,
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        noteCount: 0, // TODO: wire up to IndexDB in Phase 2
        lastIndexedAt: null,
      },
    });
  });

  return router;
}
