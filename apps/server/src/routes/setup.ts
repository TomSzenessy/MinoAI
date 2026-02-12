/**
 * Setup Routes — First-run setup page and credentials display.
 *
 * Public (no auth required) — accessible immediately after first boot.
 * Returns credentials, server identity, and setup instructions.
 */

import { Hono } from "hono";
import type { Context } from "hono";
import type { AppContext } from "../types";
import { buildDirectConnectLinks, buildRelayConnectLinks } from "../utils/connect-links";

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
    const directServerUrl = resolveDirectServerUrl(c);
    const mode = config.connection.mode;
    const relayBaseUrl = normalizeBaseUrl(config.connection.relayUrl);
    const publicServerUrl = normalizeBaseUrl(config.connection.publicServerUrl) || directServerUrl;

    // If setup is already complete, redact the API key
    const apiKey = credentials.setupComplete
      ? `${credentials.adminApiKey.slice(0, 12)}${"•".repeat(20)}`
      : credentials.adminApiKey;

    const directLinkParams = new URLSearchParams({ serverUrl: publicServerUrl });
    if (!credentials.setupComplete) {
      directLinkParams.set("apiKey", credentials.adminApiKey);
    }

    const relayLinkParams = new URLSearchParams({
      relayCode: credentials.relayPairCode,
    });
    if (relayBaseUrl) {
      relayLinkParams.set("relayUrl", relayBaseUrl);
    }

    const connectLinks = mode === "relay"
      ? buildRelayConnectLinks(relayLinkParams, directServerUrl)
      : buildDirectConnectLinks(directLinkParams, publicServerUrl);

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
        pairing: {
          mode,
          relayCode: mode === "relay" ? credentials.relayPairCode : null,
          relayUrl: mode === "relay" ? relayBaseUrl : null,
        },
        server: {
          url: publicServerUrl,
          port: config.server.port,
          host: config.server.host,
          cors: config.server.cors,
        },
        links: {
          setupApi: `${publicServerUrl}/api/v1/system/setup`,
          health: `${publicServerUrl}/api/v1/health`,
          apiBase: mode === "relay" && relayBaseUrl
            ? `${relayBaseUrl}/r/${credentials.serverId}/api/v1`
            : `${publicServerUrl}/api/v1`,
          directApiBase: `${publicServerUrl}/api/v1`,
          relayApiBase: relayBaseUrl ? `${relayBaseUrl}/r/${credentials.serverId}/api/v1` : null,
          connect: connectLinks,
        },
        instructions: credentials.setupComplete
          ? "Server is configured. Use the web UI or API to manage your notes."
          : [
              mode === "relay"
                ? "Open the mino.ink connect link. It uses relay code pairing by default."
                : "Copy your API key — it will be redacted after setup.",
              "Open one of the connect links to prefill server details.",
              mode === "relay"
                ? "For local usage, use localUi/localDevUi with relay code prefill."
                : "If prefill is unavailable, paste server URL and API key manually.",
              "Then call POST /api/v1/auth/link to mark setup complete.",
            ],
      },
    });
  });

  return router;
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function resolveDirectServerUrl(c: Context<AppContext>): string {
  const config = c.get("config");
  if (config.connection.publicServerUrl) {
    return normalizeBaseUrl(config.connection.publicServerUrl);
  }

  const forwardedProto = c.req.header("X-Forwarded-Proto");
  const forwardedHost = c.req.header("X-Forwarded-Host");

  if (forwardedHost) {
    const proto = forwardedProto ?? "https";
    return `${proto}://${forwardedHost}`;
  }

  const url = new URL(c.req.url);
  return normalizeBaseUrl(`${url.protocol}//${url.host}`);
}
