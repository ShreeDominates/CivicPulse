import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[CivicPulse] Redis not configured, caching disabled");
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return (await r.get(key)) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl = 3600): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, value, { ex: ttl });
  } catch (err) {
    console.error("[CivicPulse] Redis cache set error:", err);
  }
}
