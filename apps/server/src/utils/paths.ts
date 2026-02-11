/**
 * Paths — Path utilities for safe file operations.
 *
 * All file paths are resolved relative to the data directory.
 * Path traversal attacks (../) are prevented by normalization
 * and validation against the data root.
 */

import { resolve, normalize, join, relative, extname, basename } from "node:path";

/**
 * Returns the data directory path.
 * Priority: MINO_DATA_DIR env var → /data (Docker) → ./data (local dev).
 */
export function getDataDir(): string {
  if (process.env.MINO_DATA_DIR) {
    return resolve(process.env.MINO_DATA_DIR);
  }

  // In Docker, /data is the volume mount point.
  // In local dev, use ./data relative to the server directory.
  try {
    const stat = Bun.file("/data").size;
    if (stat !== undefined) return "/data";
  } catch {
    // /data doesn't exist — use local fallback
  }

  return resolve(process.cwd(), "data");
}

/** Returns the absolute path to the notes directory. */
export function getNotesDir(dataDir: string): string {
  return join(dataDir, "notes");
}

/** Returns the absolute path to the plugins directory. */
export function getPluginsDir(dataDir: string): string {
  return join(dataDir, "plugins");
}

/** Returns the absolute path to the SQLite database. */
export function getDbPath(dataDir: string): string {
  return join(dataDir, "mino.db");
}

/** Returns the absolute path to config.json. */
export function getConfigPath(dataDir: string): string {
  return join(dataDir, "config.json");
}

/** Returns the absolute path to credentials.json. */
export function getCredentialsPath(dataDir: string): string {
  return join(dataDir, "credentials.json");
}

/**
 * Resolves a user-provided relative note path to a safe absolute path.
 * Throws if the resolved path escapes the notes directory (path traversal).
 *
 * @param notesDir - Absolute path to the notes root
 * @param userPath - User-provided relative path (e.g., "Projects/Alpha/readme.md")
 * @returns Absolute path within the notes directory
 * @throws Error if path traversal is detected
 */
export function resolveNotePath(notesDir: string, userPath: string): string {
  // Normalize and resolve against notes root
  const normalizedUser = normalize(userPath).replace(/^[/\\]+/, "");
  const resolved = resolve(notesDir, normalizedUser);

  // Ensure the resolved path is still within the notes directory
  const rel = relative(notesDir, resolved);
  if (rel.startsWith("..") || resolve(notesDir, rel) !== resolved) {
    throw new Error(`Path traversal detected: "${userPath}" resolves outside the notes directory`);
  }

  return resolved;
}

/**
 * Extracts a clean relative path from an absolute note path.
 * Always uses forward slashes and strips the notes root prefix.
 */
export function toRelativePath(notesDir: string, absolutePath: string): string {
  return relative(notesDir, absolutePath).replace(/\\/g, "/");
}

/**
 * Validates that a user-provided path is safe and well-formed.
 * Returns an error message if invalid, or null if valid.
 */
export function validateNotePath(userPath: string): string | null {
  if (!userPath || typeof userPath !== "string") {
    return "Path is required";
  }

  if (userPath.length > 500) {
    return "Path is too long (max 500 characters)";
  }

  // Must end with .md
  if (extname(userPath).toLowerCase() !== ".md") {
    return "Path must end with .md";
  }

  // No null bytes
  if (userPath.includes("\0")) {
    return "Path contains invalid characters";
  }

  // No double dots (path traversal)
  if (userPath.includes("..")) {
    return "Path cannot contain '..'";
  }

  // No absolute paths
  if (userPath.startsWith("/") || userPath.startsWith("\\")) {
    return "Path must be relative";
  }

  // Filename must not be empty
  const name = basename(userPath, ".md");
  if (!name) {
    return "Filename cannot be empty";
  }

  return null;
}
