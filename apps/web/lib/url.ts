const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export interface ParsedLinkParams {
  serverUrl?: string;
  apiKey?: string;
  name?: string;
}

export interface UrlValidationResult {
  ok: boolean;
  value?: string;
  reason?: string;
}

function hasProtocol(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(value);
}

export function normalizeServerUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, reason: "Server URL is required." };
  }

  const candidate = hasProtocol(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, reason: "Server URL is invalid." };
  }

  const protocol = parsed.protocol.toLowerCase();
  const isLocalHttp = protocol === "http:" && LOCAL_HOSTS.has(parsed.hostname.toLowerCase());

  if (protocol !== "https:" && !isLocalHttp) {
    return {
      ok: false,
      reason: "Use HTTPS for remote servers. Plain HTTP is only allowed for localhost.",
    };
  }

  parsed.pathname = "";
  parsed.search = "";
  parsed.hash = "";

  const normalized = parsed.toString().replace(/\/$/, "");
  return { ok: true, value: normalized };
}

export function parseLinkParams(searchParams: URLSearchParams): ParsedLinkParams {
  const serverUrl = searchParams.get("serverUrl")?.trim() || undefined;
  const apiKey = searchParams.get("apiKey")?.trim() || undefined;
  const name = searchParams.get("name")?.trim() || undefined;

  return { serverUrl, apiKey, name };
}

export function removeSensitiveQueryParams(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const next = new URLSearchParams(searchParams.toString());
  next.delete("apiKey");

  const query = next.toString();
  if (!query) {
    return pathname;
  }

  return `${pathname}?${query}`;
}
