/**
 * Bootstrap Tests — Verifies the first-run setup process.
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { bootstrap } from "../src/bootstrap/index";
import { createTestDataDir, cleanupTestDataDir } from "./helpers/setup";

describe("Bootstrap", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await createTestDataDir();
  });

  afterEach(async () => {
    await cleanupTestDataDir(dataDir);
  });

  it("generates credentials on first run", async () => {
    // Remove the notes dir so bootstrap re-creates it
    const { rm } = await import("node:fs/promises");
    await rm(join(dataDir, "notes"), { recursive: true, force: true });
    await rm(join(dataDir, "plugins"), { recursive: true, force: true });

    const credentials = await bootstrap(dataDir);

    expect(credentials).toBeDefined();
    expect(credentials.serverId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(credentials.adminApiKey).toMatch(/^mino_sk_[0-9a-f]{48}$/);
    expect(credentials.jwtSecret).toHaveLength(128); // 64 bytes hex
    expect(credentials.setupComplete).toBe(false);
  });

  it("creates required directories", async () => {
    await bootstrap(dataDir);

    expect(existsSync(join(dataDir, "notes"))).toBe(true);
    expect(existsSync(join(dataDir, "plugins"))).toBe(true);
  });

  it("creates credentials.json", async () => {
    await bootstrap(dataDir);

    const credPath = join(dataDir, "credentials.json");
    expect(existsSync(credPath)).toBe(true);

    const content = await Bun.file(credPath).json();
    expect(content.serverId).toBeDefined();
    expect(content.adminApiKey).toBeDefined();
  });

  it("creates config.json with defaults", async () => {
    await bootstrap(dataDir);

    const configPath = join(dataDir, "config.json");
    expect(existsSync(configPath)).toBe(true);

    const config = await Bun.file(configPath).json();
    expect(config.server.port).toBe(3000);
    expect(config.server.cors).toContain("https://mino.ink");
    expect(config.server.cors).toContain("https://test.mino.ink");
  });

  it("is idempotent — second run loads existing credentials", async () => {
    const first = await bootstrap(dataDir);
    const second = await bootstrap(dataDir);

    expect(second.serverId).toBe(first.serverId);
    expect(second.adminApiKey).toBe(first.adminApiKey);
    expect(second.jwtSecret).toBe(first.jwtSecret);
  });
});
