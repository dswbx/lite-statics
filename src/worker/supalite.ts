import { App } from "@supabase/lite";
import { d1 } from "@supabase/lite/workerd";
import type { Env } from "./env";

export function createLiteApp(env: Env): App {
  return new App({
    connection: d1({ binding: env.DB }),
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
