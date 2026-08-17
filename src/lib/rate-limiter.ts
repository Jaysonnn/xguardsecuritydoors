/**
 * Sliding-window rate limiter.
 *
 * In-memory Map is correct for a single instance (EC2/Lightsail/single container).
 * If you scale horizontally (ECS >1 task, Lambda, Amplify), swap the store for
 * ElastiCache Redis or Upstash. The interface below stays identical, only
 * `consume` changes to INCR/EXPIRE. Do NOT ship multi-instance with the Map:
 * per-instance counters silently multiply the real limit.
 */

type Bucket = { timestamps: number[] };

const store = new Map<string, Bucket>();
const MAX_KEYS = 50_000; // hard cap so an IP-rotation flood can't exhaust memory

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function consume(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket) {
    if (store.size >= MAX_KEYS) evictOldest();
    bucket = { timestamps: [] };
    store.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  bucket.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}

function evictOldest(): void {
  // Drop ~10% of entries with the stalest activity
  const entries = [...store.entries()].sort(
    (a, b) => (a[1].timestamps.at(-1) ?? 0) - (b[1].timestamps.at(-1) ?? 0),
  );
  for (const [key] of entries.slice(0, Math.ceil(entries.length / 10))) {
    store.delete(key);
  }
}

/**
 * Client IP resolution. Behind CloudFront/ALB the LAST hop-appended entry that
 * our own infrastructure wrote is trustworthy; the first entries are client-
 * controlled and spoofable. Configure the trusted hop count for your topology.
 */
export function clientIpFrom(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim());
    // ALB appends the true client IP as the last untrusted entry
    return parts[parts.length - 1] ?? "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}
