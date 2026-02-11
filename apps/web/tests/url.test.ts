import { describe, expect, it } from "bun:test";
import { normalizeServerUrl, parseLinkParams, removeSensitiveQueryParams } from "../lib/url";

describe("normalizeServerUrl", () => {
  it("normalizes https urls", () => {
    const result = normalizeServerUrl("https://example.com/");
    expect(result.ok).toBe(true);
    expect(result.value).toBe("https://example.com");
  });

  it("allows localhost http", () => {
    const result = normalizeServerUrl("http://localhost:3000");
    expect(result.ok).toBe(true);
    expect(result.value).toBe("http://localhost:3000");
  });

  it("rejects insecure remote http", () => {
    const result = normalizeServerUrl("http://example.com");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("HTTPS");
  });
});

describe("link query parsing", () => {
  it("parses serverUrl and apiKey", () => {
    const params = new URLSearchParams("serverUrl=https://x.test&apiKey=mino_sk_123&name=Local");
    const parsed = parseLinkParams(params);

    expect(parsed.serverUrl).toBe("https://x.test");
    expect(parsed.apiKey).toBe("mino_sk_123");
    expect(parsed.name).toBe("Local");
  });

  it("strips apiKey from query", () => {
    const params = new URLSearchParams("serverUrl=https://x.test&apiKey=mino_sk_123&name=Local");
    const next = removeSensitiveQueryParams("/link", params);

    expect(next).toContain("serverUrl=");
    expect(next).not.toContain("apiKey=");
  });
});
