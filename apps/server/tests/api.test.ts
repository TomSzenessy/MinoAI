/**
 * Health & Auth Tests — Verifies public and protected endpoints.
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createTestDataDir, cleanupTestDataDir, createTestApp } from "./helpers/setup";

describe("Health Endpoint", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await createTestDataDir();
  });

  afterEach(async () => {
    await cleanupTestDataDir(dataDir);
  });

  it("returns 200 with health status (no auth required)", async () => {
    const { app } = createTestApp(dataDir);

    const res = await app.request("/api/v1/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.version).toBe("0.1.0-test");
    expect(body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});

describe("Auth Middleware", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await createTestDataDir();
  });

  afterEach(async () => {
    await cleanupTestDataDir(dataDir);
  });

  it("rejects requests without API key", async () => {
    const { app } = createTestApp(dataDir);

    const res = await app.request("/api/v1/system/capabilities");
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects requests with invalid API key", async () => {
    const { app } = createTestApp(dataDir);

    const res = await app.request("/api/v1/system/capabilities", {
      headers: { "X-Mino-Key": "mino_sk_invalid_key_here_xxxxxxxxxxxx" },
    });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error.code).toBe("INVALID_API_KEY");
  });

  it("accepts requests with valid API key", async () => {
    const { app, deps } = createTestApp(dataDir);

    const res = await app.request("/api/v1/system/capabilities", {
      headers: { "X-Mino-Key": deps.credentials.adminApiKey },
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.resources.cpu.cores).toBeGreaterThan(0);
  });

  it("allows access in none auth mode (development)", async () => {
    const { app } = createTestApp(dataDir, {
      config: {
        ...createTestApp(dataDir).deps.config,
        auth: { mode: "none", allowedOrigins: [] },
      },
    });

    const res = await app.request("/api/v1/system/capabilities");
    expect(res.status).toBe(200);
  });
});

describe("Setup Endpoint", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await createTestDataDir();
  });

  afterEach(async () => {
    await cleanupTestDataDir(dataDir);
  });

  it("returns credentials on first run (no auth required)", async () => {
    const { app, deps } = createTestApp(dataDir);

    const res = await app.request("/api/v1/system/setup");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.serverId).toBe(deps.credentials.serverId);
    expect(body.data.apiKey).toBe(deps.credentials.adminApiKey); // not redacted
    expect(body.data.setupComplete).toBe(false);
  });

  it("redacts API key after setup is complete", async () => {
    const { app } = createTestApp(dataDir, {
      credentials: {
        serverId: "test-id",
        adminApiKey: "mino_sk_abcdefabcdefabcdefabcdefabcdefabcdefabcdef123456",
        jwtSecret: "test-secret",
        relaySecret: "relay-secret-test",
        relayPairCode: "ABCD1234",
        relayPairCodeCreatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        setupComplete: true,
      },
    });

    const res = await app.request("/api/v1/system/setup");
    const body = await res.json();

    // API key should be partially redacted
    expect(body.data.apiKey).toContain("•");
    expect(body.data.apiKey).not.toBe(
      "mino_sk_abcdefabcdefabcdefabcdefabcdefabcdefabcdef123456",
    );
  });

  it("returns relay pairing links in relay mode", async () => {
    const { app } = createTestApp(dataDir);

    const res = await app.request("/api/v1/system/setup");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.pairing.mode).toBe("relay");
    expect(body.data.links.connect.minoInk).toContain("relayCode=");
    expect(body.data.links.connect.localUi).toBeUndefined();
  });

  it("returns direct links in open-port mode", async () => {
    const baseConfig = createTestApp(dataDir).deps.config;
    const { app } = createTestApp(dataDir, {
      config: {
        ...baseConfig,
        connection: {
          ...baseConfig.connection,
          mode: "open-port",
        },
      },
    });

    const res = await app.request("/api/v1/system/setup");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.pairing.mode).toBe("open-port");
    expect(body.data.links.connect.minoInk).toContain("serverUrl=");
    expect(body.data.links.connect.localUi).toContain("/link?");
  });
});
