/**
 * Modular forms.
 *
 * A form is data: a field list, a submit target (a Mailspool public form slug)
 * and a protection tier. One component renders any of them, on our own domain,
 * and nothing ever navigates away to the mail provider.
 *
 * Submission goes to Mailspool's *public* endpoint with the project's public
 * key. That endpoint already enforces, server-side: a `company` honeypot, a
 * bot-like User-Agent gate, a link-in-value gate, a `ms-ts` timing gate,
 * throwaway-address refusal and 10 submissions/minute per IP. The client layers
 * here exist to fail fast and politely, never as the only defence.
 */

import { getMailspoolConfig, type MailspoolConfig } from "./config";
import type { StorageLike } from "./storage";
import { isValidEmail, normalizeEmail } from "./waitlist";

export type FieldType =
  | "text"
  | "email"
  | "longtext"
  | "select"
  | "number"
  | "integer"
  | "boolean"
  | "date";

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: readonly string[];
  maxLength?: number;
  autoComplete?: string;
  /** Rows for `longtext`. */
  rows?: number;
  /** Shown under the field, small. */
  hint?: string;
}

export type ProtectionTier = "standard" | "strict";

export interface FormDefinition {
  /** Mailspool form slug — the submit target. */
  slug: string;
  /** Stable id used for DOM ids and storage keys. */
  id: string;
  fields: readonly FormFieldDefinition[];
  protection: ProtectionTier;
  submitLabel: string;
  submittingLabel?: string;
  successTitle: string;
  successBody: string;
  /** Reject a submit that arrives sooner than this after render. 0 disables. */
  minFillMs?: number;
  /** Attach the traffic-source tag (utm → referrer → path). */
  attributeSource?: boolean;
  /** Remember a successful submit in localStorage, per form id. */
  remember?: boolean;
}

export interface FormResult {
  ok: boolean;
  status: "created" | "exists" | "invalid" | "error" | "blocked" | "too-fast";
  message?: string;
}

/**
 * Domains that only exist to receive one email. Mailspool refuses most of these
 * server-side; checking here turns a server rejection into a clear message
 * before the visitor types a paragraph of complaint.
 */
export const DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "33mail.com",
  "anonbox.net",
  "burnermail.io",
  "discard.email",
  "dispostable.com",
  "dropmail.me",
  "emailondeck.com",
  "fakeinbox.com",
  "getairmail.com",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "inboxkitten.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mintemail.com",
  "moakt.com",
  "sharklasers.com",
  "spam4.me",
  "temp-mail.org",
  "tempail.com",
  "tempmail.com",
  "tempmail.net",
  "tempr.email",
  "throwawaymail.com",
  "trashmail.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = normalizeEmail(email).split("@")[1] ?? "";
  if (!domain) return false;

  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  // Subdomains of a throwaway provider (mail.mailinator.com) count too.
  return [...DISPOSABLE_DOMAINS].some((known) => domain.endsWith(`.${known}`));
}

export function emptyValues(
  definition: FormDefinition,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of definition.fields) {
    values[field.key] = "";
  }
  return values;
}

/**
 * Validate a whole submission, returning the first error per field (or a form
 * level key of `_form`).
 */
export function validateSubmission(
  definition: FormDefinition,
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of definition.fields) {
    const raw = values[field.key] ?? "";
    const value = raw.trim();

    if (field.required && !value) {
      errors[field.key] = `${field.label} is required.`;
      continue;
    }
    if (!value) continue;

    if (field.type === "email" && !isValidEmail(value)) {
      errors[field.key] = "That email address looks incomplete.";
      continue;
    }
    if (field.type === "email" && isDisposableEmail(value)) {
      errors[field.key] = "Use an address that reaches you for more than ten minutes.";
      continue;
    }
    if (
      (field.type === "number" || field.type === "integer") &&
      !Number.isFinite(Number(value))
    ) {
      errors[field.key] = `${field.label} must be a number.`;
      continue;
    }
    if (field.type === "select") {
      const options = field.options ?? [];
      if (options.length > 0 && !options.includes(value)) {
        errors[field.key] = `Choose one of the listed options.`;
        continue;
      }
    }
  }

  if (errors[Object.keys(errors)[0] ?? ""] && !errors._form) {
    errors._form = "Check the highlighted fields.";
  }

  return errors;
}

export interface BuildPayloadOptions {
  config?: MailspoolConfig;
  /** Traffic attribution, when the definition opts in. */
  source?: string;
  /** Value of the honeypot input; anything non-empty means "do not send". */
  company?: string;
  /** Render timestamp in unix seconds; enabling Mailspool's timing gate. */
  renderedAt?: number;
}

export function buildFormPayload(
  definition: FormDefinition,
  values: Record<string, string>,
  options: BuildPayloadOptions = {},
): Record<string, string> {
  const config = options.config ?? getMailspoolConfig();
  const payload: Record<string, string> = {
    key: config.publicKey,
    company: options.company ?? "",
  };

  for (const field of definition.fields) {
    const value = (values[field.key] ?? "").trim();
    if (!value) continue;
    payload[field.key] =
      field.type === "email" ? normalizeEmail(value) : value.slice(0, field.maxLength ?? 4000);
  }

  if (definition.attributeSource && options.source) {
    payload.source = options.source.slice(0, 120);
  }

  if (options.renderedAt) {
    payload["ms-ts"] = String(options.renderedAt);
  }

  return payload;
}

export interface SubmitFormOptions {
  config?: MailspoolConfig;
  fetchImpl?: typeof fetch;
  source?: string;
  company?: string;
  renderedAt?: number;
  /** Unix ms when the form was rendered, for the local speed check. */
  renderedAtMs?: number;
  now?: number;
}

export async function submitForm(
  definition: FormDefinition,
  values: Record<string, string>,
  options: SubmitFormOptions = {},
): Promise<FormResult> {
  // Honeypot: a real visitor never sees the field, so a filled one is a bot.
  // Answer as if it worked, and store nothing.
  if (options.company) {
    return { ok: true, status: "created" };
  }

  if (definition.minFillMs && definition.minFillMs > 0) {
    const startedAt = options.renderedAtMs ?? 0;
    const now = options.now ?? Date.now();
    if (startedAt > 0 && now - startedAt < definition.minFillMs) {
      return {
        ok: false,
        status: "too-fast",
        message: "That was quick — give it a second and submit again.",
      };
    }
  }

  const errors = validateSubmission(definition, values);
  if (Object.keys(errors).length > 0) {
    return { ok: false, status: "invalid", message: errors[Object.keys(errors)[0] ?? ""] };
  }

  const config = options.config ?? getMailspoolConfig();

  try {
    const response = await (options.fetchImpl ?? fetch)(
      `${config.baseUrl}/api/public/forms/${encodeURIComponent(definition.slug)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildFormPayload(definition, values, {
            config,
            source: options.source,
            company: options.company,
            renderedAt: options.renderedAt,
          }),
        ),
      },
    );

    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; status?: string; error?: string; errors?: string[] }
      | null;

    if (data?.ok) {
      return { ok: true, status: data.status === "exists" ? "exists" : "created" };
    }

    if (data?.status === "invalid") {
      return { ok: false, status: "invalid", message: data.errors?.[0] ?? data.error };
    }

    return { ok: false, status: "error", message: data?.error };
  } catch {
    return { ok: false, status: "error" };
  }
}

// ---------------------------------------------------------------------------
// Form definitions
// ---------------------------------------------------------------------------

export const COMPLAINT_FORM: FormDefinition = {
  id: "complaint",
  slug: "mino-complaints-and-problem-reports",
  protection: "standard",
  submitLabel: "Send report",
  submittingLabel: "Sending…",
  successTitle: "Report received.",
  successBody:
    "It is stored and will be read. If you left an email address, the reply goes there.",
  minFillMs: 3000,
  fields: [
    {
      key: "email",
      label: "Email, so we can reply",
      type: "email",
      required: true,
      placeholder: "you@example.com",
      autoComplete: "email",
    },
    {
      key: "name",
      label: "Your name",
      type: "text",
      placeholder: "Ada Lovelace",
      maxLength: 80,
      autoComplete: "name",
    },
    {
      key: "category",
      label: "What kind of problem is it?",
      type: "select",
      required: true,
      options: [
        "Data loss or corruption",
        "Bug or crash",
        "Sync or connection",
        "Privacy or security",
        "Documentation",
        "Something else",
      ],
    },
    {
      key: "severity",
      label: "How much does it block you?",
      type: "select",
      options: [
        "Blocks me completely",
        "Loses data",
        "Annoying but usable",
        "Minor",
      ],
    },
    {
      key: "context",
      label: "Version and platform (optional)",
      type: "text",
      placeholder: "0.1.0, Docker on Linux, Firefox",
      maxLength: 160,
    },
    {
      key: "message",
      label: "What happened?",
      type: "longtext",
      required: true,
      rows: 7,
      maxLength: 5000,
      placeholder: "What you did, what you expected, what happened instead.",
    },
  ],
};

export const FORM_DEFINITIONS: Record<string, FormDefinition> = {
  [COMPLAINT_FORM.id]: COMPLAINT_FORM,
};

// ---------------------------------------------------------------------------
// Remembered state (so a returning visitor sees the receipt, not the form)
// ---------------------------------------------------------------------------

export function formStorageKey(definition: FormDefinition): string {
  return `mino.form.${definition.id}.v1`;
}

export function readFormReceipt(
  definition: FormDefinition,
  storage?: StorageLike | null,
): { email: string; at: string } | null {
  const target = storage ?? (typeof window === "undefined" ? null : window.localStorage);
  if (!target) return null;
  try {
    const raw = target.getItem(formStorageKey(definition));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string; at?: string };
    if (typeof parsed?.email !== "string") return null;
    return { email: parsed.email, at: parsed.at ?? "" };
  } catch {
    return null;
  }
}

export function writeFormReceipt(
  definition: FormDefinition,
  email: string,
  storage?: StorageLike | null,
): void {
  const target = storage ?? (typeof window === "undefined" ? null : window.localStorage);
  if (!target) return;
  try {
    target.setItem(
      formStorageKey(definition),
      JSON.stringify({ email: normalizeEmail(email), at: new Date().toISOString() }),
    );
  } catch {
    // Private mode: a blocked storage must not break submission.
  }
}
