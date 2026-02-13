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

import { timingSafeEqual } from "node:crypto";
import { Hono, type Context } from "hono";

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

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface PairFailureState {
  failures: number;
  blockedUntil: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

type ParsedJsonBody<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

const sessions = new Map<string, RelaySession>();
const queues = new Map<string, RelayProxyRequest[]>();
const pendingResponses = new Map<string, PendingResponse>();
const pullWaiters = new Map<string, Array<(request: RelayProxyRequest | null) => void>>();

const rateBuckets = new Map<string, RateLimitBucket>();
const pairFailuresByIp = new Map<string, PairFailureState>();

const PULL_WAIT_MS_DEFAULT = envInt("RELAY_PULL_WAIT_MS_DEFAULT", 20_000, 500, 60_000);
const PROXY_TIMEOUT_MS = envInt("RELAY_PROXY_TIMEOUT_MS", 30_000, 1_000, 120_000);
const SESSION_STALE_MS = envInt("RELAY_SESSION_STALE_MS", 120_000, 10_000, 3_600_000);
const JSON_BODY_MAX_BYTES = envInt("RELAY_JSON_MAX_BYTES", 64 * 1024, 1_024, 2 * 1024 * 1024);
const PROXY_BODY_MAX_BYTES = envInt("RELAY_PROXY_BODY_MAX_BYTES", 2 * 1024 * 1024, 1_024, 20 * 1024 * 1024);
const MAX_QUEUE_PER_SERVER = envInt("RELAY_MAX_QUEUE_PER_SERVER", 200, 10, 10_000);
const MAX_PENDING_RESPONSES = envInt("RELAY_MAX_PENDING_RESPONSES", 2_000, 100, 50_000);

const RATE_WINDOW_MS = envInt("RELAY_RATE_LIMIT_WINDOW_MS", 60_000, 1_000, 3_600_000);
const RATE_REGISTER_MAX = envInt("RELAY_RATE_REGISTER_MAX", 120, 5, 10_000);
const RATE_PULL_MAX = envInt("RELAY_RATE_PULL_MAX", 600, 10, 50_000);
const RATE_RESPOND_MAX = envInt("RELAY_RATE_RESPOND_MAX", 600, 10, 50_000);
const RATE_PAIR_EXCHANGE_MAX = envInt("RELAY_RATE_PAIR_EXCHANGE_MAX", 20, 2, 1_000);
const RATE_PROXY_MAX = envInt("RELAY_RATE_PROXY_MAX", 300, 10, 20_000);

const PAIR_FAILURE_BLOCK_MS = envInt("RELAY_PAIR_BLOCK_MS", 15 * 60_000, 10_000, 24 * 60 * 60 * 1000);
const PAIR_FAILURE_MAX = envInt("RELAY_PAIR_FAILURE_MAX", 12, 3, 10_000);

const PAIR_CODE_REGEX = /^[A-Z2-9]{8,16}$/;
const ALLOWED_PROXY_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

export function __resetRelayStateForTests(): void {
  sessions.clear();
  queues.clear();
  pendingResponses.clear();
  pullWaiters.clear();
  rateBuckets.clear();
  pairFailuresByIp.clear();
}

function envInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function log(message: string, data?: unknown): void {
  const payload = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[relay] ${message}${payload}`);
}

function nowMs(): number {
  return Date.now();
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
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

function getSession(serverId: string): RelaySession | null {
  return sessions.get(serverId) ?? null;
}

function assertSession(serverId: string, relaySecret: string): RelaySession {
  const session = getSession(serverId);
  if (!session || !safeEqual(session.relaySecret, relaySecret)) {
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

function enqueueRequest(serverId: string, request: RelayProxyRequest): boolean {
  if (resolvePullWaiter(serverId, request)) {
    return true;
  }

  const queue = queueFor(serverId);
  if (queue.length >= MAX_QUEUE_PER_SERVER) {
    return false;
  }

  queue.push(request);
  return true;
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
    const lower = key.toLowerCase();
    if (lower === "content-length" || lower === "transfer-encoding" || lower === "connection") {
      continue;
    }
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

function clientIp(c: Context): string {
  const direct = c.req.header("cf-connecting-ip");
  if (direct) return direct;

  const realIp = c.req.header("x-real-ip");
  if (realIp) return realIp;

  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

function bucketConsume(bucketKey: string, maxRequests: number): RateLimitResult {
  const now = nowMs();
  const existing = rateBuckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + RATE_WINDOW_MS;
    rateBuckets.set(bucketKey, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      resetAt,
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    resetAt: existing.resetAt,
  };
}

function applyRateHeaders(c: Context, limit: number, result: RateLimitResult): void {
  c.header("X-RateLimit-Limit", String(limit));
  c.header("X-RateLimit-Remaining", String(result.remaining));
  c.header("X-RateLimit-Reset", String(Math.floor(result.resetAt / 1000)));
}

function rateLimited(c: Context, result: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - nowMs()) / 1000));
  c.header("Retry-After", String(retryAfter));
  return c.json(
    {
      success: false,
      error: { code: "RATE_LIMITED", message: "Too many requests. Try again shortly." },
    },
    429,
  );
}

function applyEndpointLimit(c: Context, scope: string, id: string, limit: number): Response | null {
  const result = bucketConsume(`${scope}:${id}`, limit);
  applyRateHeaders(c, limit, result);
  if (!result.allowed) {
    return rateLimited(c, result);
  }
  return null;
}

function notePairFailure(ip: string): void {
  const now = nowMs();
  const state = pairFailuresByIp.get(ip) ?? { failures: 0, blockedUntil: 0 };
  state.failures += 1;

  if (state.failures >= PAIR_FAILURE_MAX) {
    state.failures = 0;
    state.blockedUntil = now + PAIR_FAILURE_BLOCK_MS;
  }

  pairFailuresByIp.set(ip, state);
}

function clearPairFailures(ip: string): void {
  pairFailuresByIp.delete(ip);
}

function isPairTemporarilyBlocked(ip: string): boolean {
  const state = pairFailuresByIp.get(ip);
  if (!state) return false;
  return state.blockedUntil > nowMs();
}

async function parseJsonBody<T>(c: Context, maxBytes = JSON_BODY_MAX_BYTES): Promise<ParsedJsonBody<T>> {
  const raw = await c.req.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    return {
      ok: false,
      response: c.json(
        {
          success: false,
          error: { code: "PAYLOAD_TOO_LARGE", message: "Payload too large." },
        },
        413,
      ),
    };
  }

  if (!raw.trim()) {
    return { ok: true, data: {} as T };
  }

  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return {
      ok: false,
      response: c.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "Invalid JSON body." },
        },
        400,
      ),
    };
  }
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

function cleanupRateData(): void {
  const now = nowMs();

  for (const [bucketKey, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) {
      rateBuckets.delete(bucketKey);
    }
  }

  for (const [ip, state] of pairFailuresByIp.entries()) {
    if (state.blockedUntil <= now && state.failures === 0) {
      pairFailuresByIp.delete(ip);
    }
  }
}

setInterval(cleanupStaleSessions, 30_000).unref();
setInterval(cleanupRateData, 60_000).unref();

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
  const ip = clientIp(c);
  const ipLimit = applyEndpointLimit(c, "register-ip", ip, RATE_REGISTER_MAX);
  if (ipLimit) return ipLimit;

  const parsed = await parseJsonBody<{
    serverId?: string;
    relaySecret?: string;
    relayPairCode?: string;
    adminApiKey?: string;
  }>(c);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (!body.serverId || !body.relaySecret || !body.relayPairCode || !body.adminApiKey) {
    return c.json(
      {
        success: false,
        error: { code: "BAD_REQUEST", message: "Missing required relay registration fields." },
      },
      400,
    );
  }

  const serverLimit = applyEndpointLimit(c, "register-server", body.serverId, RATE_REGISTER_MAX);
  if (serverLimit) return serverLimit;

  const existing = sessions.get(body.serverId);
  if (existing && !safeEqual(existing.relaySecret, body.relaySecret)) {
    return c.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Existing relay session secret mismatch." },
      },
      401,
    );
  }

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
  const ip = clientIp(c);
  const ipLimit = applyEndpointLimit(c, "pull-ip", ip, RATE_PULL_MAX);
  if (ipLimit) return ipLimit;

  const parsed = await parseJsonBody<{
    serverId?: string;
    relaySecret?: string;
    waitMs?: number;
  }>(c);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (!body.serverId || !body.relaySecret) {
    return c.json(
      {
        success: false,
        error: { code: "BAD_REQUEST", message: "Missing serverId or relaySecret." },
      },
      400,
    );
  }

  const serverLimit = applyEndpointLimit(c, "pull-server", body.serverId, RATE_PULL_MAX);
  if (serverLimit) return serverLimit;

  try {
    assertSession(body.serverId, body.relaySecret);
  } catch {
    return c.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Relay session not authorized." },
      },
      401,
    );
  }

  const waitMs = Math.min(Math.max(body.waitMs ?? PULL_WAIT_MS_DEFAULT, 500), 30_000);
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
  const ip = clientIp(c);
  const ipLimit = applyEndpointLimit(c, "respond-ip", ip, RATE_RESPOND_MAX);
  if (ipLimit) return ipLimit;

  const parsed = await parseJsonBody<{
    serverId?: string;
    relaySecret?: string;
    requestId?: string;
    response?: RelayProxyResponse;
  }>(c, Math.max(JSON_BODY_MAX_BYTES, PROXY_BODY_MAX_BYTES * 2));
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (!body.serverId || !body.relaySecret || !body.requestId || !body.response) {
    return c.json(
      {
        success: false,
        error: { code: "BAD_REQUEST", message: "Missing relay response payload." },
      },
      400,
    );
  }

  const serverLimit = applyEndpointLimit(c, "respond-server", body.serverId, RATE_RESPOND_MAX);
  if (serverLimit) return serverLimit;

  try {
    assertSession(body.serverId, body.relaySecret);
  } catch {
    return c.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Relay session not authorized." },
      },
      401,
    );
  }

  const pending = pendingResponses.get(body.requestId);
  if (!pending) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Pending request not found." },
      },
      404,
    );
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
  const ip = clientIp(c);
  const rateResult = applyEndpointLimit(c, "pair-ip", ip, RATE_PAIR_EXCHANGE_MAX);
  if (rateResult) return rateResult;

  if (isPairTemporarilyBlocked(ip)) {
    return c.json(
      {
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many failed attempts. Try again later." },
      },
      429,
    );
  }

  const parsed = await parseJsonBody<{ code?: string }>(c);
  if (!parsed.ok) return parsed.response;
  const code = parsed.data.code?.trim().toUpperCase();

  if (!code || !PAIR_CODE_REGEX.test(code)) {
    notePairFailure(ip);
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Pairing code not found or expired." },
      },
      404,
    );
  }

  const cutoff = nowMs() - SESSION_STALE_MS;
  const session = Array.from(sessions.values()).find((entry) => {
    if (entry.lastSeenAt < cutoff) {
      return false;
    }
    return safeEqual(entry.relayPairCode, code);
  });

  if (!session) {
    notePairFailure(ip);
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Pairing code not found or expired." },
      },
      404,
    );
  }

  clearPairFailures(ip);

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
  const ip = clientIp(c);
  const ipLimit = applyEndpointLimit(c, "proxy-ip", ip, RATE_PROXY_MAX);
  if (ipLimit) return ipLimit;

  const serverId = c.req.param("serverId");
  const serverLimit = applyEndpointLimit(c, "proxy-server", serverId, RATE_PROXY_MAX);
  if (serverLimit) return serverLimit;

  const session = getSession(serverId);
  if (!session) {
    return c.json(
      {
        success: false,
        error: { code: "SERVER_OFFLINE", message: "Server is not connected to relay." },
      },
      503,
    );
  }

  if (!ALLOWED_PROXY_METHODS.has(c.req.method)) {
    return c.json(
      {
        success: false,
        error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed through relay." },
      },
      405,
    );
  }

  if (pendingResponses.size >= MAX_PENDING_RESPONSES) {
    return c.json(
      {
        success: false,
        error: { code: "RELAY_SATURATED", message: "Relay is saturated. Try again shortly." },
      },
      503,
    );
  }

  const requestId = crypto.randomUUID();
  const url = new URL(c.req.url);
  const prefix = `/r/${serverId}`;
  const path = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) || "/" : "/";

  const body = await c.req.arrayBuffer();
  if (body.byteLength > PROXY_BODY_MAX_BYTES) {
    return c.json(
      {
        success: false,
        error: { code: "PAYLOAD_TOO_LARGE", message: "Proxy request body is too large." },
      },
      413,
    );
  }

  const relayRequest: RelayProxyRequest = {
    requestId,
    method: c.req.method,
    path,
    query: url.searchParams.toString(),
    headers: parseRequestHeaders(c.req.raw.headers),
    bodyBase64: body.byteLength > 0 ? encodeBase64(body) : undefined,
  };

  if (!enqueueRequest(serverId, relayRequest)) {
    return c.json(
      {
        success: false,
        error: { code: "RELAY_QUEUE_FULL", message: "Relay queue is full for this server." },
      },
      429,
    );
  }

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

export const relayApp = app;

if (import.meta.main) {
  const port = parseInt(process.env.RELAY_PORT ?? "8787", 10);
  const host = process.env.RELAY_HOST ?? "0.0.0.0";

  log("Starting relay", { host, port });

  Bun.serve({
    port,
    hostname: host,
    fetch: app.fetch,
  });
}
