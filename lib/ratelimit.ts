import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

let ratelimit: Ratelimit | null = null;

export function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  const r = getRedis();
  if (!r) return null;
  ratelimit = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(10, "60s"),
  });
  return ratelimit;
}

export async function checkRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  const rl = getRatelimit();
  if (!rl) return { success: true, remaining: 10 };
  const result = await rl.limit(ip);
  return { success: result.success, remaining: result.remaining };
}
