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

const SERVER_VERSION = "0.1.0";

async function main(): Promise<void> {
  const dataDir = getDataDir();

  logger.info(`Mino Server v${SERVER_VERSION}`);
  logger.info(`Data directory: ${dataDir}`);

  // Step 1: Bootstrap (idempotent — safe to call on every boot)
  const credentials = await bootstrap(dataDir);

  // Step 2: Load configuration
  const config = loadConfig(dataDir);

  // Step 3: Create the Hono application
  const app = createApp({ config, credentials, dataDir, version: SERVER_VERSION });

  // Step 4: Start listening
  const { port, host } = config.server;

  logger.info(`Server listening on http://${host}:${port}`);

  if (!credentials.setupComplete) {
    logger.info("─".repeat(60));
    logger.info("🟣 FIRST RUN — Setup credentials:");
    logger.info(`   Admin API Key: ${credentials.adminApiKey}`);
    logger.info(`   Server ID:     ${credentials.serverId}`);
    logger.info(`   Setup page:    http://${host === "0.0.0.0" ? "localhost" : host}:${port}/api/v1/system/setup`);
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
