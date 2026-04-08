import { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries periodically
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000, // 1 minute
};

/**
 * Simple in-memory rate limiter keyed by IP.
 * Returns { success: true } if under limit, or { success: false, retryAfterMs } if exceeded.
 */
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG,
): { success: true } | { success: false; retryAfterMs: number } {
  cleanup();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + config.windowMs });
    return { success: true };
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    return { success: false, retryAfterMs: entry.resetAt - now };
  }

  return { success: true };
}
