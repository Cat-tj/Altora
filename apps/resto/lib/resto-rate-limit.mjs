const buckets = new Map();
const MAX_TRACKED_KEYS = 20_000;

export function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [trackedKey, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(trackedKey);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (bucket.count >= limit) return { allowed: false, retryAfterMs: bucket.resetAt - now };

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function formatRetryMessage(retryAfterMs) {
  return `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(retryAfterMs / 1000)} detik.`;
}
