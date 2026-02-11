import { describe, expect, it } from "bun:test";
import { DEFAULT_CONFIG } from "../src/config/defaults";
import { normalizeRelayUrl } from "../src/config/index";

describe("Config relay URL normalization", () => {
  it("upgrades public relay URLs from http to https", () => {
    expect(normalizeRelayUrl("http://relay.mino.ink")).toBe("https://relay.mino.ink");
  });

  it("keeps local relay URLs on http", () => {
    expect(normalizeRelayUrl("http://127.0.0.1:8787/")).toBe("http://127.0.0.1:8787");
  });

  it("falls back to default relay URL for invalid values", () => {
    expect(normalizeRelayUrl("not-a-url")).toBe(DEFAULT_CONFIG.connection.relayUrl);
  });

  it("normalizes trailing slashes on https relay URLs", () => {
    expect(normalizeRelayUrl("https://relay.mino.ink/")).toBe("https://relay.mino.ink");
  });
});
