/**
 * Test Helpers — Shared utilities for server tests.
 *
 * Creates isolated temporary data directories for each test
 * so tests don't interfere with each other or real data.
 */

import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Credentials, ServerConfig } from "@mino-ink/shared";
import { createApp, type AppDependencies } from "../../src/server";
import { DEFAULT_CONFIG } from "../../src/config/defaults";
import { generateCredentials } from "../../src/bootstrap/credentials";

/** Creates a temporary data directory for testing. */
export async function createTestDataDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "mino-test-"));
  await mkdir(join(dir, "notes"), { recursive: true });
  await mkdir(join(dir, "plugins"), { recursive: true });
  return dir;
}

/** Removes a test data directory. */
export async function cleanupTestDataDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

/** Creates a test app instance with fresh credentials and temp data dir. */
export function createTestApp(dataDir: string, overrides?: Partial<AppDependencies>) {
  const credentials: Credentials = overrides?.credentials ?? generateCredentials();
  const config: ServerConfig = overrides?.config ?? {
    ...DEFAULT_CONFIG,
    auth: { ...DEFAULT_CONFIG.auth, mode: "api-key" },
  };

  const deps: AppDependencies = {
    config,
    credentials,
    dataDir,
    version: "0.1.0-test",
    ...overrides,
  };

  return { app: createApp(deps), deps };
}
