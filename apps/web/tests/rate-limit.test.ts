import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createRateLimiter } from "../lib/rate-limit";

const realNow = Date.now;
let now = 0;

beforeEach(() => {
  now = 0;
  Date.now = () => now;
});

afterEach(() => {
  Date.now = realNow;
});

describe("rate limiter", () => {
  it("allows requests within the budget", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 1000 });

    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(true);
  });

  it("blocks requests when budget is exhausted", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000, cooldownMs: 500 });

    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(false);
    expect(limiter.available()).toBe(0);
  });

  it("refreshes the budget after cooldown and refill time", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000, cooldownMs: 500 });

    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(false);

    now += 300;
    expect(limiter.tryConsume()).toBe(false);

    now += 400;
    expect(limiter.tryConsume()).toBe(true);
  });
});
