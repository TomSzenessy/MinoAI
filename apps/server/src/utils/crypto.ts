/**
 * Crypto — Secure key generation and hashing.
 *
 * Uses Node.js built-in crypto (available in Bun) for all
 * cryptographic operations. No external dependencies.
 */

import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

/**
 * Generates a Mino API key with the `mino_sk_` prefix.
 * Format: mino_sk_<48 random hex characters> (total: 56 chars)
 */
export function generateApiKey(): string {
  return `mino_sk_${randomBytes(24).toString("hex")}`;
}

/** Generates a UUID v4 string (for server IDs and other identifiers). */
export function generateServerId(): string {
  return crypto.randomUUID();
}

/** Generates a random secret for JWT signing (64 bytes, hex). */
export function generateJwtSecret(): string {
  return randomBytes(64).toString("hex");
}

/** Generates a random secret used for relay connector authentication. */
export function generateRelaySecret(): string {
  return randomBytes(32).toString("hex");
}

/** Generates an 8-char pairing code (uppercase letters + digits). */
export function generateRelayPairCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}

/**
 * Computes a SHA-256 hash of the given content.
 * Used for note content checksums and change detection.
 */
export function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Compares two strings in constant time to prevent timing attacks.
 * Used for API key validation.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
