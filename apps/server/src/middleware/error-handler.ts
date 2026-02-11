/**
 * Error Handling — Consistent JSON errors across middleware and routes.
 *
 * Hono sub-apps can handle errors independently, so we expose:
 *   1) `errorHandler()` for middleware wrapping
 *   2) `handleAppError()` for `app.onError(...)`
 *
 * This guarantees `HttpError` status codes survive route boundaries.
 */

import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import type { AppContext } from "../types";
import { logger } from "../utils/logger";

/**
 * Typed HTTP error used by routes to return controlled status codes.
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

type NormalizedError = {
  status: number;
  code: string;
  message: string;
};

/**
 * Middleware form for consistency with existing middleware stack.
 */
export function errorHandler() {
  return createMiddleware<AppContext>(async (c, next) => {
    try {
      await next();
    } catch (err) {
      return handleAppError(err, c);
    }
  });
}

/**
 * Hono `onError` handler (works across mounted sub-app boundaries).
 */
export function handleAppError(err: unknown, c: Context<AppContext>): Response {
  const normalized = normalizeError(err);
  const { status, code, message } = normalized;

  if (status >= 500) {
    logger.error(`[${c.req.method} ${c.req.path}] ${message}`, err);
  } else {
    logger.warn(`[${c.req.method} ${c.req.path}] ${status} ${code}: ${message}`);
  }

  const publicMessage =
    status >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : message;

  return c.json(
    {
      success: false,
      error: {
        code,
        message: publicMessage,
      },
    },
    status as 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500,
  );
}

function normalizeError(err: unknown): NormalizedError {
  if (isHttpErrorLike(err)) {
    return {
      status: normalizeStatus(err.status),
      code: err.code || "HTTP_ERROR",
      message: err.message || "Request failed",
    };
  }

  if (err instanceof Error) {
    return {
      status: 500,
      code: "INTERNAL_ERROR",
      message: err.message || "An unexpected error occurred",
    };
  }

  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  };
}

function isHttpErrorLike(err: unknown): err is HttpError {
  if (err instanceof HttpError) return true;

  if (!err || typeof err !== "object") return false;

  const candidate = err as {
    name?: unknown;
    status?: unknown;
    code?: unknown;
    message?: unknown;
  };

  return (
    candidate.name === "HttpError" &&
    typeof candidate.status === "number" &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  );
}

function normalizeStatus(status: number): number {
  if (!Number.isInteger(status)) return 500;
  if (status < 400 || status > 599) return 500;
  return status;
}
