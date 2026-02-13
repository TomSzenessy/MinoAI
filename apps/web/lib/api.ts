import { apiLimiter } from "@/lib/rate-limit";

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

export interface Note extends NoteSummary {
  content: string;
  frontmatter: Record<string, unknown>;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  enabled: boolean;
}

export interface TreeItem {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: TreeItem[];
  itemCount?: number;
}

function sanitizeMessage(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }

  // Prevent reflecting markup from remote error payloads.
  return value.replace(/[<>]/g, "").slice(0, 280);
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJson<T>(
  serverUrl: string,
  path: string,
  init: RequestInit,
  timeoutMs = 10000,
): Promise<T> {
  if (!apiLimiter.tryConsume()) {
    throw new ApiRequestError(429, "RATE_LIMITED", "Too many requests. Please try again shortly.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (serverUrl.startsWith("local://")) {
    console.warn("Bypassing fetch for local mode:", serverUrl);
    // Return empty but successful responses for local mode to prevent UI crashes
    return { success: true, data: {} } as unknown as T;
  }

  try {
    const response = await fetch(`${serverUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });

    const body = await parseJsonSafe(response);

    if (!response.ok) {
      const errorCode =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error?: unknown }).error === "object" &&
        (body as { error: { code?: unknown } }).error
          ? sanitizeMessage((body as { error: { code?: unknown } }).error.code, "REQUEST_FAILED")
          : "REQUEST_FAILED";

      const errorMessage =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error?: unknown }).error === "object" &&
        (body as { error: { message?: unknown } }).error
          ? sanitizeMessage(
              (body as { error: { message?: unknown } }).error.message,
              `Request failed (${response.status}).`,
            )
          : `Request failed (${response.status}).`;

      throw new ApiRequestError(response.status, errorCode, errorMessage);
    }

    if (!body) {
      throw new ApiRequestError(response.status, "INVALID_RESPONSE", "Server returned a non-JSON response.");
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

export async function fetchNoteDetail(
  serverUrl: string,
  apiKey: string,
  path: string,
): Promise<Note> {
  const response = await requestJson<{ success: true; data: Note }>(
    serverUrl,
    `/api/v1/notes/${encodeURIComponent(path)}`,
    {
      method: "GET",
      headers: authHeaders(apiKey),
    },
  );

  return response.data;
}

export async function createNote(
  serverUrl: string,
  apiKey: string,
  path: string,
  content: string,
): Promise<Note> {
  const response = await requestJson<{ success: true; data: Note }>(
    serverUrl,
    "/api/v1/notes",
    {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify({ path, content }),
    },
  );

  return response.data;
}

export async function updateNote(
  serverUrl: string,
  apiKey: string,
  path: string,
  content: string,
): Promise<Note> {
  const response = await requestJson<{ success: true; data: Note }>(
    serverUrl,
    `/api/v1/notes/${encodeURIComponent(path)}`,
    {
      method: "PUT",
      headers: authHeaders(apiKey),
      body: JSON.stringify({ content }),
    },
  );

  return response.data;
}

export async function deleteNote(
  serverUrl: string,
  apiKey: string,
  path: string,
): Promise<void> {
  await requestJson<{ success: true }>(
    serverUrl,
    `/api/v1/notes/${encodeURIComponent(path)}`,
    {
      method: "DELETE",
      headers: authHeaders(apiKey),
    },
  );
}

export async function fetchFileTree(
  serverUrl: string,
  apiKey: string,
): Promise<TreeItem[]> {
  const response = await requestJson<{ success: true; data: TreeItem[] }>(
    serverUrl,
    "/api/v1/folders/tree",
    {
      method: "GET",
      headers: authHeaders(apiKey),
    },
  );

  return response.data;
}

export async function fetchPlugins(
  serverUrl: string,
  apiKey: string,
): Promise<PluginManifest[]> {
  const response = await requestJson<{ success: true; data: PluginManifest[] }>(
    serverUrl,
    "/api/v1/plugins",
    {
      method: "GET",
      headers: authHeaders(apiKey),
    },
  );

  return response.data;
}

export async function togglePluginOnServer(
  serverUrl: string,
  apiKey: string,
  id: string,
  enabled: boolean,
): Promise<PluginManifest> {
  const response = await requestJson<{ success: true; data: PluginManifest }>(
    serverUrl,
    `/api/v1/plugins/${id}/toggle`,
    {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify({ enabled }),
    },
  );

  return response.data;
}
