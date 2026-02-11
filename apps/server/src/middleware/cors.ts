/**
 * CORS Middleware — Configurable cross-origin resource sharing.
 *
 * Supports:
 *   - Multiple explicit origins (mino.ink, test.mino.ink, localhost)
 *   - Wildcard matching (e.g., https://*.mino.ink)
 *   - Dynamic origin checking based on the config
 *   - Proper preflight (OPTIONS) handling
 *
 * The allowed origins list is loaded from config.json and can be
 * overridden via the MINO_CORS_ORIGINS environment variable.
 */

import { createMiddleware } from "hono/factory";
import type { AppContext } from "../types";

/**
 * Creates CORS middleware with the given allowed origins.
 *
 * @param allowedOrigins - Array of allowed origin URLs (exact match or pattern)
 */
export function corsMiddleware(allowedOrigins: string[]) {
  return createMiddleware<AppContext>(async (c, next) => {
    const requestOrigin = c.req.header("Origin");

    // Handle preflight requests immediately
    if (c.req.method === "OPTIONS") {
      const headers = new Headers();
      headers.set("Vary", "Origin");

      if (requestOrigin && isOriginAllowed(requestOrigin, allowedOrigins)) {
        headers.set("Access-Control-Allow-Origin", requestOrigin);
        headers.set("Access-Control-Allow-Credentials", "true");
        headers.set("Access-Control-Allow-Headers", "Content-Type, X-Mino-Key, Authorization");
        headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        headers.set("Access-Control-Max-Age", "86400");
      }

      return new Response(null, { status: 204, headers });
    }

    // Continue to next middleware / route handler
    await next();

    // Set CORS headers on the response AFTER it's been created
    c.res.headers.set("Vary", "Origin");

    if (requestOrigin && isOriginAllowed(requestOrigin, allowedOrigins)) {
      c.res.headers.set("Access-Control-Allow-Origin", requestOrigin);
      c.res.headers.set("Access-Control-Allow-Credentials", "true");
      c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Mino-Key, Authorization");
      c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    }
  });
}

/**
 * Checks if the given origin is in the allowed list.
 *
 * Supports exact URL matching and simple wildcard subdomain patterns:
 *   - "https://mino.ink" matches exactly
 *   - "https://*.mino.ink" matches any subdomain (e.g., test.mino.ink)
 *   - "http://localhost:*" matches any port on localhost
 */
function isOriginAllowed(origin: string, allowed: string[]): boolean {
  for (const pattern of allowed) {
    // Exact match
    if (origin === pattern) return true;

    // Wildcard subdomain match: https://*.example.com
    if (pattern.includes("*")) {
      const regexStr = pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // escape regex chars except *
        .replace(/\\\*/g, "[^/]+");              // replace * with non-slash match
      const regex = new RegExp(`^${regexStr}$`);
      if (regex.test(origin)) return true;
    }

    // Localhost with any port
    if (pattern.startsWith("http://localhost") && origin.startsWith("http://localhost")) {
      return true;
    }
  }

  return false;
}
