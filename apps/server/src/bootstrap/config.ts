/**
 * Bootstrap Config — Generates the default config.json on first run.
 *
 * The config is written only if it doesn't already exist.
 * All values are sensible defaults that work out-of-the-box.
 */

import { existsSync } from "node:fs";
import type { ServerConfig } from "@mino-ink/shared";
import { DEFAULT_CONFIG } from "../config/defaults";
import { logger } from "../utils/logger";

/**
 * Writes default config.json to disk (only on first run).
 * If the file already exists, this is a no-op.
 */
export async function createDefaultConfig(configPath: string): Promise<void> {
  if (existsSync(configPath)) {
    logger.info("  Config already exists — skipping");
    return;
  }

  await Bun.write(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
  logger.info(`  Config written to: ${configPath}`);
}
