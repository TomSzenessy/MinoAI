import { beforeEach, describe, expect, it } from "bun:test";
import { __resetRelayStateForTests, relayApp } from "../src/index";

const BASE_HEADERS = {
  "Content-Type": "application/json",
  "X-Forwarded-For": "203.0.113.10",
};

async function registerSession(
  overrides?: Partial<{
    serverId: string;
    relaySecret: string;
    relayPairCode: string;
    adminApiKey: string;
  }>,
): Promise<Response> {
  return relayApp.request("/api/v1/relay/register", {
    method: "POST",
    headers: BASE_HEADERS,
    body: JSON.stringify({
      serverId: overrides?.serverId ?? "server-1",
      relaySecret: overrides?.relaySecret ?? "relay-secret-1",
      relayPairCode: overrides?.relayPairCode ?? "ABCD1234",
      adminApiKey: overrides?.adminApiKey ?? "mino_sk_test_admin_1",
    }),
  });
}

describe("relay security controls", () => {
  beforeEach(() => {
    __resetRelayStateForTests();
  });

  it("blocks relay session takeover attempts with mismatched secrets", async () => {
    const first = await registerSession({
      serverId: "server-takeover",
      relaySecret: "relay-secret-a",
      relayPairCode: "ZXCV1234",
    });
    expect(first.status).toBe(200);

    const second = await registerSession({
      serverId: "server-takeover",
      relaySecret: "relay-secret-b",
      relayPairCode: "ZXCV1234",
    });

    expect(second.status).toBe(401);
    const body = await second.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("throttles repeated invalid pair-code attempts", async () => {
    const registered = await registerSession({
      serverId: "server-pair",
      relaySecret: "relay-secret-pair",
      relayPairCode: "QWER5678",
    });
    expect(registered.status).toBe(200);

    let lastStatus = 0;
    for (let i = 0; i < 13; i += 1) {
      const response = await relayApp.request("/api/v1/pair/exchange", {
        method: "POST",
        headers: {
          ...BASE_HEADERS,
          "X-Forwarded-For": "198.51.100.99",
        },
        body: JSON.stringify({ code: "INVALID0" }),
      });
      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });

  it("rejects oversized proxied payloads", async () => {
    const registered = await registerSession({
      serverId: "server-large-body",
      relaySecret: "relay-secret-large",
      relayPairCode: "MNOP6789",
    });
    expect(registered.status).toBe(200);

    const oversized = "a".repeat(2 * 1024 * 1024 + 1);
    const response = await relayApp.request(
      "/r/server-large-body/api/v1/notes",
      {
        method: "POST",
        headers: {
          ...BASE_HEADERS,
          "Content-Type": "text/plain",
        },
        body: oversized,
      },
    );

    expect(response.status).toBe(413);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });
});
