import { RateLimitExceededError } from "./errors";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 30; // 30 requests per minute

export function checkRateLimit(key: string, max = MAX_REQUESTS, windowMs = WINDOW_MS): void {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (record.count >= max) {
    throw new RateLimitExceededError(
      `Rate limit exceeded. Try again in ${Math.ceil((record.resetAt - now) / 1000)} seconds.`
    );
  }

  record.count += 1;
}

export function resetRateLimiter(): void {
  rateLimitStore.clear();
}
