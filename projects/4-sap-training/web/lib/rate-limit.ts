import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const enabled = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = enabled
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  : null;

export const limits = {
  login: enabled
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "rl:login"
      })
    : null,
  upload: enabled
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        prefix: "rl:upload"
      })
    : null,
  feedback: enabled
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(30, "1 m"),
        prefix: "rl:feedback"
      })
    : null,
  general: enabled
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(5, "1 s"),
        prefix: "rl:general"
      })
    : null
};

export async function checkRateLimit(limit: Ratelimit | null, identifier: string) {
  if (!limit) {
    return {
      success: true,
      limit: Number.POSITIVE_INFINITY,
      remaining: Number.POSITIVE_INFINITY,
      reset: 0
    };
  }
  return limit.limit(identifier);
}

export function clientIpFromHeaders(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}
