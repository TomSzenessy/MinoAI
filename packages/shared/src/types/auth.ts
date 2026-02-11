/**
 * Auth types — Credentials and authentication primitives.
 *
 * Credentials are auto-generated on server first boot and stored
 * in `/data/credentials.json`. They are never committed to git.
 */

/** Server identity + secrets generated on first boot. */
export interface Credentials {
  /** Unique server identifier (UUID v4). */
  serverId: string;
  /** Admin API key for authenticating requests (mino_sk_...). */
  adminApiKey: string;
  /** Secret used to sign JWT tokens. */
  jwtSecret: string;
  /** Secret used by the server connector to authenticate to relay. */
  relaySecret: string;
  /** Human-friendly pairing code for one-click relay linking. */
  relayPairCode: string;
  /** ISO 8601 timestamp of latest relay pairing code generation. */
  relayPairCodeCreatedAt: string;
  /** ISO 8601 timestamp of when credentials were generated. */
  createdAt: string;
  /** Whether the setup flow has been completed (server linked to a frontend). */
  setupComplete: boolean;
}

/** Public server identity (safe to send over the API). */
export interface ServerIdentity {
  /** Unique server identifier. */
  serverId: string;
  /** Server version string. */
  version: string;
  /** Whether first-run setup is complete. */
  setupComplete: boolean;
}

/** JWT token payload. */
export interface AuthToken {
  /** Subject — the server ID or user ID. */
  sub: string;
  /** Issued-at timestamp (Unix seconds). */
  iat: number;
  /** Expiration timestamp (Unix seconds). */
  exp: number;
  /** Token type: "access" or "refresh". */
  type: "access" | "refresh";
}

/** API key metadata (for listing / revoking keys). */
export interface ApiKeyInfo {
  /** Unique key identifier (not the key itself). */
  id: string;
  /** Human-readable label. */
  label: string;
  /** First 8 characters of the key (for identification). */
  prefix: string;
  /** ISO 8601 timestamp of creation. */
  createdAt: string;
  /** ISO 8601 timestamp of last use, or null. */
  lastUsedAt: string | null;
}
