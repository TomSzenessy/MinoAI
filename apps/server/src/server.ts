/**
 * Hono Application Factory
 *
 * Creates the Hono app with all middleware and routes attached.
 * Separated from the entry point to enable testing (import the app
 * without starting a server).
 */

import { Hono } from "hono";
import type { Credentials, ServerConfig } from "@mino-ink/shared";
import { corsMiddleware } from "./middleware/cors";
import { authMiddleware } from "./middleware/auth";
import { errorHandler, handleAppError } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { healthRoutes } from "./routes/health";
import { setupRoutes } from "./routes/setup";
import { systemRoutes } from "./routes/system";
import { authRoutes } from "./routes/auth";
import { noteRoutes } from "./routes/notes";
import { folderRoutes } from "./routes/folders";
import { searchRoutes } from "./routes/search";
import type { AppContext } from "./types";

export interface AppDependencies {
  config: ServerConfig;
  credentials: Credentials;
  dataDir: string;
  version: string;
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
    await next();
  });

  // ---------------------------------------------------------------------------
  // Global middleware (order matters)
  // ---------------------------------------------------------------------------
  app.use("*", errorHandler());
  app.use("*", requestLogger());
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

  return app;
}
