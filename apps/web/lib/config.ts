export type AppEnv = "development" | "test" | "production";

export interface MailspoolConfig {
  /** Public API host. No secret is ever shipped to the browser. */
  baseUrl: string;
  /** Slug of the early-access form on Mailspool. */
  formSlug: string;
  /** Mailspool *public* key — safe to ship, it only allows creating submissions. */
  publicKey: string;
}

export interface WebConfig {
  appEnv: AppEnv;
  appOrigin: string;
  defaultLinkTarget: string;
  relayUrl: string;
  mailspool: MailspoolConfig;
}

const DEFAULT_MAILSPOOL: MailspoolConfig = {
  baseUrl: "https://mailspool.szenessy.com",
  formSlug: "mino-early-access-waitlist",
  publicKey: "pk_live_DnAu3BtVDmGnqzFsgUMxb2hIlpX8wcOPsqWptCDeSiU",
};

function normalizeEnv(value: string | undefined): AppEnv {
  if (value === "test" || value === "production") {
    return value;
  }
  return "development";
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getMailspoolConfig(
  env: Record<string, string | undefined> = process.env,
): MailspoolConfig {
  return {
    baseUrl: trimTrailingSlash(
      env.NEXT_PUBLIC_MAILSPOOL_BASE_URL || DEFAULT_MAILSPOOL.baseUrl,
    ),
    formSlug: env.NEXT_PUBLIC_MAILSPOOL_FORM_SLUG || DEFAULT_MAILSPOOL.formSlug,
    publicKey:
      env.NEXT_PUBLIC_MAILSPOOL_PUBLIC_KEY || DEFAULT_MAILSPOOL.publicKey,
  };
}

export function getWebConfig(): WebConfig {
  const appEnv = normalizeEnv(process.env.NEXT_PUBLIC_APP_ENV);
  const appOrigin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:5173";
  const defaultLinkTarget =
    process.env.NEXT_PUBLIC_DEFAULT_LINK_TARGET ??
    (appEnv === "production" ? "https://mino.ink" : "https://test.mino.ink");
  const relayUrl =
    process.env.NEXT_PUBLIC_RELAY_URL ?? "https://relay.mino.ink";

  return {
    appEnv,
    appOrigin,
    defaultLinkTarget,
    relayUrl,
    mailspool: getMailspoolConfig(),
  };
}
