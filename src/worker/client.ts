import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import type { Env } from "./env";

const SERVICE_SUB = "00000000-0000-0000-0000-000000000001";
const WORKER_ORIGIN = "http://worker";

export type AppFetch = (request: Request, env: Env, executionCtx: FetchExecutionContext) => Response | Promise<Response>;

export type AppEnv = {
  Bindings: Env;
  Variables: { appFetch: AppFetch };
};

export interface FetchExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

let cachedServiceKey: { secret: string; key: string; expiresAt: number } | null = null;

async function serviceRoleKey(secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedServiceKey && cachedServiceKey.secret === secret && cachedServiceKey.expiresAt > now + 60) {
    return cachedServiceKey.key;
  }
  const key = await new SignJWT({ role: "service_role", sub: SERVICE_SUB, aud: "authenticated" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(new TextEncoder().encode(secret));
  cachedServiceKey = { secret, key, expiresAt: now + 3600 };
  return key;
}

function workerFetch(appFetch: AppFetch, env: Env, executionCtx: FetchExecutionContext, authorization?: string) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    if (authorization) {
      const headers = new Headers(request.headers);
      headers.set("Authorization", authorization);
      return appFetch(new Request(request, { headers }), env, executionCtx);
    }
    return appFetch(request, env, executionCtx);
  };
}

export async function createServiceClient(
  appFetch: AppFetch,
  env: Env,
  executionCtx: FetchExecutionContext,
): Promise<SupabaseClient> {
  const apikey = await serviceRoleKey(env.JWT_SECRET);
  return createClient(WORKER_ORIGIN, apikey, {
    global: {
      fetch: workerFetch(appFetch, env, executionCtx),
      headers: { apikey },
    },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function createUserClient(
  appFetch: AppFetch,
  env: Env,
  executionCtx: FetchExecutionContext,
  authorization: string,
): SupabaseClient {
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : authorization;
  return createClient(WORKER_ORIGIN, token, {
    global: {
      fetch: workerFetch(appFetch, env, executionCtx, `Bearer ${token}`),
      headers: { apikey: token, Authorization: `Bearer ${token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
