import { parseCookies } from "./http";
import type { Env } from "./env";
import { signValue, verifyPassword, verifySignedValue } from "./crypto";

export type AccessDecision =
  | { status: "allow" }
  | { status: "inactive"; reason: "expired" | "disabled" | "not-deployed" }
  | { status: "password-required" };

export interface AccessSite {
  id: string;
  slug: string;
  access_mode: "public" | "password";
  password_hash: string | null;
  password_salt: string | null;
  expires_at: string | null;
  disabled_at: string | null;
  manifest_json: string | null;
}

export async function decideAccess(env: Env, request: Request, site: AccessSite): Promise<AccessDecision> {
  if (site.disabled_at) return { status: "inactive", reason: "disabled" };
  if (site.expires_at && Date.parse(site.expires_at) <= Date.now()) return { status: "inactive", reason: "expired" };
  if (!site.manifest_json) return { status: "inactive", reason: "not-deployed" };
  if (site.access_mode === "public") return { status: "allow" };

  const cookieValue = parseCookies(request).get(env.ACCESS_COOKIE_NAME);
  const expected = accessCookiePayload(site.id);
  if (cookieValue && (await verifySignedValue(env.COOKIE_SECRET, cookieValue, expected))) {
    return { status: "allow" };
  }
  return { status: "password-required" };
}

export async function verifySitePassword(site: AccessSite, password: string): Promise<boolean> {
  if (!site.password_hash || !site.password_salt) return false;
  return verifyPassword(password, site.password_salt, site.password_hash);
}

export function accessCookiePayload(siteId: string): string {
  return `site:${siteId}`;
}

export function accessCookieSecure(request: Request): boolean {
  const url = new URL(request.url);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return false;
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim().toLowerCase() === "https";
  return url.protocol === "https:";
}

export async function signedAccessCookie(env: Env, siteId: string): Promise<string> {
  return signValue(env.COOKIE_SECRET, accessCookiePayload(siteId));
}

export function passwordPage(slug: string, reason = ""): Response {
  const message = reason ? `<p class="error">${escapeHtml(reason)}</p>` : "";
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Password required</title>
    <style>
      body{margin:0;min-height:100vh;display:grid;place-items:center;background:#101418;color:#f5efe7;font:16px/1.5 ui-sans-serif,system-ui}
      main{width:min(420px,calc(100vw - 40px));border:1px solid #33414d;background:#151d24;padding:28px}
      input,button{width:100%;box-sizing:border-box;border:1px solid #465765;background:#0b1117;color:#f5efe7;padding:12px;margin-top:12px}
      button{background:#d6ff68;color:#0b1117;font-weight:700;cursor:pointer}
      .error{color:#ff9d7d}
    </style>
  </head>
  <body>
    <main>
      <h1>Private site</h1>
      <form method="post" action="/api/sites/${encodeURIComponent(slug)}/password">
        ${message}
        <input name="password" type="password" autocomplete="current-password" placeholder="Password" required />
        <button type="submit">Open site</button>
      </form>
    </main>
  </body>
</html>`,
    { status: 401, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export function inactivePage(reason: string): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Site inactive</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#101418;color:#f5efe7;font:16px/1.5 ui-sans-serif,system-ui}main{width:min(460px,calc(100vw - 40px));border:1px solid #33414d;background:#151d24;padding:28px}</style></head><body><main><h1>Site inactive</h1><p>This site is ${escapeHtml(reason)}.</p></main></body></html>`,
    { status: 410, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
