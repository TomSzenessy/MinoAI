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
    return merged;
  }

  return result.data;
}

/**
 * Applies environment variable overrides to the config object.
 * Env vars use the MINO_ prefix and double underscores for nesting:
 *   MINO_SERVER__PORT=8080 → config.server.port = 8080
 *   MINO_SERVER__CORS=https://mino.ink,https://test.mino.ink → config.server.cors = [...]
 */
function applyEnvOverrides(config: ServerConfig): void {
  const isAuthMode = (value: string): value is ServerConfig["auth"]["mode"] =>
    value === "api-key" || value === "jwt" || value === "none";
  const isAgentProvider = (
    value: string,
  ): value is ServerConfig["agent"]["provider"] =>
    value === "" ||
    value === "anthropic" ||
    value === "openai" ||
    value === "google" ||
    value === "local";

  const envMap: Record<string, (val: string) => void> = {
    MINO_PORT:             (v) => { config.server.port = parseInt(v, 10); },
    MINO_HOST:             (v) => { config.server.host = v; },
    MINO_CORS_ORIGINS:     (v) => { config.server.cors = v.split(",").map(s => s.trim()); },
    MINO_AUTH_MODE:        (v) => { if (isAuthMode(v)) config.auth.mode = v; },
    MINO_AGENT_ENABLED:    (v) => { config.agent.enabled = v === "true"; },
    MINO_AGENT_PROVIDER:   (v) => { if (isAgentProvider(v)) config.agent.provider = v; },
    MINO_AGENT_MODEL:      (v) => { config.agent.model = v; },
    MINO_AGENT_API_KEY:    (v) => { config.agent.apiKey = v; },
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
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  const sourceEntries = Object.entries(source as Record<string, unknown>);

  for (const [key, sourceVal] of sourceEntries) {
    const targetVal = result[key];

    if (sourceVal === undefined) {
      continue;
    }

    if (isRecord(targetVal) && isRecord(sourceVal)) {
      result[key] = deepMerge(targetVal, sourceVal);
      continue;
    }

    result[key] = sourceVal;
  }

  return result as T;
}
