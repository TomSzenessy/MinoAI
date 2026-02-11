/**
 * Bootstrap — First-run setup and credential generation.
 *
 * On every server start, bootstrap() checks if the data directory
 * is initialized. If not, it creates the required folder structure,
 * generates credentials, and writes the default configuration.
 *
 * IDEMPOTENT: Safe to call on every boot. If credentials already
 * exist, they are loaded and returned without modification.
 */

import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { Credentials } from "@mino-ink/shared";
import { generateCredentials, loadCredentials, saveCredentials } from "./credentials";
import { createDefaultConfig } from "./config";
import { getNotesDir, getPluginsDir, getCredentialsPath, getConfigPath } from "../utils/paths";
import { logger } from "../utils/logger";

/**
 * Bootstraps the server data directory.
 *
 * @param dataDir - Absolute path to the data directory (e.g., /data)
 * @returns The server credentials (loaded or newly generated)
 */
export async function bootstrap(dataDir: string): Promise<Credentials> {
  const credentialsPath = getCredentialsPath(dataDir);
  const isFirstRun = !existsSync(credentialsPath);

  if (isFirstRun) {
    logger.info("🟣 First run detected — bootstrapping...");
    await initializeDataDirectory(dataDir);
    const credentials = generateCredentials();
    await saveCredentials(credentialsPath, credentials);
    await createDefaultConfig(getConfigPath(dataDir));
    logger.info("✓ Bootstrap complete");
    return credentials;
  }

  logger.info("Loading existing credentials...");
  return loadCredentials(credentialsPath);
}

/**
 * Creates the required directory structure inside the data directory.
 * Uses recursive mkdir so it works regardless of what exists.
 */
async function initializeDataDirectory(dataDir: string): Promise<void> {
  const dirs = [
    dataDir,
    getNotesDir(dataDir),
    getPluginsDir(dataDir),
  ];

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
    logger.info(`  Created: ${dir}`);
  }
}
