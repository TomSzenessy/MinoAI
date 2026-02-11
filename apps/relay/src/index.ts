/**
 * Mino Relay — Managed request relay for private user servers.
 *
 * Server-side connector (from user server):
 *   POST /api/v1/relay/register
 *   POST /api/v1/relay/pull
 *   POST /api/v1/relay/respond
 *
 * Frontend-side:
 *   POST /api/v1/pair/exchange
 *   /r/:serverId/* proxy routes
 */

import { Hono } from "hono";

interface RelaySession {
  serverId: string;
  relaySecret: string;
  relayPairCode: string;
  adminApiKey: string;
  connectedAt: number;
  lastSeenAt: number;
}

interface RelayProxyRequest {
  requestId: string;
  method: string;
  path: string;
  query: string;
  headers: Record<string, string>;
  bodyBase64?: string;
}

interface RelayProxyResponse {
  status: number;
  headers: Record<string, string>;
  bodyBase64: string;
}

interface PendingResponse {
  resolve: (response: RelayProxyResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const sessions = new Map<string, RelaySession>();
const queues = new Map<string, RelayProxyRequest[]>();
const pendingResponses = new Map<string, PendingResponse>();
const pullWaiters = new Map<string, Array<(request: RelayProxyRequest | null) => void>>();

const PULL_WAIT_MS_DEFAULT = 20000;
const PROXY_TIMEOUT_MS = 30000;
const SESSION_STALE_MS = 120000;

function log(message: string, data?: unknown): void {
  const payload = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[relay] ${message}${payload}`);
}

function publicBaseUrl(reqUrl: string): string {
  const configured = process.env.RELAY_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const url = new URL(reqUrl);
  return `${url.protocol}//${url.host}`;
}

function decodeBase64(value?: string): Uint8Array | undefined {
  if (!value) {
    return undefined;
  }
  return new Uint8Array(Buffer.from(value, "base64"));
}

function encodeBase64(buffer: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(buffer)).toString("base64");
}

function nowMs(): number {
  return Date.now();
}

function getSession(serverId: string): RelaySession | null {
  return sessions.get(serverId) ?? null;
}

function assertSession(serverId: string, relaySecret: string): RelaySession {
  const session = getSession(serverId);
  if (!session || session.relaySecret !== relaySecret) {
    throw new Error("UNAUTHORIZED_SESSION");
  }
  session.lastSeenAt = nowMs();
  return session;
}

function queueFor(serverId: string): RelayProxyRequest[] {
  const existing = queues.get(serverId);
  if (existing) {
    return existing;
  }
  const created: RelayProxyRequest[] = [];
  queues.set(serverId, created);
  return created;
}

function resolvePullWaiter(serverId: string, request: RelayProxyRequest): boolean {
  const waiters = pullWaiters.get(serverId);
  if (!waiters || waiters.length === 0) {
    return false;
  }

  const resolve = waiters.shift();
  if (resolve) {
    resolve(request);
    return true;
  }

  return false;
}

function enqueueRequest(serverId: string, request: RelayProxyRequest): void {
  if (resolvePullWaiter(serverId, request)) {
    return;
  }
  queueFor(serverId).push(request);
}

function dequeueRequest(serverId: string): RelayProxyRequest | null {
  const queue = queueFor(serverId);
  if (queue.length === 0) {
    return null;
  }
  return queue.shift() ?? null;
}

async function waitForRequest(serverId: string, waitMs: number): Promise<RelayProxyRequest | null> {
  const immediate = dequeueRequest(serverId);
  if (immediate) {
    return immediate;
  }

  return new Promise((resolve) => {
    const waiters = pullWaiters.get(serverId) ?? [];
    waiters.push(resolve);
    pullWaiters.set(serverId, waiters);

    setTimeout(() => {
      const nextWaiters = pullWaiters.get(serverId);
      if (!nextWaiters) {
        return;
      }
      const index = nextWaiters.indexOf(resolve);
      if (index >= 0) {
        nextWaiters.splice(index, 1);
      }
      resolve(null);
    }, waitMs);
  });
}

function parseRequestHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    result[key] = value;
  }
  return result;
}

function sanitizeResponseHeaders(headers: Record<string, string>): Headers {
  const result = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (lower === "content-length" || lower === "transfer-encoding" || lower === "connection") {
      continue;
    }
    result.set(key, value);
  }
  return result;
}

function cleanupStaleSessions(): void {
  const cutoff = nowMs() - SESSION_STALE_MS;
  for (const [serverId, session] of sessions.entries()) {
    if (session.lastSeenAt >= cutoff) {
      continue;
    }
    sessions.delete(serverId);
    queues.delete(serverId);
    pullWaiters.delete(serverId);
    log("Session expired", { serverId });
  }
}

setInterval(cleanupStaleSessions, 30000);

const app = new Hono();

app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Mino-Key");
  c.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }

  await next();
});

app.get("/api/v1/health", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",
      connectedServers: sessions.size,
      pendingRequests: Array.from(queues.values()).reduce((sum, queue) => sum + queue.length, 0),
    },
  });
});

app.post("/api/v1/relay/register", async (c) => {
  const body = await c.req.json() as {
    serverId?: string;
    relaySecret?: string;
    relayPairCode?: string;
    adminApiKey?: string;
  };

  if (!body.serverId || !body.relaySecret || !body.relayPairCode || !body.adminApiKey) {
    return c.json({
      success: false,
      error: { code: "BAD_REQUEST", message: "Missing required relay registration fields." },
    }, 400);
  }

  const existing = sessions.get(body.serverId);
  const timestamp = nowMs();

  sessions.set(body.serverId, {
    serverId: body.serverId,
    relaySecret: body.relaySecret,
    relayPairCode: body.relayPairCode,
    adminApiKey: body.adminApiKey,
    connectedAt: existing?.connectedAt ?? timestamp,
    lastSeenAt: timestamp,
  });

  return c.json({
    success: true,
    data: {
      serverId: body.serverId,
      relayBaseUrl: publicBaseUrl(c.req.url),
      connectedAt: new Date(existing?.connectedAt ?? timestamp).toISOString(),
    },
  });
});

app.post("/api/v1/relay/pull", async (c) => {
  const body = await c.req.json() as {
    serverId?: string;
    relaySecret?: string;
    waitMs?: number;
  };

  if (!body.serverId || !body.relaySecret) {
    return c.json({
      success: false,
      error: { code: "BAD_REQUEST", message: "Missing serverId or relaySecret." },
    }, 400);
  }

  try {
    assertSession(body.serverId, body.relaySecret);
  } catch {
    return c.json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Relay session not authorized." },
    }, 401);
  }

  const waitMs = Math.min(Math.max(body.waitMs ?? PULL_WAIT_MS_DEFAULT, 500), 30000);
  const request = await waitForRequest(body.serverId, waitMs);

  if (!request) {
    return c.body(null, 204);
  }

  return c.json({
    success: true,
    data: { request },
  });
});

app.post("/api/v1/relay/respond", async (c) => {
  const body = await c.req.json() as {
    serverId?: string;
    relaySecret?: string;
    requestId?: string;
    response?: RelayProxyResponse;
  };

  if (!body.serverId || !body.relaySecret || !body.requestId || !body.response) {
    return c.json({
      success: false,
      error: { code: "BAD_REQUEST", message: "Missing relay response payload." },
    }, 400);
  }

  try {
    assertSession(body.serverId, body.relaySecret);
  } catch {
    return c.json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Relay session not authorized." },
    }, 401);
  }

  const pending = pendingResponses.get(body.requestId);
  if (!pending) {
    return c.json({
      success: false,
      error: { code: "NOT_FOUND", message: "Pending request not found." },
    }, 404);
  }

  clearTimeout(pending.timer);
  pendingResponses.delete(body.requestId);
  pending.resolve(body.response);

  return c.json({
    success: true,
    data: { acknowledged: true },
  });
});

app.post("/api/v1/pair/exchange", async (c) => {
  const body = await c.req.json() as { code?: string };
  const code = body.code?.trim();

  if (!code) {
    return c.json({
      success: false,
      error: { code: "BAD_REQUEST", message: "Pairing code is required." },
    }, 400);
  }

  const session = Array.from(sessions.values()).find((entry) => entry.relayPairCode === code);
  if (!session) {
    return c.json({
      success: false,
      error: { code: "NOT_FOUND", message: "Pairing code not found or expired." },
    }, 404);
  }

  const baseUrl = publicBaseUrl(c.req.url);
  return c.json({
    success: true,
    data: {
      serverId: session.serverId,
      serverUrl: `${baseUrl}/r/${session.serverId}`,
      apiKey: session.adminApiKey,
      connected: true,
    },
  });
});

app.all("/r/:serverId/*", async (c) => {
  const serverId = c.req.param("serverId");
  const session = getSession(serverId);

  if (!session) {
    return c.json({
      success: false,
      error: { code: "SERVER_OFFLINE", message: "Server is not connected to relay." },
    }, 503);
  }

  const requestId = crypto.randomUUID();
  const url = new URL(c.req.url);
  const prefix = `/r/${serverId}`;
  const path = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) || "/" : "/";
  const body = await c.req.arrayBuffer();

  const relayRequest: RelayProxyRequest = {
    requestId,
    method: c.req.method,
    path,
    query: url.searchParams.toString(),
    headers: parseRequestHeaders(c.req.raw.headers),
    bodyBase64: body.byteLength > 0 ? encodeBase64(body) : undefined,
  };

  enqueueRequest(serverId, relayRequest);

  const proxied = await new Promise<RelayProxyResponse>((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingResponses.delete(requestId);
      reject(new Error("Relay request timed out."));
    }, PROXY_TIMEOUT_MS);

    pendingResponses.set(requestId, { resolve, reject, timer });
  }).catch((error) => {
    return {
      status: 504,
      headers: { "content-type": "application/json" },
      bodyBase64: Buffer.from(
        JSON.stringify({
          success: false,
          error: {
            code: "RELAY_TIMEOUT",
            message: error instanceof Error ? error.message : "Relay timed out.",
          },
        }),
      ).toString("base64"),
    } as RelayProxyResponse;
  });

  const responseHeaders = sanitizeResponseHeaders(proxied.headers);
  const responseBody = decodeBase64(proxied.bodyBase64) ?? new Uint8Array();
  return new Response(responseBody, {
    status: proxied.status,
    headers: responseHeaders,
  });
});

const port = parseInt(process.env.RELAY_PORT ?? "8787", 10);
const host = process.env.RELAY_HOST ?? "0.0.0.0";

log("Starting relay", { host, port });

Bun.serve({
  port,
  hostname: host,
  fetch: app.fetch,
});
