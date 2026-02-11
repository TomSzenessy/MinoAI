/**
 * Credentials — Generation and persistence of server secrets.
 *
 * Credentials are generated ONCE on first boot and never overwritten.
 * They include the admin API key, server ID, and JWT signing secret.
 */

import type { Credentials } from "@mino-ink/shared";
import {
  generateApiKey,
  generateServerId,
  generateJwtSecret,
  generateRelaySecret,
  generateRelayPairCode,
} from "../utils/crypto";
import { logger } from "../utils/logger";

/**
 * Generates a fresh set of server credentials.
 * Called only during first-run bootstrap.
 */
export function generateCredentials(): Credentials {
  const now = new Date().toISOString();
  return {
    serverId: generateServerId(),
    adminApiKey: generateApiKey(),
    jwtSecret: generateJwtSecret(),
    relaySecret: generateRelaySecret(),
    relayPairCode: generateRelayPairCode(),
    relayPairCodeCreatedAt: now,
    createdAt: now,
    setupComplete: false,
  };
}

/**
 * Writes credentials to disk as JSON.
 * File permissions are restricted to owner-only (600).
 */
export async function saveCredentials(path: string, credentials: Credentials): Promise<void> {
  await Bun.write(path, JSON.stringify(credentials, null, 2));

  // Restrict file permissions (Unix only, no-op on Windows)
  try {
    const { chmod } = await import("node:fs/promises");
    await chmod(path, 0o600);
  } catch {
    // chmod may fail in some Docker setups — non-critical
  }

  logger.info(`  Credentials written to: ${path}`);
}

/**
 * Loads credentials from disk.
 * Throws if the file is missing or malformed.
 */
export async function loadCredentials(path: string): Promise<Credentials> {
  const file = Bun.file(path);
  const exists = await file.exists();

  if (!exists) {
    throw new Error(`Credentials file not found: ${path}`);
  }

  const raw = await file.text();
  const parsed = JSON.parse(raw) as Credentials;

  // Basic validation
  if (!parsed.serverId || !parsed.adminApiKey || !parsed.jwtSecret) {
    throw new Error(`Credentials file is malformed: ${path}`);
  }

  // Backward compatibility for existing credentials files
  let changed = false;
  if (!parsed.relaySecret) {
    parsed.relaySecret = generateRelaySecret();
    changed = true;
  }
  if (!parsed.relayPairCode) {
    parsed.relayPairCode = generateRelayPairCode();
    parsed.relayPairCodeCreatedAt = new Date().toISOString();
    changed = true;
  }
  if (!parsed.relayPairCodeCreatedAt) {
    parsed.relayPairCodeCreatedAt = parsed.createdAt ?? new Date().toISOString();
    changed = true;
  }
  if (changed) {
    await saveCredentials(path, parsed);
    logger.info("Credentials upgraded with relay fields");
  }

  return parsed;
}

/**
 * Marks setup as complete (called after first server-link).
 * Reads → modifies → writes to avoid overwriting other fields.
 */
export async function markSetupComplete(path: string): Promise<void> {
  const credentials = await loadCredentials(path);
  credentials.setupComplete = true;
  await saveCredentials(path, credentials);
  logger.info("Setup marked as complete");
}

/** Rotates relay pair code for one-click linking flows. */
export async function rotateRelayPairCode(path: string): Promise<string> {
  const credentials = await loadCredentials(path);
  credentials.relayPairCode = generateRelayPairCode();
  credentials.relayPairCodeCreatedAt = new Date().toISOString();
  await saveCredentials(path, credentials);
  logger.info("Relay pair code rotated");
  return credentials.relayPairCode;
}
