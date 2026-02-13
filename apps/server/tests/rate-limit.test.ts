import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { cleanupTestDataDir, createTestApp, createTestDataDir } from "./helpers/setup";

const ORIGINAL_ENV = { ...process.env };

describe("API rate limiting", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await createTestDataDir();
    process.env.MINO_RATE_LIMIT_ENABLED = "true";
    process.env.MINO_RATE_LIMIT_WINDOW_MS = "60000";
    process.env.MINO_RATE_LIMIT_IP_MAX = "2";
    process.env.MINO_RATE_LIMIT_KEY_MAX = "10";
    process.env.MINO_RATE_LIMIT_CONCURRENT_IP = "10";
  });

  afterEach(async () => {
    await cleanupTestDataDir(dataDir);
    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL_ENV)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
      process.env[key] = value;
    }
  });

  it("throttles API traffic after the per-IP budget is exceeded", async () => {
    const { app, deps } = createTestApp(dataDir);
    const headers = {
      "X-Mino-Key": deps.credentials.adminApiKey,
      "X-Forwarded-For": "203.0.113.11",
    };

    const first = await app.request("/api/v1/system/capabilities", { headers });
    const second = await app.request("/api/v1/system/capabilities", { headers });
    const third = await app.request("/api/v1/system/capabilities", { headers });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);

    const body = await third.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(third.headers.get("x-ratelimit-remaining")).toBe("0");
  });

  it("throttles by API key across different IPs", async () => {
    process.env.MINO_RATE_LIMIT_IP_MAX = "100";
    process.env.MINO_RATE_LIMIT_KEY_MAX = "1";

    const { app, deps } = createTestApp(dataDir);
    const first = await app.request("/api/v1/system/capabilities", {
      headers: {
        "X-Mino-Key": deps.credentials.adminApiKey,
        "X-Forwarded-For": "198.51.100.1",
      },
    });

    const second = await app.request("/api/v1/system/capabilities", {
      headers: {
        "X-Mino-Key": deps.credentials.adminApiKey,
        "X-Forwarded-For": "198.51.100.2",
      },
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });
});
