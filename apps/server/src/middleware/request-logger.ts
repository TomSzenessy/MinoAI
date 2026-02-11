/**
 * Request Logger Middleware — Structured HTTP request logging.
 *
 * Logs method, path, status, and response time for every request.
 * Skips health check endpoints to avoid log noise.
 */

import { createMiddleware } from "hono/factory";
import type { AppContext } from "../types";
import { logger } from "../utils/logger";

/** Paths to skip logging (noisy health checks). */
const SKIP_PATHS = new Set(["/api/v1/health"]);

export function requestLogger() {
  return createMiddleware<AppContext>(async (c, next) => {
    if (SKIP_PATHS.has(c.req.path)) {
      await next();
      return;
    }

    const start = performance.now();
    await next();
    const durationMs = (performance.now() - start).toFixed(1);

    const status = c.res.status;
    const method = c.req.method;
    const path = c.req.path;

    const logFn = status >= 400 ? logger.warn : logger.info;
    logFn(`${method} ${path} → ${status} (${durationMs}ms)`);
  });
}
