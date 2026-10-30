import { describe, expect, it } from "bun:test";
import {
  WAITLIST_STORAGE_KEY,
  buildWaitlistPayload,
  describeWaitlistSource,
  isValidEmail,
  normalizeEmail,
  readWaitlistRecord,
  rememberWaitlistSignup,
  submitWaitlistSignup,
} from "../lib/waitlist";
import type { MailspoolConfig } from "../lib/config";
import type { StorageLike } from "../lib/storage";

const CONFIG: MailspoolConfig = {
  baseUrl: "https://mailspool.example.com",
  formSlug: "mino-waitlist",
  publicKey: "pk_live_test",
};

function createStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe("email validation", () => {
  it("normalizes whitespace and casing", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });

  it("accepts normal addresses", () => {
    expect(isValidEmail("ada@example.com")).toBe(true);
    expect(isValidEmail("ada.lovelace+mino@mail.example.co.uk")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("ada")).toBe(false);
    expect(isValidEmail("ada@example")).toBe(false);
    expect(isValidEmail("ada@@example.com")).toBe(false);
    expect(isValidEmail("ada..lovelace@example.com")).toBe(false);
    expect(isValidEmail("ada @example.com")).toBe(false);
  });
});

describe("describeWaitlistSource", () => {
  it("prefers UTM parameters", () => {
    expect(
      describeWaitlistSource({
        search: "?utm_source=google&utm_medium=organic&utm_campaign=mino-ai",
        referrer: "https://news.ycombinator.com/",
        path: "/ai-notes",
      }),
    ).toBe("google/organic/mino-ai /ai-notes");
  });

  it("falls back to the referring host", () => {
    expect(
      describeWaitlistSource({
        referrer: "https://www.producthunt.com/posts/mino",
        path: "/",
      }),
    ).toBe("producthunt.com");
  });

  it("falls back to direct traffic", () => {
    expect(describeWaitlistSource({ path: "/waitlist" })).toBe(
      "direct /waitlist",
    );
  });

  it("never emits a link, which the public API would silently drop", () => {
    const source = describeWaitlistSource({
      referrer: "https://www.google.com/search?q=mino+ai&hl=en",
      path: "/waitlist?ref=https://spam.example",
    });

    expect(source).not.toContain("http");
    expect(source).not.toContain("?");
    expect(source.length).toBeLessThanOrEqual(120);
  });
});

describe("buildWaitlistPayload", () => {
  it("sends the public key, the normalized email and an empty honeypot", () => {
    const payload = buildWaitlistPayload(
      { email: "  Ada@Example.com " },
      CONFIG,
    );

    expect(payload).toEqual({
      key: "pk_live_test",
      email: "ada@example.com",
      company: "",
    });
  });

  it("includes optional profile fields only when present", () => {
    const payload = buildWaitlistPayload(
      {
        email: "ada@example.com",
        firstName: " Ada ",
        useCase: "Engineering docs & ADRs",
        source: "google/organic /ai-notes",
      },
      CONFIG,
    );

    expect(payload.first_name).toBe("Ada");
    expect(payload.use_case).toBe("Engineering docs & ADRs");
    expect(payload.source).toBe("google/organic /ai-notes");
  });

  it("truncates long values so a paste cannot bloat the submission", () => {
    const payload = buildWaitlistPayload(
      { email: "ada@example.com", source: "x".repeat(400) },
      CONFIG,
    );

    expect(payload.source).toHaveLength(120);
  });
});

describe("submitWaitlistSignup", () => {
  function fakeFetch(response: {
    status?: number;
    body: unknown;
    throwOnJson?: boolean;
  }) {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const impl = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: (response.status ?? 200) < 400,
        status: response.status ?? 200,
        json: async () => {
          if (response.throwOnJson) throw new Error("bad json");
          return response.body;
        },
      } as unknown as Response;
    }) as unknown as typeof fetch;

    return { impl, calls };
  }

  it("posts to the public form endpoint and reports success", async () => {
    const { impl, calls } = fakeFetch({
      body: { ok: true, status: "created" },
    });

    const result = await submitWaitlistSignup(
      { email: "ada@example.com", source: "direct /" },
      { config: CONFIG, fetchImpl: impl },
    );

    expect(result).toEqual({ ok: true, status: "created" });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      "https://mailspool.example.com/api/public/forms/mino-waitlist",
    );
    expect(calls[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init?.body))).toMatchObject({
      key: "pk_live_test",
      email: "ada@example.com",
    });
  });

  it("treats a duplicate address as already joined", async () => {
    const { impl } = fakeFetch({ body: { ok: true, status: "exists" } });

    const result = await submitWaitlistSignup(
      { email: "ada@example.com" },
      { config: CONFIG, fetchImpl: impl },
    );

    expect(result).toEqual({ ok: true, status: "exists" });
  });

  it("surfaces validation errors from the API", async () => {
    const { impl } = fakeFetch({
      status: 400,
      body: { ok: false, status: "invalid", errors: ["Invalid email address"] },
    });

    const result = await submitWaitlistSignup(
      { email: "nope" },
      { config: CONFIG, fetchImpl: impl },
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe("invalid");
    expect(result.message).toBe("Invalid email address");
  });

  it("reports a network failure instead of throwing", async () => {
    const impl = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;

    const result = await submitWaitlistSignup(
      { email: "ada@example.com" },
      { config: CONFIG, fetchImpl: impl },
    );

    expect(result).toEqual({ ok: false, status: "error" });
  });
});

describe("waitlist storage", () => {
  it("round-trips the joined state", () => {
    const storage = createStorage();
    rememberWaitlistSignup("  Ada@Example.com ", storage);

    expect(readWaitlistRecord(storage)).toEqual({
      email: "ada@example.com",
      joinedAt: expect.any(String),
    });
    expect(storage.getItem(WAITLIST_STORAGE_KEY)).toContain("ada@example.com");
  });

  it("ignores corrupt or unset state", () => {
    const storage = createStorage();
    expect(readWaitlistRecord(storage)).toBeNull();

    storage.setItem(WAITLIST_STORAGE_KEY, "not json");
    expect(readWaitlistRecord(storage)).toBeNull();
  });

  it("never throws when storage is blocked", () => {
    const blocked: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => undefined,
    };

    expect(readWaitlistRecord(blocked)).toBeNull();
    expect(() =>
      rememberWaitlistSignup("ada@example.com", blocked),
    ).not.toThrow();
  });
});
