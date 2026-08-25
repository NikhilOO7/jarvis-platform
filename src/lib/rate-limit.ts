type RateBucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as typeof globalThis & {
  jarvisRateBuckets?: Map<string, RateBucket>;
};

const buckets = globalForRateLimit.jarvisRateBuckets ?? new Map<string, RateBucket>();
if (process.env.NODE_ENV !== "production") globalForRateLimit.jarvisRateBuckets = buckets;

export function consumeRateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  current.count += 1;
  return {
    allowed: current.count <= options.limit,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
  };
}
