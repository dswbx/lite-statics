import { App, InMemoryEmailDriver, setExperimental } from "@supabase/lite";
import { d1 } from "@supabase/lite/workerd";
import type { Env } from "./env";
import deparse from "./deparse.generated.json";
import { createCloudflareEmailDriver } from "./email";
import { SITE_ASSETS_BUCKET } from "./storage/constants";
import { R2StorageAdapter } from "./storage/r2-adapter";

setExperimental("storage", true);

const ADDITIONAL_REDIRECT_URLS = [
  "http://localhost:5173/auth/callback",
  "http://127.0.0.1:5173/auth/callback",
  "http://127.0.0.1:5180/auth/callback",
  "https://statics.supalite.run/auth/callback",
];

function liteAppCacheKey(env: Env) {
  return [
    env.JWT_SECRET,
    env.SITE_URL ?? "",
    env.EMAIL_FROM_ADDRESS ?? "",
    env.GOOGLE_CLIENT_ID ?? "",
    env.GOOGLE_CLIENT_SECRET ?? "",
  ].join(":");
}

function createEmailDriver(env: Env) {
  if (env.EMAIL && env.EMAIL_FROM_ADDRESS?.trim()) {
    return createCloudflareEmailDriver(env);
  }
  return new InMemoryEmailDriver();
}

function googleEnabled(env: Env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());
}

export function createLiteApp(env: Env): App {
  const siteUrl = env.SITE_URL?.trim() || "http://localhost:5173";
  const emailDriver = createEmailDriver(env);
  const google = googleEnabled(env);

  const liteApp = new App({
    connection: d1({
      binding: env.DB,
      translation: { deparse: deparse as never },
    }),
    // lite defaults api.external_url to http://127.0.0.1:54321; OAuth uses that as
    // Google's redirect_uri, so it must match the public app origin (SITE_URL).
    api: {
      external_url: siteUrl,
    },
    auth: {
      enabled: true,
      jwt_secret: env.JWT_SECRET,
      enable_signup: true,
      site_url: siteUrl,
      additional_redirect_urls: ADDITIONAL_REDIRECT_URLS,
      email: {
        enable_confirmations: true,
      },
      external: {
        google: {
          enabled: google,
          client_id: env.GOOGLE_CLIENT_ID,
          secret: env.GOOGLE_CLIENT_SECRET,
        },
      },
    },
    storage: {
      enabled: true,
      file_size_limit: "10MiB",
      buckets: {
        [SITE_ASSETS_BUCKET]: { public: false },
      },
    },
    options: { drivers: { email: emailDriver } },
  });

  liteApp._storageAdapter = new R2StorageAdapter(env.ASSET_BUCKET) as NonNullable<App["_storageAdapter"]>;
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
