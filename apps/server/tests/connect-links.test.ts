import { afterEach, describe, expect, it } from "bun:test";
import { buildDirectConnectLinks, buildRelayConnectLinks } from "../src/utils/connect-links";

const ORIGINAL_LOCAL_DEV_UI_ORIGIN = process.env.MINO_LOCAL_DEV_UI_ORIGIN;

afterEach(() => {
  if (ORIGINAL_LOCAL_DEV_UI_ORIGIN === undefined) {
    delete process.env.MINO_LOCAL_DEV_UI_ORIGIN;
  } else {
    process.env.MINO_LOCAL_DEV_UI_ORIGIN = ORIGINAL_LOCAL_DEV_UI_ORIGIN;
  }
});

describe("connect link generation", () => {
  it("generates relay links with default local dev origin", () => {
    delete process.env.MINO_LOCAL_DEV_UI_ORIGIN;

    const params = new URLSearchParams({ relayCode: "ABCD1234", relayUrl: "https://relay.mino.ink" });
    const links = buildRelayConnectLinks(params, "http://localhost:3000");

    expect(links.testMinoInk).toContain("relayCode=ABCD1234");
    expect(links.minoInk).toContain("relayCode=ABCD1234");
    expect(links.localUi).toBe(
      "http://localhost:3000/link?relayCode=ABCD1234&relayUrl=https%3A%2F%2Frelay.mino.ink",
    );
    expect(links.localDevUi).toBe(
      "http://localhost:5173/link?relayCode=ABCD1234&relayUrl=https%3A%2F%2Frelay.mino.ink",
    );
  });

  it("generates direct links with provided local ui base", () => {
    const params = new URLSearchParams({ serverUrl: "http://localhost:3000", apiKey: "mino_sk_test" });
    const links = buildDirectConnectLinks(params, "http://localhost:3000");

    expect(links.localUi).toContain("http://localhost:3000/link?");
    expect(links.localDevUi).toContain("http://localhost:5173/link?");
    expect(links.minoInk).toContain("serverUrl=");
  });

  it("uses MINO_LOCAL_DEV_UI_ORIGIN override when valid", () => {
    process.env.MINO_LOCAL_DEV_UI_ORIGIN = "http://127.0.0.1:4173/";

    const params = new URLSearchParams({ relayCode: "ABCD1234" });
    const links = buildRelayConnectLinks(params, "http://localhost:3000");

    expect(links.localDevUi).toBe("http://127.0.0.1:4173/link?relayCode=ABCD1234");
  });

  it("falls back to default local dev origin when override is invalid", () => {
    process.env.MINO_LOCAL_DEV_UI_ORIGIN = "not-a-url";

    const params = new URLSearchParams({ relayCode: "ABCD1234" });
    const links = buildRelayConnectLinks(params, "http://localhost:3000");

    expect(links.localDevUi).toBe("http://localhost:5173/link?relayCode=ABCD1234");
  });
});
