import { App, InMemoryEmailDriver } from "@supabase/lite";
import { d1 } from "@supabase/lite/workerd";
import type { Env } from "./env";
import deparse from "./deparse.generated.json";
import { createCloudflareEmailDriver } from "./email";

function liteAppCacheKey(env: Env) {
  return [env.JWT_SECRET, env.SITE_URL ?? "", env.EMAIL_FROM_ADDRESS ?? ""].join(":");
}

function createEmailDriver(env: Env) {
  if (env.EMAIL && env.EMAIL_FROM_ADDRESS?.trim()) {
    return createCloudflareEmailDriver(env);
  }
  return new InMemoryEmailDriver();
}

export function createLiteApp(env: Env): App {
  const siteUrl = env.SITE_URL?.trim() || "http://localhost:5173";
  const emailDriver = createEmailDriver(env);

  const liteApp = new App({
    connection: d1({
      binding: env.DB,
      translation: { deparse: deparse as never },
    }),
    auth: {
      enabled: true,
      jwt_secret: env.JWT_SECRET,
      enable_signup: true,
      site_url: siteUrl,
      email: {
        enable_confirmations: true,
      },
    },
    options: { drivers: { email: emailDriver } },
  });

  return liteApp;
}

let cachedLiteApp: { key: string; app: App } | undefined;

export function getLiteApp(env: Env): App {
  const key = liteAppCacheKey(env);
  if (!cachedLiteApp || cachedLiteApp.key !== key) {
    cachedLiteApp = { key, app: createLiteApp(env) };
  }
  return cachedLiteApp.app;
}
