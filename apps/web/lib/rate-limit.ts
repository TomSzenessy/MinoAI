/**
 * Client-side token-bucket rate limiting for API calls.
 */

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  cooldownMs?: number;
}

export interface RateLimiter {
  tryConsume: () => boolean;
  available: () => number;
  reset: () => void;
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const refillPerMs = config.maxRequests / config.windowMs;

  let tokens = config.maxRequests;
  let lastRefill = Date.now();
  let blockedUntil = 0;

  const refill = () => {
    const now = Date.now();

    if (now < blockedUntil) {
      return;
    }

    const elapsed = now - lastRefill;
    if (elapsed > 0) {
      tokens = Math.min(config.maxRequests, tokens + elapsed * refillPerMs);
      lastRefill = now;
    }
  };

  return {
    tryConsume() {
      const now = Date.now();
      if (now < blockedUntil) {
        return false;
      }

      refill();

      if (tokens >= 1) {
        tokens -= 1;
        return true;
      }

      if (config.cooldownMs && config.cooldownMs > 0) {
        blockedUntil = now + config.cooldownMs;
      }

      return false;
    },

    available() {
      const now = Date.now();
      if (now < blockedUntil) {
        return 0;
      }

      refill();
      return Math.floor(tokens);
    },

    reset() {
      tokens = config.maxRequests;
      lastRefill = Date.now();
      blockedUntil = 0;
    },
  };
}

export const apiLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60_000,
  cooldownMs: 1_500,
});
