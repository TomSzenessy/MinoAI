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
import { startRelayConnector } from "./services/relay-connector";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildDirectConnectLinks, buildRelayConnectLinks } from "./utils/connect-links";

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
  const localBaseUrl = `http://${host === "0.0.0.0" ? "localhost" : host}:${port}`;

  // --- Startup banner (plain console.log — no timestamps, clickable links) ---
  const b = (s: string) => console.log(s);
  const hr = "━".repeat(62);

  b("");
  b(`  ┏${hr}┓`);
  b(`  ┃  Mino Server v${SERVER_VERSION.padEnd(47)}┃`);
  b(`  ┣${hr}┫`);
  b(`  ┃  Data:       ${dataDir.padEnd(47)}┃`);
  b(`  ┃  Listening:  http://${host}:${port}${"".padEnd(Math.max(0, 39 - `http://${host}:${port}`.length))}┃`);
  b(`  ┃  Web UI:     ${(webDistDir ? "enabled" : "not bundled").padEnd(47)}┃`);
  b(`  ┃  Mode:       ${config.connection.mode.padEnd(47)}┃`);

  if (config.connection.mode === "relay") {
    b(`  ┃  Relay:      ${config.connection.relayUrl.padEnd(47)}┃`);
  }

  if (!credentials.setupComplete) {
    const relayLinkParams = new URLSearchParams({
      relayCode: credentials.relayPairCode,
      relayUrl: config.connection.relayUrl.replace(/\/+$/, ""),
    });
    const directLinkParams = new URLSearchParams({
      serverUrl: localBaseUrl,
      apiKey: credentials.adminApiKey,
    });

    b(`  ┣${hr}┫`);
    b(`  ┃  🟣 FIRST RUN — Setup credentials${"".padEnd(28)}┃`);
    b(`  ┣${hr}┫`);
    b(`  ┃  API Key:    ${credentials.adminApiKey.padEnd(47)}┃`);
    b(`  ┃  Server ID:  ${credentials.serverId.padEnd(47)}┃`);

    if (config.connection.mode === "relay") {
      b(`  ┃  Pair Code:  ${credentials.relayPairCode.padEnd(47)}┃`);
    }

    b(`  ┣${hr}┫`);
    b(`  ┃  Quick-connect links:${"".padEnd(40)}┃`);
    b(`  ┣${hr}┫`);

    if (config.connection.mode === "relay") {
      const relayLinks = buildRelayConnectLinks(relayLinkParams, localBaseUrl);
      b(`  ┃${"".padEnd(62)}┃`);
      b(`  ┃  test.mino.ink:${"".padEnd(46)}┃`);
      b(`  ┃  ${relayLinks.testMinoInk.padEnd(60)}┃`);
      b(`  ┃${"".padEnd(62)}┃`);
      b(`  ┃  mino.ink:${"".padEnd(52)}┃`);
      b(`  ┃  ${relayLinks.minoInk.padEnd(60)}┃`);
      b(`  ┃${"".padEnd(62)}┃`);
      b(`  ┃  local UI:${"".padEnd(50)}┃`);
      b(`  ┃  ${relayLinks.localUi.padEnd(60)}┃`);
      b(`  ┃${"".padEnd(62)}┃`);
      b(`  ┃  local dev UI:${"".padEnd(47)}┃`);
      b(`  ┃  ${relayLinks.localDevUi.padEnd(60)}┃`);
      b(`  ┃${"".padEnd(62)}┃`);
    } else {
      const directLinks = buildDirectConnectLinks(directLinkParams, localBaseUrl);
      b(`  ┃${"".padEnd(62)}┃`);
      b(`  ┃  test.mino.ink:${"".padEnd(46)}┃`);
      b(`  ┃  ${directLinks.testMinoInk.padEnd(60)}┃`);
      b(`  ┃${"".padEnd(62)}┃`);
      b(`  ┃  mino.ink:${"".padEnd(52)}┃`);
      b(`  ┃  ${directLinks.minoInk.padEnd(60)}┃`);
      b(`  ┃${"".padEnd(62)}┃`);
      b(`  ┃  Built-in UI:${"".padEnd(49)}┃`);
      b(`  ┃  ${directLinks.localUi.padEnd(60)}┃`);
      b(`  ┃${"".padEnd(62)}┃`);
    }
  }

  b(`  ┗${hr}┛`);
  b("");

  // Step 5: Start relay connector (must be AFTER banner, BEFORE serve)
  if (config.connection.mode === "relay") {
    startRelayConnector({
      relayUrl: config.connection.relayUrl,
      serverId: credentials.serverId,
      relaySecret: credentials.relaySecret,
      getRelayPairCode: () => credentials.relayPairCode,
      adminApiKey: credentials.adminApiKey,
      localBaseUrl: `http://127.0.0.1:${port}`,
      waitMs: 20000,
    });
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
