/**
 * Setup Routes — First-run setup page and credentials display.
 *
 * Public (no auth required) — accessible immediately after first boot.
 * Returns credentials, server identity, and setup instructions.
 */

import { Hono } from "hono";
import type { AppContext } from "../types";

export function setupRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  /**
   * GET /api/v1/system/setup
   *
   * Returns the setup information including credentials.
   * After setup is complete, the API key is redacted for security.
   */
  router.get("/setup", (c) => {
    const credentials = c.get("credentials");
    const version = c.get("version");
    const config = c.get("config");

    // If setup is already complete, redact the API key
    const apiKey = credentials.setupComplete
      ? `${credentials.adminApiKey.slice(0, 12)}${"•".repeat(20)}`
      : credentials.adminApiKey;

    return c.json({
      success: true,
      data: {
        serverId: credentials.serverId,
        apiKey,
        setupComplete: credentials.setupComplete,
        version,
        server: {
          port: config.server.port,
          host: config.server.host,
          cors: config.server.cors,
        },
        instructions: credentials.setupComplete
          ? "Server is configured. Use the web UI or API to manage your notes."
          : [
              "Copy your API key — it will be redacted after setup.",
              "Go to mino.ink (or your local UI) and link this server.",
              "Paste the server URL and API key to connect.",
            ],
      },
    });
  });

  return router;
}
