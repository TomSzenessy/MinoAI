/**
 * Setup Routes — First-run setup page and credentials display.
 *
 * Public (no auth required) — accessible immediately after first boot.
 * Returns credentials, server identity, and setup instructions.
 */

import { Hono } from "hono";
import type { Context } from "hono";
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
    const serverUrl = resolveServerUrl(c);

    // If setup is already complete, redact the API key
    const apiKey = credentials.setupComplete
      ? `${credentials.adminApiKey.slice(0, 12)}${"•".repeat(20)}`
      : credentials.adminApiKey;

    const linkParams = new URLSearchParams({ serverUrl });
    if (!credentials.setupComplete) {
      linkParams.set("apiKey", credentials.adminApiKey);
    }

    return c.json({
      success: true,
      data: {
        serverId: credentials.serverId,
        apiKey,
        setupComplete: credentials.setupComplete,
        version,
        auth: {
          method: "api-key",
          header: "X-Mino-Key",
          note: "Use this header for all protected API endpoints",
        },
        server: {
          url: serverUrl,
          port: config.server.port,
          host: config.server.host,
          cors: config.server.cors,
        },
        links: {
          setupApi: `${serverUrl}/api/v1/system/setup`,
          health: `${serverUrl}/api/v1/health`,
          apiBase: `${serverUrl}/api/v1`,
          connect: {
            testMinoInk: `https://test.mino.ink/link?${linkParams.toString()}`,
            minoInk: `https://mino.ink/link?${linkParams.toString()}`,
            localUi: `${serverUrl}/link?${linkParams.toString()}`,
            localDevUi: `http://localhost:5173/link?${linkParams.toString()}`,
          },
        },
        instructions: credentials.setupComplete
          ? "Server is configured. Use the web UI or API to manage your notes."
          : [
              "Copy your API key — it will be redacted after setup.",
              "Open one of the connect links to prefill server details.",
              "If prefill is unavailable, paste server URL and API key manually.",
              "Then call POST /api/v1/auth/link to mark setup complete.",
            ],
      },
    });
  });

  return router;
}

function resolveServerUrl(c: Context<AppContext>): string {
  const forwardedProto = c.req.header("X-Forwarded-Proto");
  const forwardedHost = c.req.header("X-Forwarded-Host");

  if (forwardedHost) {
    const proto = forwardedProto ?? "https";
    return `${proto}://${forwardedHost}`;
  }

  const url = new URL(c.req.url);
  return `${url.protocol}//${url.host}`;
}
