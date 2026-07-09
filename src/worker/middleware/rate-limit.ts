import type { Context, Next } from "hono";
import type { AppEnv } from "../client";
import type { Env } from "../env";
import { RATE_LIMIT_POLICIES, rateLimitResponseHeaders } from "./rate-limit-policies";

export type RateLimitRouteClass = "auth" | "api" | "rest" | "static" | "default";

export function routeClassFromPathname(pathname: string): RateLimitRouteClass {
  if (pathname.startsWith("/auth/v1")) return "auth";
  if (pathname.startsWith("/api/")) return "api";
  if (pathname.startsWith("/rest/v1")) return "rest";
  if (pathname.startsWith("/s/")) return "static";
  return "default";
}

export function rateLimitIdentifier(request: Request): string {
  const authorization = request.headers.get("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    const subject = decodeJwtSubject(authorization.slice(7));
    if (subject) return subject;
  }
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}

export function rateLimitKey(routeClass: RateLimitRouteClass, identifier: string): string {
  return `${routeClass}:${identifier}`;
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

function rateLimiterForRoute(env: Env, routeClass: RateLimitRouteClass): RateLimit | undefined {
  switch (routeClass) {
    case "auth":
      return env.RATE_LIMIT_AUTH;
    case "api":
      return env.RATE_LIMIT_API;
    case "rest":
      return env.RATE_LIMIT_REST;
    case "static":
      return env.RATE_LIMIT_STATIC;
    default:
      return env.RATE_LIMIT_DEFAULT;
  }
}

function withRateLimitHeaders(response: Response, routeClass: RateLimitRouteClass, success: boolean): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(rateLimitResponseHeaders(RATE_LIMIT_POLICIES[routeClass], { success }))) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function rateLimit(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const pathname = new URL(c.req.raw.url).pathname;
  const routeClass = routeClassFromPathname(pathname);
  const limiter = rateLimiterForRoute(c.env, routeClass);
  if (!limiter) {
    await next();
    return;
  }

  const key = rateLimitKey(routeClass, rateLimitIdentifier(c.req.raw));
  const outcome = await limiter.limit({ key });
  if (!outcome.success) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: rateLimitResponseHeaders(RATE_LIMIT_POLICIES[routeClass], outcome),
      },
    );
  }

  await next();
  if (c.res) {
    c.res = withRateLimitHeaders(c.res, routeClass, true);
  }
}
