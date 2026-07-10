import type { Context, Next } from "hono";
import type { AppEnv } from "../client";
import { RATE_LIMIT_POLICY, rateLimitResponseHeaders } from "./rate-limit-policies";

export function rateLimitIdentifier(request: Request): string {
  const authorization = request.headers.get("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    const subject = decodeJwtSubject(authorization.slice(7));
    if (subject) return subject;
  }
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}

function decodeJwtSubject(token: string): string | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function withRateLimitHeaders(response: Response, success: boolean): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(rateLimitResponseHeaders(RATE_LIMIT_POLICY, { success }))) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function rateLimit(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const limiter = c.env.RATE_LIMIT;
  if (!limiter) {
    await next();
    return;
  }

  const key = rateLimitIdentifier(c.req.raw);
  const outcome = await limiter.limit({ key });
  if (!outcome.success) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: rateLimitResponseHeaders(RATE_LIMIT_POLICY, outcome),
      },
    );
  }

  await next();
  if (c.res) {
    c.res = withRateLimitHeaders(c.res, true);
  }
}
