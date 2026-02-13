/**
 * API Rate Limiting Middleware.
 *
 * Protects API routes against abusive traffic bursts and high-concurrency floods.
 * Limits are enforced per client IP and, when present, per API key identity.
 */

import { createHash } from "node:crypto";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import type { AppContext } from "../types";

interface FixedWindowBucket {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, FixedWindowBucket>();
const keyBuckets = new Map<string, FixedWindowBucket>();
const concurrentRequestsByIp = new Map<string, number>();

let cleanupTimerStarted = false;

function parseLimit(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function startCleanupLoop(windowMs: number): void {
  if (cleanupTimerStarted) return;
  cleanupTimerStarted = true;

  setInterval(() => {
    const now = Date.now();

    for (const [key, bucket] of ipBuckets.entries()) {
      if (bucket.resetAt <= now) {
        ipBuckets.delete(key);
      }
    }

    for (const [key, bucket] of keyBuckets.entries()) {
      if (bucket.resetAt <= now) {
        keyBuckets.delete(key);
      }
    }

    for (const [key, count] of concurrentRequestsByIp.entries()) {
      if (count <= 0) {
        concurrentRequestsByIp.delete(key);
      }
    }
  }, Math.max(windowMs, 10_000)).unref();
}

function getClientIp(c: Context<AppContext>): string {
  const headerCandidates = [
    c.req.header("cf-connecting-ip"),
    c.req.header("x-real-ip"),
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim(),
  ];

  for (const candidate of headerCandidates) {
    if (candidate && candidate.length > 0) {
      return candidate;
    }
  }

  return "unknown";
}

function apiKeyIdentity(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
}

function consume(
  buckets: Map<string, FixedWindowBucket>,
  key: string,
  now: number,
  windowMs: number,
  maxRequests: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    const next: FixedWindowBucket = { count: 1, resetAt };
    buckets.set(key, next);
    return { allowed: true, remaining: Math.max(0, maxRequests - 1), resetAt };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    resetAt: existing.resetAt,
  };
}

function applyRateLimitHeaders(
  c: Context<AppContext>,
  limit: number,
  remaining: number,
  resetAt: number,
): void {
  c.res.headers.set("X-RateLimit-Limit", String(limit));
  c.res.headers.set("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  c.res.headers.set("X-RateLimit-Reset", String(Math.floor(resetAt / 1000)));
}

function rateLimitResponse(c: Context<AppContext>, resetAt: number): Response {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  c.res.headers.set("Retry-After", String(retryAfterSeconds));

  return c.json(
    {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please retry later.",
      },
    },
    429,
  );
}

function incrementConcurrent(ip: string): number {
  const next = (concurrentRequestsByIp.get(ip) ?? 0) + 1;
  concurrentRequestsByIp.set(ip, next);
  return next;
}

function decrementConcurrent(ip: string): void {
  const current = concurrentRequestsByIp.get(ip) ?? 0;
  if (current <= 1) {
    concurrentRequestsByIp.delete(ip);
    return;
  }
  concurrentRequestsByIp.set(ip, current - 1);
}

export function apiRateLimitMiddleware() {
  const enabled = process.env.MINO_RATE_LIMIT_ENABLED !== "false";
  const windowMs = parseLimit("MINO_RATE_LIMIT_WINDOW_MS", 60_000, 1_000, 3_600_000);
  const ipLimit = parseLimit("MINO_RATE_LIMIT_IP_MAX", 240, 1, 100_000);
  const apiKeyLimit = parseLimit("MINO_RATE_LIMIT_KEY_MAX", 480, 1, 200_000);
  const concurrentPerIp = parseLimit("MINO_RATE_LIMIT_CONCURRENT_IP", 48, 1, 5_000);

  startCleanupLoop(windowMs);

  return createMiddleware<AppContext>(async (c, next) => {
    if (!enabled) {
      await next();
      return;
    }

    if (!c.req.path.startsWith("/api/")) {
      await next();
      return;
    }

    if (c.req.method === "OPTIONS") {
      await next();
      return;
    }

    if (c.req.path === "/api/v1/health") {
      await next();
      return;
    }

    const now = Date.now();
    const ip = getClientIp(c);

    const ipResult = consume(ipBuckets, ip, now, windowMs, ipLimit);
    applyRateLimitHeaders(c, ipLimit, ipResult.remaining, ipResult.resetAt);
    if (!ipResult.allowed) {
      return rateLimitResponse(c, ipResult.resetAt);
    }

    const apiKey = c.req.header("X-Mino-Key");
    if (apiKey && apiKey.length > 8) {
      const keyResult = consume(
        keyBuckets,
        apiKeyIdentity(apiKey),
        now,
        windowMs,
        apiKeyLimit,
      );

      const remaining = Math.min(ipResult.remaining, keyResult.remaining);
      const resetAt = Math.min(ipResult.resetAt, keyResult.resetAt);
      applyRateLimitHeaders(c, Math.min(ipLimit, apiKeyLimit), remaining, resetAt);

      if (!keyResult.allowed) {
        return rateLimitResponse(c, keyResult.resetAt);
      }
    }

    if (incrementConcurrent(ip) > concurrentPerIp) {
      decrementConcurrent(ip);
      c.res.headers.set("Retry-After", "1");
      return c.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many concurrent requests. Please retry.",
          },
        },
        429,
      );
    }

    try {
      await next();
    } finally {
      decrementConcurrent(ip);
    }
  });
}
