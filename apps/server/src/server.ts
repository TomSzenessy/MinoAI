/**
 * Hono Application Factory
 *
 * Creates the Hono app with all middleware and routes attached.
 * Separated from the entry point to enable testing (import the app
 * without starting a server).
 */

import { Hono } from "hono";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Credentials, ServerConfig } from "@mino-ink/shared";
import { corsMiddleware } from "./middleware/cors";
import { authMiddleware } from "./middleware/auth";
import { errorHandler, handleAppError } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { apiRateLimitMiddleware } from "./middleware/rate-limit";
import { healthRoutes } from "./routes/health";
import { setupRoutes } from "./routes/setup";
import { systemRoutes } from "./routes/system";
import { authRoutes } from "./routes/auth";
import { noteRoutes } from "./routes/notes";
import { folderRoutes } from "./routes/folders";
import { searchRoutes } from "./routes/search";
import { pluginRoutes } from "./routes/plugins";
import type { AppContext } from "./types";

export interface AppDependencies {
  config: ServerConfig;
  credentials: Credentials;
  dataDir: string;
  version: string;
  webDistDir?: string | null;
}

const ASSET_FILE_REGEX = /\.[a-zA-Z0-9]+$/;

function sanitizePath(pathname: string): string | null {
  const normalized = pathname.replace(/^\/+/, "");
  if (normalized.includes("..")) {
    return null;
  }
  return normalized;
}

function resolveStaticPath(webDistDir: string, pathname: string): string | null {
  const safePath = sanitizePath(pathname);
  if (safePath === null) {
    return null;
  }

  const candidates: string[] = [];
  if (safePath === "") {
    candidates.push("index.html");
  } else if (ASSET_FILE_REGEX.test(safePath)) {
    candidates.push(safePath);
  } else {
    candidates.push(`${safePath}.html`, join(safePath, "index.html"), safePath);
  }

  for (const candidate of candidates) {
    const absolute = resolve(webDistDir, candidate);
    if (!absolute.startsWith(resolve(webDistDir))) {
      continue;
    }
    if (existsSync(absolute)) {
      return absolute;
    }
  }

  return null;
}

function staticCacheHeader(filePath: string): string {
  return filePath.includes("/_next/")
    ? "public, max-age=31536000, immutable"
    : "no-cache";
}

/**
 * Creates a fully configured Hono app instance.
 *
 * All dependencies are injected via context variables so routes
 * and middleware can access them without module-level globals.
 */
export function createApp(deps: AppDependencies): Hono<AppContext> {
  const app = new Hono<AppContext>();
  app.onError(handleAppError);

  // ---------------------------------------------------------------------------
  // Inject dependencies into Hono context (available in all routes)
  // ---------------------------------------------------------------------------
  app.use("*", async (c, next) => {
    c.set("config", deps.config);
    c.set("credentials", deps.credentials);
    c.set("dataDir", deps.dataDir);
    c.set("version", deps.version);
    c.set("webDistDir", deps.webDistDir ?? null);
    await next();
  });

  // ---------------------------------------------------------------------------
  // Global middleware (order matters)
  // ---------------------------------------------------------------------------
  app.use("*", errorHandler());
  app.use("*", requestLogger());
  app.use("*", apiRateLimitMiddleware());
  app.use("*", corsMiddleware(deps.config.server.cors));

  // ---------------------------------------------------------------------------
  // Public routes (no auth required)
  // ---------------------------------------------------------------------------
  app.route("/api/v1", healthRoutes());
  app.route("/api/v1/system", setupRoutes());

  // ---------------------------------------------------------------------------
  // Protected routes (API key or JWT required)
  // ---------------------------------------------------------------------------
  const protectedApi = new Hono<AppContext>();
  protectedApi.onError(handleAppError);
  protectedApi.use("*", authMiddleware());
  protectedApi.route("/system", systemRoutes());
  protectedApi.route("/auth", authRoutes());
  protectedApi.route("/notes", noteRoutes());
  protectedApi.route("/folders", folderRoutes());
  protectedApi.route("/search", searchRoutes());
  protectedApi.route("/plugins", pluginRoutes());

  app.route("/api/v1", protectedApi);

  // ---------------------------------------------------------------------------
  // Fallback: 404 for unknown API routes
  // ---------------------------------------------------------------------------
  app.all("/api/*", (c) => {
    return c.json({
      success: false,
      error: { code: "NOT_FOUND", message: `Route not found: ${c.req.method} ${c.req.path}` },
    }, 404);
  });

  // ---------------------------------------------------------------------------
  // Static Web UI Routes (built Next.js export)
  // ---------------------------------------------------------------------------
  app.get("*", (c) => {
    const webDistDir = c.get("webDistDir");
    if (!webDistDir) {
      return c.text("Web UI is not bundled in this build.", 404);
    }

    const staticPath = resolveStaticPath(webDistDir, c.req.path);
    if (!staticPath) {
      return c.text("Not Found", 404);
    }

    const file = Bun.file(staticPath);
    const headers = new Headers(c.res.headers);
    headers.set("Cache-Control", staticCacheHeader(staticPath));
    if (file.type) {
      headers.set("Content-Type", file.type);
    }

    return new Response(file, {
      headers,
    });
  });

  return app;
}
