export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export interface VerifyPayload {
  valid: boolean;
  serverId: string;
  setupComplete: boolean;
}

export interface LinkPayload {
  serverId: string;
  setupComplete: boolean;
  message: string;
}

export interface HealthPayload {
  status: string;
  version: string;
  uptimeSeconds: number;
  noteCount: number;
  lastIndexedAt: string | null;
}

export interface NoteSummary {
  path: string;
  title: string;
  tags: string[];
  wordCount: number;
  updatedAt: string;
}

async function requestJson<T>(
  serverUrl: string,
  path: string,
  init: RequestInit,
  timeoutMs = 10000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${serverUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await response.json() : null;

    if (!response.ok) {
      const code = body?.error?.code || "REQUEST_FAILED";
      const message = body?.error?.message || `Request failed (${response.status})`;
      throw new ApiRequestError(response.status, code, message);
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiRequestError(408, "TIMEOUT", "Request timed out.");
    }

    throw new ApiRequestError(0, "NETWORK_ERROR", "Network request failed.");
  } finally {
    clearTimeout(timeout);
  }
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Mino-Key": apiKey,
  };
}

export async function verifyServer(
  serverUrl: string,
  apiKey: string,
): Promise<VerifyPayload> {
  const response = await requestJson<{ success: true; data: VerifyPayload }>(
    serverUrl,
    "/api/v1/auth/verify",
    {
      method: "POST",
      headers: authHeaders(apiKey),
    },
  );

  return response.data;
}

export async function linkServer(
  serverUrl: string,
  apiKey: string,
): Promise<LinkPayload> {
  const response = await requestJson<{ success: true; data: LinkPayload }>(
    serverUrl,
    "/api/v1/auth/link",
    {
      method: "POST",
      headers: authHeaders(apiKey),
    },
  );

  return response.data;
}

export async function fetchHealth(
  serverUrl: string,
  apiKey: string,
): Promise<HealthPayload> {
  const response = await requestJson<{ success: true; data: HealthPayload }>(
    serverUrl,
    "/api/v1/health",
    {
      method: "GET",
      headers: authHeaders(apiKey),
    },
  );

  return response.data;
}

export async function fetchNotes(
  serverUrl: string,
  apiKey: string,
): Promise<NoteSummary[]> {
  const response = await requestJson<{ success: true; data: NoteSummary[] }>(
    serverUrl,
    "/api/v1/notes",
    {
      method: "GET",
      headers: authHeaders(apiKey),
    },
  );

  return response.data;
}
