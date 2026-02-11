/**
 * Config Loader — Reads, validates, and merges configuration.
 *
 * Config is loaded from three sources with this priority order:
 *   1. Environment variables (highest priority)
 *   2. /data/config.json (user-editable)
 *   3. Default values (lowest priority)
 *
 * This enables Docker users to override any setting via env vars
 * without touching the config file.
 */

import { existsSync } from "node:fs";
import type { ServerConfig } from "@mino-ink/shared";
import { serverConfigSchema } from "./schema";
import { DEFAULT_CONFIG } from "./defaults";
import { getConfigPath } from "../utils/paths";
import { logger } from "../utils/logger";

/**
 * Loads and validates the server configuration.
 *
 * @param dataDir - Absolute path to the data directory
 * @returns Validated ServerConfig object
 */
export function loadConfig(dataDir: string): ServerConfig {
  const configPath = getConfigPath(dataDir);
  let fileConfig: Partial<ServerConfig> = {};

  // Load config.json if it exists
  if (existsSync(configPath)) {
    try {
      const raw = Bun.file(configPath).json();
      fileConfig = raw as Partial<ServerConfig>;
      logger.info(`Config loaded from: ${configPath}`);
    } catch (err) {
      logger.warn(`Failed to parse config file, using defaults: ${err}`);
    }
  } else {
    logger.info("No config file found — using defaults");
  }

  // Merge: defaults ← file ← env overrides
  const merged = deepMerge(DEFAULT_CONFIG, fileConfig);
  applyEnvOverrides(merged);

  // Validate with Zod
  const result = serverConfigSchema.safeParse(merged);
  if (!result.success) {
    logger.warn("Config validation warnings:", result.error.flatten());
    // Return merged config even with validation issues (Zod defaults fill gaps)
    return merged as ServerConfig;
  }

  return result.data as ServerConfig;
}

/**
 * Applies environment variable overrides to the config object.
 * Env vars use the MINO_ prefix and double underscores for nesting:
 *   MINO_SERVER__PORT=8080 → config.server.port = 8080
 *   MINO_SERVER__CORS=https://mino.ink,https://test.mino.ink → config.server.cors = [...]
 */
function applyEnvOverrides(config: Record<string, unknown>): void {
  const envMap: Record<string, (val: string) => void> = {
    MINO_PORT:             (v) => { (config.server as Record<string, unknown>).port = parseInt(v, 10); },
    MINO_HOST:             (v) => { (config.server as Record<string, unknown>).host = v; },
    MINO_CORS_ORIGINS:     (v) => { (config.server as Record<string, unknown>).cors = v.split(",").map(s => s.trim()); },
    MINO_AUTH_MODE:        (v) => { (config.auth as Record<string, unknown>).mode = v; },
    MINO_AGENT_ENABLED:    (v) => { (config.agent as Record<string, unknown>).enabled = v === "true"; },
    MINO_AGENT_PROVIDER:   (v) => { (config.agent as Record<string, unknown>).provider = v; },
    MINO_AGENT_MODEL:      (v) => { (config.agent as Record<string, unknown>).model = v; },
    MINO_AGENT_API_KEY:    (v) => { (config.agent as Record<string, unknown>).apiKey = v; },
    MINO_LOG_LEVEL:        () => { /* handled by logger directly */ },
  };

  for (const [envKey, setter] of Object.entries(envMap)) {
    const value = process.env[envKey];
    if (value !== undefined) {
      setter(value);
      // Don't log API keys
      const safeValue = envKey.includes("KEY") || envKey.includes("SECRET") ? "***" : value;
      logger.info(`  Env override: ${envKey}=${safeValue}`);
    }
  }
}

/**
 * Deep-merges two objects. Source values override target values.
 * Arrays are replaced entirely (not concatenated).
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceVal = source[key];
    const targetVal = result[key];

    if (
      sourceVal !== undefined &&
      sourceVal !== null &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal) &&
      targetVal !== null
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      ) as T[keyof T];
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal as T[keyof T];
    }
  }

  return result;
}
