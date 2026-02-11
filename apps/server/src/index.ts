/**
 * Mino Server — Entry Point
 *
 * 1. Runs the bootstrap process (first-run detection, credential/config generation)
 * 2. Creates the Hono application with all routes and middleware
 * 3. Starts listening on the configured port
 *
 * This file is kept intentionally thin — all logic lives in dedicated modules.
 */

import { bootstrap } from "./bootstrap/index";
import { createApp } from "./server";
import { loadConfig } from "./config/index";
import { logger } from "./utils/logger";
import { getDataDir } from "./utils/paths";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const SERVER_VERSION = "0.1.0";

function resolveWebDistDir(): string | null {
  const fromEnv = process.env.MINO_WEB_DIST;
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv;
  }

  const candidates = [
    resolve(process.cwd(), "apps/web/out"),
    resolve(process.cwd(), "../web/out"),
    resolve(import.meta.dir, "../../web/out"),
    "/app/apps/web/out",
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "index.html"))) {
      return candidate;
    }
  }

  return null;
}

async function main(): Promise<void> {
  const dataDir = getDataDir();

  logger.info(`Mino Server v${SERVER_VERSION}`);
  logger.info(`Data directory: ${dataDir}`);

  // Step 1: Bootstrap (idempotent — safe to call on every boot)
  const credentials = await bootstrap(dataDir);

  // Step 2: Load configuration
  const config = loadConfig(dataDir);
  const webDistDir = resolveWebDistDir();

  // Step 3: Create the Hono application
  const app = createApp({ config, credentials, dataDir, version: SERVER_VERSION, webDistDir });

  // Step 4: Start listening
  const { port, host } = config.server;

  logger.info(`Server listening on http://${host}:${port}`);
  logger.info(`Web UI: ${webDistDir ? `enabled (${webDistDir})` : "not bundled"}`);

  if (!credentials.setupComplete) {
    const localBaseUrl = `http://${host === "0.0.0.0" ? "localhost" : host}:${port}`;
    const linkParams = new URLSearchParams({ serverUrl: localBaseUrl });

    logger.info("─".repeat(60));
    logger.info("🟣 FIRST RUN — Setup credentials:");
    logger.info(`   Admin API Key: ${credentials.adminApiKey}`);
    logger.info(`   Server ID:     ${credentials.serverId}`);
    logger.info(`   Auth header:   X-Mino-Key: ${credentials.adminApiKey}`);
    logger.info(`   Setup API:     ${localBaseUrl}/api/v1/system/setup`);
    logger.info(`   test.mino.ink: https://test.mino.ink/link?${linkParams.toString()}`);
    logger.info(`   mino.ink:      https://mino.ink/link?${linkParams.toString()}`);
    logger.info(`   Built-in UI:   ${localBaseUrl}/link?${linkParams.toString()}`);
    logger.info(`   Local dev UI:  http://localhost:5173/link?${linkParams.toString()}`);
    logger.info("─".repeat(60));
  }

  Bun.serve({
    port,
    hostname: host,
    fetch: app.fetch,
  });
}

main().catch((err) => {
  logger.error("Fatal error during startup:", err);
  process.exit(1);
});
