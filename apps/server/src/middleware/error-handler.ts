/**
 * Error Handler Middleware — Consistent error responses.
 *
 * Catches any unhandled errors in route handlers and returns
 * a standardized JSON error response. Prevents stack traces
 * from leaking in production.
 */

import { createMiddleware } from "hono/factory";
import type { AppContext } from "../types";
import { logger } from "../utils/logger";

export function errorHandler() {
  return createMiddleware<AppContext>(async (c, next) => {
    try {
      await next();
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      const code = err instanceof HttpError ? err.code : "INTERNAL_ERROR";
      const message = err instanceof Error ? err.message : "An unexpected error occurred";

      // Log the full error server-side
      if (status >= 500) {
        logger.error(`[${c.req.method} ${c.req.path}] ${message}`, err);
      } else {
        logger.warn(`[${c.req.method} ${c.req.path}] ${status} ${code}: ${message}`);
      }

      return c.json({
        success: false,
        error: {
          code,
          message: status >= 500 && process.env.NODE_ENV === "production"
            ? "Internal server error"
            : message,
        },
      }, status as 400 | 401 | 403 | 404 | 409 | 429 | 500);
    }
  });
}

/**
 * Custom HTTP error class for throwing typed errors from route handlers.
 *
 * @example
 * throw new HttpError(404, "NOTE_NOT_FOUND", "Note not found: Projects/Alpha/readme.md");
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
