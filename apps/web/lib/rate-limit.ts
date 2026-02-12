/**
 * Mino Rate Limiter — Client-side token bucket for API call throttling.
 *
 * Prevents excessive requests from the browser to avoid hammering the
 * server and to comply with DSGVO "data minimization" principles.
 *
 * @example
 * const limiter = createRateLimiter({ maxTokens: 30, refillPerSecond: 5 });
 * if (limiter.tryConsume()) { fetch(...) }
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimiterConfig {
  /** Maximum number of tokens (burst capacity). */
  maxTokens: number;
  /** Tokens refilled per second. */
  refillPerSecond: number;
}

export interface RateLimiter {
  /** Attempt to consume a token. Returns `true` if allowed. */
  tryConsume: () => boolean;
  /** Returns the number of available tokens (for debugging/UI). */
  available: () => number;
  /** Reset the bucket to full capacity. */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a token-bucket rate limiter.
 *
 * Tokens are refilled continuously based on elapsed time since last check,
 * capped at `maxTokens`. Each call to `tryConsume()` tries to take one token.
 */
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  let tokens = config.maxTokens;
  let lastRefill = Date.now();

  function refill(): void {
    const now = Date.now();
    const elapsed = (now - lastRefill) / 1000; // seconds
    tokens = Math.min(config.maxTokens, tokens + elapsed * config.refillPerSecond);
    lastRefill = now;
  }

  return {
    tryConsume(): boolean {
      refill();
      if (tokens >= 1) {
        tokens -= 1;
        return true;
      }
      return false;
    },

    available(): number {
      refill();
      return Math.floor(tokens);
    },

    reset(): void {
      tokens = config.maxTokens;
      lastRefill = Date.now();
    },
  };
}

// ---------------------------------------------------------------------------
// Default limiter for API calls
// ---------------------------------------------------------------------------

/** Shared limiter: 30 requests burst, refills at 5/sec → steady 300/min. */
export const apiLimiter = createRateLimiter({
  maxTokens: 30,
  refillPerSecond: 5,
});
