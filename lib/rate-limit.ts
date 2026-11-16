/**
 * Minimal in-memory fixed-window rate limiter for Server Actions.
 *
 * Good enough for a single instance (the Hostinger VPS / PM2 setup). For a
 * multi-instance or serverless deployment, back this with Redis/Upstash so the
 * window is shared across instances.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * @param key      Identifier for the caller+action (e.g. "signin:<ip>").
 * @param limit    Max attempts allowed per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, retryAfterSec: 0 };
}

/** Clear a key early (e.g. after a successful login). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

// Opportunistic cleanup so the Map can't grow unbounded on a long-lived process.
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }, 5 * 60_000);
  // Don't keep the event loop alive just for cleanup.
  (timer as unknown as { unref?: () => void }).unref?.();
}
