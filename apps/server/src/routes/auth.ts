/**
 * Auth Routes — Server linking and credential verification.
 *
 * These endpoints handle:
 *   - Verifying API keys (client checking if their key is valid)
 *   - Linking a frontend (mino.ink) to this server
 */

import { Hono } from "hono";
import type { AppContext } from "../types";
import { markSetupComplete, rotateRelayPairCode } from "../bootstrap/credentials";
import { getCredentialsPath } from "../utils/paths";
import { logger } from "../utils/logger";

export function authRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  /**
   * POST /api/v1/auth/verify
   * Verifies the current API key is valid (the auth middleware already did the work).
   * If you reach this endpoint, your key is valid.
   */
  router.post("/verify", (c) => {
    const credentials = c.get("credentials");

    return c.json({
      success: true,
      data: {
        valid: true,
        serverId: credentials.serverId,
        setupComplete: credentials.setupComplete,
      },
    });
  });

  /**
   * POST /api/v1/auth/link
   * Links a frontend (mino.ink or self-hosted UI) to this server.
   * Marks setup as complete so credentials are redacted in /api/v1/system/setup.
   */
  router.post("/link", async (c) => {
    const credentials = c.get("credentials");
    const dataDir = c.get("dataDir");

    if (!credentials.setupComplete) {
      await markSetupComplete(getCredentialsPath(dataDir));
      credentials.setupComplete = true;
      logger.info("Server linked — setup marked as complete");
    }

    return c.json({
      success: true,
      data: {
        serverId: credentials.serverId,
        setupComplete: true,
        message: "Server successfully linked.",
      },
    });
  });

  /**
   * POST /api/v1/auth/pair-code/rotate
   * Rotates relay pair code for one-click linking.
   */
  router.post("/pair-code/rotate", async (c) => {
    const credentials = c.get("credentials");
    const dataDir = c.get("dataDir");
    const nextCode = await rotateRelayPairCode(getCredentialsPath(dataDir));
    credentials.relayPairCode = nextCode;
    credentials.relayPairCodeCreatedAt = new Date().toISOString();

    return c.json({
      success: true,
      data: {
        serverId: credentials.serverId,
        relayPairCode: credentials.relayPairCode,
        relayPairCodeCreatedAt: credentials.relayPairCodeCreatedAt,
      },
    });
  });

  return router;
}
