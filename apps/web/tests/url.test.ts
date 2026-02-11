import { describe, expect, it } from "bun:test";
import { normalizeServerUrl, parseLinkParams, removeSensitiveQueryParams } from "../lib/url";

describe("normalizeServerUrl", () => {
  it("normalizes https urls", () => {
    const result = normalizeServerUrl("https://example.com/");
    expect(result.ok).toBe(true);
    expect(result.value).toBe("https://example.com");
  });

  it("keeps relay path segments", () => {
    const result = normalizeServerUrl("https://relay.example/r/server-123/");
    expect(result.ok).toBe(true);
    expect(result.value).toBe("https://relay.example/r/server-123");
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
    const params = new URLSearchParams("serverUrl=https://x.test/r/abc&apiKey=mino_sk_123&name=Local");
    const parsed = parseLinkParams(params);

    expect(parsed.serverUrl).toBe("https://x.test/r/abc");
    expect(parsed.apiKey).toBe("mino_sk_123");
    expect(parsed.name).toBe("Local");
  });

  it("parses relay pairing params", () => {
    const params = new URLSearchParams("relayCode=ABCD1234&relayUrl=https://relay.example");
    const parsed = parseLinkParams(params);

    expect(parsed.relayCode).toBe("ABCD1234");
    expect(parsed.relayUrl).toBe("https://relay.example");
  });

  it("strips apiKey from query", () => {
    const params = new URLSearchParams(
      "serverUrl=https://x.test/r/abc&apiKey=mino_sk_123&relayCode=ABCD1234&relayUrl=https://relay.example&name=Local",
    );
    const next = removeSensitiveQueryParams("/link", params);

    expect(next).toContain("serverUrl=");
    expect(next).not.toContain("apiKey=");
    expect(next).not.toContain("relayCode=");
    expect(next).not.toContain("relayUrl=");
  });
});
