import { App } from "@supabase/lite";
import { d1 } from "@supabase/lite/workerd";
import type { Env } from "./env";
import deparse from "./deparse.generated.json";

export function createLiteApp(env: Env): App {
  return new App({
    // On D1, migrations are applied out-of-band by wrangler as pre-translated
    // SQLite (RLS stripped), so supalite never sees the policies and would
    // return every row. Hand it the deparse payload captured at build time from
    // supabase/schemas/schema.sql (see scripts/generate-d1-migrations.ts); the
    // connection re-parses it via parseDeparseInfo, so it passes through as-is.
    connection: d1({
      binding: env.DB,
      translation: { deparse: deparse as never },
    }),
    auth: {
      enabled: true,
      jwt_secret: env.JWT_SECRET,
      enable_signup: true,
    },
  });
}

let cachedLiteApp: App | undefined;

export function getLiteApp(env: Env): App {
  if (!cachedLiteApp) {
    cachedLiteApp = createLiteApp(env);
  }
  return cachedLiteApp;
}
