import type { RateLimitRouteClass } from "./rate-limit";

export type RateLimitPolicy = {
  limit: number;
  period: number;
};

// keep in sync with wrangler.jsonc ratelimits.simple settings
export const RATE_LIMIT_POLICIES: Record<RateLimitRouteClass, RateLimitPolicy> = {
  auth: { limit: 30, period: 60 },
  api: { limit: 60, period: 60 },
  rest: { limit: 120, period: 60 },
  static: { limit: 600, period: 60 },
  default: { limit: 120, period: 60 },
};

export function rateLimitResponseHeaders(
  policy: RateLimitPolicy,
  outcome: { success: boolean },
): HeadersInit {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(policy.limit),
    "RateLimit-Reset": String(policy.period),
    "RateLimit-Policy": `${policy.limit};w=${policy.period}`,
  };

  if (!outcome.success) {
    headers["RateLimit-Remaining"] = "0";
    headers["Retry-After"] = String(policy.period);
  }

  return headers;
}
