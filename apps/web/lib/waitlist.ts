/**
 * Waitlist signup plumbing (Mailspool public API).
 *
 * The browser talks to Mailspool's *public* form endpoint with the project's
 * public key — never with a private key. Tests cover the pure helpers here so
 * the form component stays a thin shell.
 */

import { getMailspoolConfig, type MailspoolConfig } from "./config";
import type { StorageLike } from "./storage";

export const WAITLIST_STORAGE_KEY = "mino.waitlist.v1";

export type WaitlistStatus = "created" | "exists" | "invalid" | "error";

export interface WaitlistSignup {
  email: string;
  firstName?: string;
  useCase?: string;
  /** Where the visitor came from — free-form, kept short. */
  source?: string;
}

export interface WaitlistResult {
  ok: boolean;
  status: WaitlistStatus;
  message?: string;
}

export interface WaitlistRecord {
  email: string;
  joinedAt: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  if (!email || email.length > 254) return false;
  if (email.includes("..")) return false;
  return EMAIL_PATTERN.test(email);
}

/**
 * Describe the traffic source without storing anything sensitive.
 *
 * Prefers UTM parameters (so Search Console / campaign traffic is attributable),
 * falls back to the referring host, then "direct". Never includes a protocol or
 * a query string — a value holding a link is silently dropped by Mailspool's
 * abuse gate and would look like a successful signup that stored nothing.
 */
export function describeWaitlistSource(input: {
  search?: string;
  referrer?: string;
  path?: string;
}): string {
  const search = input.search ?? "";
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );

  const utm = ["utm_source", "utm_medium", "utm_campaign"]
    .map((key) => sanitizeToken(params.get(key) ?? ""))
    .filter(Boolean);

  let origin = "";
  if (utm.length > 0) {
    origin = utm.join("/");
  } else {
    origin = sanitizeToken(hostOf(input.referrer)) || "direct";
  }

  const path = sanitizePath(input.path ?? "/");
  if (!path || path === "/") {
    return origin.slice(0, 120);
  }

  return `${origin} ${path}`.slice(0, 120);
}

function hostOf(value: string | undefined): string {
  if (!value) return "";
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function sanitizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "")
    .slice(0, 60);
}

function sanitizePath(value: string): string {
  const path = (value.split("?")[0] ?? "").split("#")[0]?.trim() ?? "";
  if (!path.startsWith("/")) return "";
  return path.replace(/[^a-zA-Z0-9/_-]+/g, "").slice(0, 80);
}

export function buildWaitlistPayload(
  signup: WaitlistSignup,
  config: MailspoolConfig = getMailspoolConfig(),
): Record<string, string> {
  const payload: Record<string, string> = {
    key: config.publicKey,
    email: normalizeEmail(signup.email),
    // Honeypot: Mailspool silently absorbs anything filled in here.
    company: "",
  };

  const firstName = signup.firstName?.trim();
  if (firstName) payload.first_name = firstName.slice(0, 80);

  const useCase = signup.useCase?.trim();
  if (useCase) payload.use_case = useCase.slice(0, 120);

  const source = signup.source?.trim();
  if (source) payload.source = source.slice(0, 120);

  return payload;
}

export interface SubmitOptions {
  config?: MailspoolConfig;
  fetchImpl?: typeof fetch;
}

export async function submitWaitlistSignup(
  signup: WaitlistSignup,
  options: SubmitOptions = {},
): Promise<WaitlistResult> {
  const config = options.config ?? getMailspoolConfig();
  const doFetch = options.fetchImpl ?? fetch;
  const url = `${config.baseUrl}/api/public/forms/${encodeURIComponent(config.formSlug)}`;

  try {
    const response = await doFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildWaitlistPayload(signup, config)),
    });

    const data = (await response.json().catch(() => null)) as {
      ok?: boolean;
      status?: string;
      error?: string;
      errors?: string[];
    } | null;

    if (data?.ok) {
      const status = data.status === "exists" ? "exists" : "created";
      return { ok: true, status };
    }

    if (data?.status === "exists") {
      return { ok: true, status: "exists" };
    }

    if (data?.status === "invalid") {
      return {
        ok: false,
        status: "invalid",
        message: data.errors?.[0] ?? data.error,
      };
    }

    return {
      ok: false,
      status: "error",
      message: data?.error,
    };
  } catch {
    return { ok: false, status: "error" };
  }
}

function storageOrDefault(storage?: StorageLike | null): StorageLike | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function readWaitlistRecord(
  storage?: StorageLike | null,
): WaitlistRecord | null {
  const target = storageOrDefault(storage);
  if (!target) return null;

  try {
    const raw = target.getItem(WAITLIST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WaitlistRecord>;
    if (typeof parsed?.email !== "string" || !parsed.email) return null;
    return {
      email: parsed.email,
      joinedAt: typeof parsed.joinedAt === "string" ? parsed.joinedAt : "",
    };
  } catch {
    return null;
  }
}

export function rememberWaitlistSignup(
  email: string,
  storage?: StorageLike | null,
): void {
  const target = storageOrDefault(storage);
  if (!target) return;

  try {
    target.setItem(
      WAITLIST_STORAGE_KEY,
      JSON.stringify({
        email: normalizeEmail(email),
        joinedAt: new Date().toISOString(),
      } satisfies WaitlistRecord),
    );
  } catch {
    // A blocked localStorage (private mode) must never break the signup flow.
  }
}
