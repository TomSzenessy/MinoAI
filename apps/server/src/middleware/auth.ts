/**
 * Auth Middleware — API key and JWT validation.
 *
 * Checks the `X-Mino-Key` header or `Authorization: Bearer <token>`
 * header against the server's credentials. Returns 401 for missing
 * or invalid auth.
 */

import { createMiddleware } from "hono/factory";
import type { AppContext } from "../types";
import { timingSafeEqual } from "node:crypto";

/**
 * Creates the auth middleware.
 * Supports two auth methods:
 *   1. API Key via `X-Mino-Key` header
 *   2. JWT Bearer token via `Authorization` header (future)
 */
export function authMiddleware() {
  return createMiddleware<AppContext>(async (c, next) => {
    const credentials = c.get("credentials");
    const config = c.get("config");

    // Skip auth in "none" mode (development only)
    if (config.auth.mode === "none") {
      await next();
      return;
    }

    // Try API key first
    const apiKey = c.req.header("X-Mino-Key");
    if (apiKey) {
      if (safeCompare(apiKey, credentials.adminApiKey)) {
        await next();
        return;
      }

      return c.json({
        success: false,
        error: { code: "INVALID_API_KEY", message: "Invalid API key" },
      }, 401);
    }

    // Try Bearer token
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      // TODO: JWT validation (Phase 2)
      // For now, treat Bearer tokens as unsupported
      return c.json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "JWT authentication not yet supported. Use X-Mino-Key header." },
      }, 401);
    }

    // No auth provided
    return c.json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required. Provide X-Mino-Key header." },
    }, 401);
  });
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
