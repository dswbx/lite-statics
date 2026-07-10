export type RateLimitPolicy = {
  limit: number;
  period: number;
};

// keep in sync with wrangler.jsonc ratelimits.simple settings
export const RATE_LIMIT_POLICY: RateLimitPolicy = { limit: 60, period: 60 };

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
