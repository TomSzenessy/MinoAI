import { describe, expect, it } from "bun:test";
import {
  COMPLAINT_FORM,
  FORM_DEFINITIONS,
  buildFormPayload,
  emptyValues,
  formStorageKey,
  isDisposableEmail,
  readFormReceipt,
  submitForm,
  validateSubmission,
  writeFormReceipt,
} from "../lib/forms";
import type { FormDefinition } from "../lib/forms";
import type { MailspoolConfig } from "../lib/config";
import type { StorageLike } from "../lib/storage";

const CONFIG: MailspoolConfig = {
  baseUrl: "https://mail.example.com",
  formSlug: "complaint",
  publicKey: "pk_live_test",
};

function storage(): StorageLike {
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

function fakeFetch(body: unknown, status = 200) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const impl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return {
      ok: status < 400,
      status,
      json: async () => body,
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe("disposable domains", () => {
  it("flags a throwaway provider, including subdomains", () => {
    expect(isDisposableEmail("a@mailinator.com")).toBe(true);
    expect(isDisposableEmail("a@mail.mailinator.com")).toBe(true);
    expect(isDisposableEmail("a@yopmail.com")).toBe(true);
  });

  it("allows normal addresses", () => {
    expect(isDisposableEmail("tom@szenessy.de")).toBe(false);
    expect(isDisposableEmail("ada@example.com")).toBe(false);
    expect(isDisposableEmail("not-an-email")).toBe(false);
  });
});

describe("validateSubmission", () => {
  it("accepts a complete complaint", () => {
    const errors = validateSubmission(COMPLAINT_FORM, {
      email: "tom@szenessy.de",
      category: "Bug or crash",
      message: "The editor ate my note.",
    });
    expect(errors).toEqual({});
  });

  it("requires the required fields", () => {
    const errors = validateSubmission(COMPLAINT_FORM, emptyValues(COMPLAINT_FORM));
    expect(errors.email).toBeDefined();
    expect(errors.category).toBeDefined();
    expect(errors.message).toBeDefined();
    expect(errors._form).toBeDefined();
  });

  it("rejects a malformed email and a throwaway address", () => {
    const base = {
      category: "Bug or crash",
      message: "x",
    };
    expect(validateSubmission(COMPLAINT_FORM, { ...base, email: "nope" }).email).toBeDefined();
    expect(
      validateSubmission(COMPLAINT_FORM, { ...base, email: "a@mailinator.com" }).email,
    ).toContain("ten minutes");
  });

  it("rejects an option that is not in the select", () => {
    const errors = validateSubmission(COMPLAINT_FORM, {
      email: "tom@szenessy.de",
      category: "Something invented",
      message: "x",
    });
    expect(errors.category).toBeDefined();
  });
});

describe("buildFormPayload", () => {
  it("sends the public key, the honeypot and the filled fields only", () => {
    const payload = buildFormPayload(
      COMPLAINT_FORM,
      {
        email: "  Tom@Szenessy.DE ",
        name: "",
        category: "Bug or crash",
        severity: "",
        context: "",
        message: "  It broke.  ",
      },
      { config: CONFIG, company: "" },
    );

    expect(payload).toEqual({
      key: "pk_live_test",
      company: "",
      email: "tom@szenessy.de",
      category: "Bug or crash",
      message: "It broke.",
    });
  });

  it("adds ms-ts only when a render stamp is given", () => {
    const values = { email: "tom@szenessy.de", category: "Bug or crash", message: "x" };
    expect(buildFormPayload(COMPLAINT_FORM, values, { config: CONFIG })["ms-ts"]).toBeUndefined();
    expect(
      buildFormPayload(COMPLAINT_FORM, values, { config: CONFIG, renderedAt: 1_800_000_000 })[
        "ms-ts"
      ],
    ).toBe("1800000000");
  });
});

describe("submitForm", () => {
  const values = {
    email: "tom@szenessy.de",
    category: "Bug or crash",
    message: "It broke.",
  };

  it("posts to the public form endpoint", async () => {
    const { impl, calls } = fakeFetch({ ok: true, status: "created" });
    const result = await submitForm(COMPLAINT_FORM, values, {
      config: CONFIG,
      fetchImpl: impl,
      renderedAtMs: Date.now() - 10_000,
    });

    expect(result).toEqual({ ok: true, status: "created" });
    expect(calls[0]?.url).toBe(
      "https://mail.example.com/api/public/forms/mino-complaints-and-problem-reports",
    );
    expect(JSON.parse(String(calls[0]?.init?.body))).toMatchObject({
      key: "pk_live_test",
      email: "tom@szenessy.de",
    });
  });

  it("absorbs a filled honeypot without calling the network", async () => {
    const { impl, calls } = fakeFetch({ ok: true });
    const result = await submitForm(COMPLAINT_FORM, values, {
      config: CONFIG,
      fetchImpl: impl,
      company: "i-am-a-bot",
    });

    expect(result).toEqual({ ok: true, status: "created" });
    expect(calls).toHaveLength(0);
  });

  it("refuses a submission faster than minFillMs", async () => {
    const { impl, calls } = fakeFetch({ ok: true });
    const result = await submitForm(COMPLAINT_FORM, values, {
      config: CONFIG,
      fetchImpl: impl,
      renderedAtMs: 1_000,
      now: 1_500,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("too-fast");
    expect(calls).toHaveLength(0);
  });

  it("validates before the network", async () => {
    const { impl, calls } = fakeFetch({ ok: true });
    const result = await submitForm(COMPLAINT_FORM, { email: "", category: "", message: "" }, {
      config: CONFIG,
      fetchImpl: impl,
      renderedAtMs: Date.now() - 10_000,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("invalid");
    expect(calls).toHaveLength(0);
  });

  it("surfaces an API validation error", async () => {
    const { impl } = fakeFetch(
      { ok: false, status: "invalid", errors: ["That address is refused."] },
      400,
    );
    const result = await submitForm(COMPLAINT_FORM, values, {
      config: CONFIG,
      fetchImpl: impl,
      renderedAtMs: Date.now() - 10_000,
    });

    expect(result.status).toBe("invalid");
    expect(result.message).toBe("That address is refused.");
  });
});

describe("receipts", () => {
  const definition: FormDefinition = { ...COMPLAINT_FORM, id: "receipt-test", remember: true };

  it("round-trips a receipt", () => {
    const store = storage();
    writeFormReceipt(definition, " Tom@Szenessy.de ", store);
    expect(readFormReceipt(definition, store)).toEqual({
      email: "tom@szenessy.de",
      at: expect.any(String),
    });
    expect(formStorageKey(definition)).toContain("receipt-test");
  });

  it("ignores absent or corrupt receipts", () => {
    const store = storage();
    expect(readFormReceipt(definition, store)).toBeNull();
    store.setItem(formStorageKey(definition), "not json");
    expect(readFormReceipt(definition, store)).toBeNull();
  });
});

describe("registry", () => {
  it("exposes the complaint form", () => {
    expect(FORM_DEFINITIONS.complaint).toBe(COMPLAINT_FORM);
    expect(COMPLAINT_FORM.slug).not.toContain("http");
  });
});
