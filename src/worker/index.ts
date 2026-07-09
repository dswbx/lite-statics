export { AssetBinding } from "./assets";

import { assetKey } from "./assets";
import { decideAccess, inactivePage, passwordPage, signedAccessCookie, verifySitePassword } from "./access";
import { hashPassword, randomId, sha256Hex } from "./crypto";
import {
  createUserWithPassword,
  createSite,
  deleteSite,
  getSiteById,
  getSiteBySlug,
  getSiteDetail,
  listSites,
  recordAnalytics,
  saveDeployment,
  signInUser,
  toSiteSummary,
  updateAccess,
} from "./db";
import type { Env, WorkerContext } from "./env";
import { errorResponse, isSitePath, jsonResponse, readJson, setCookieHeader } from "./http";
import { normalizeUpload } from "./upload";

interface CreateSiteBody {
  ownerEmail?: string;
  name?: string;
  slug?: string;
}

interface UpdateAccessBody {
  accessMode?: "public" | "password";
  password?: string;
  expiresAt?: string | null;
  disabled?: boolean;
}

interface SignupBody {
  email?: string;
  password?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: WorkerContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/public/") && url.pathname.endsWith("/password")) {
        return handlePasswordPost(request, env, url);
      }
      if (isSitePath(url.pathname)) {
        return handlePublicSite(request, env, ctx, url);
      }
      if (url.pathname.startsWith("/api/")) {
        return handleApi(request, env, url);
      }
      return env.DASHBOARD.fetch(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return errorResponse(message, 500);
    }
  },
};

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  if (url.pathname === "/api/signup" && request.method === "POST") {
    const body = await readJson<SignupBody>(request);
    const email = requireOwnerEmail(body.email);
    const password = requirePassword(body.password);
    try {
      const user = await createUserWithPassword(env.DB, email, password);
      return jsonResponse({ user }, { status: 201 });
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Sign up failed.", 409);
    }
  }

  if (url.pathname === "/api/signin" && request.method === "POST") {
    const body = await readJson<SignupBody>(request);
    const email = requireOwnerEmail(body.email);
    const password = requirePassword(body.password);
    try {
      const user = await signInUser(env.DB, email, password);
      return jsonResponse({ user });
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Sign in failed.", 401);
    }
  }

  if (url.pathname === "/api/sites" && request.method === "GET") {
    const ownerEmail = requireOwnerEmail(url.searchParams.get("ownerEmail"));
    return jsonResponse({ sites: await listSites(env.DB, ownerEmail) });
  }

  if (url.pathname === "/api/sites" && request.method === "POST") {
    const body = await readJson<CreateSiteBody>(request);
    const ownerEmail = requireOwnerEmail(body.ownerEmail);
    const name = requireText(body.name, "Site name");
    const slug = normalizeSlug(body.slug ?? name);
    const site = await createSite(env.DB, ownerEmail, name, slug);
    return jsonResponse({ site }, { status: 201 });
  }

  const deployMatch = url.pathname.match(/^\/api\/sites\/([^/]+)\/deploy$/);
  if (deployMatch && request.method === "POST") {
    return handleDeploy(request, env, deployMatch[1]);
  }

  const accessMatch = url.pathname.match(/^\/api\/sites\/([^/]+)\/access$/);
  if (accessMatch && request.method === "PATCH") {
    return handleAccessUpdate(request, env, accessMatch[1]);
  }

  const analyticsMatch = url.pathname.match(/^\/api\/sites\/([^/]+)\/analytics$/);
  if (analyticsMatch && request.method === "GET") {
    const detail = await getSiteDetail(env.DB, analyticsMatch[1]);
    if (!detail) return errorResponse("Site not found", 404);
    return jsonResponse({ analytics: detail.analytics });
  }

  const detailMatch = url.pathname.match(/^\/api\/sites\/([^/]+)$/);
  if (detailMatch && request.method === "DELETE") {
    const deleted = await deleteSite(env.DB, detailMatch[1]);
    if (!deleted) return errorResponse("Site not found", 404);
    return jsonResponse({ ok: true });
  }

  if (detailMatch && request.method === "GET") {
    const detail = await getSiteDetail(env.DB, detailMatch[1]);
    if (!detail) return errorResponse("Site not found", 404);
    return jsonResponse(detail);
  }

  return errorResponse("Not found", 404);
}

async function handleDeploy(request: Request, env: Env, siteId: string): Promise<Response> {
  const site = await getSiteById(env.DB, siteId);
  if (!site) return errorResponse("Site not found", 404);

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorResponse("Upload field `file` must contain an HTML file or ZIP archive.", 400);
  }

  const normalized = await normalizeUpload(file);
  const deploymentId = randomId("dep");
  const workerId = `${siteId}:${deploymentId}:${await sha256Hex(JSON.stringify(normalized.manifest))}`;

  await Promise.all(
    normalized.assets.map((asset) =>
      env.ASSET_BUCKET.put(assetKey(siteId, deploymentId, asset.pathname), asset.bytes, {
        httpMetadata: { contentType: asset.contentType },
      }),
    ),
  );

  const deployment = await saveDeployment(
    env.DB,
    siteId,
    deploymentId,
    workerId,
    normalized.manifest,
    normalized.assets.length,
    normalized.totalBytes,
  );
  const updatedSite = await getSiteById(env.DB, siteId);
  if (!updatedSite) return errorResponse("Site disappeared after deploy", 500);
  return jsonResponse(
    {
      site: toSiteSummary(updatedSite),
      deployment,
      publicUrl: `/s/${updatedSite.slug}/`,
    },
    { status: 201 },
  );
}

async function handleAccessUpdate(request: Request, env: Env, siteId: string): Promise<Response> {
  const body = await readJson<UpdateAccessBody>(request);
  const accessMode = body.accessMode ?? "public";
  if (accessMode !== "public" && accessMode !== "password") {
    return errorResponse("accessMode must be public or password", 400);
  }

  let passwordHash: string | null = null;
  let passwordSalt: string | null = null;
  if (accessMode === "password") {
    const password = requireText(body.password, "Password");
    const hashed = await hashPassword(password);
    passwordHash = hashed.hash;
    passwordSalt = hashed.salt;
  }

  const site = await updateAccess(
    env.DB,
    siteId,
    accessMode,
    passwordHash,
    passwordSalt,
    body.expiresAt ?? null,
    body.disabled ?? false,
  );
  return jsonResponse({ site });
}

async function handlePasswordPost(request: Request, env: Env, url: URL): Promise<Response> {
  const slug = decodeURIComponent(url.pathname.replace(/^\/api\/public\//, "").replace(/\/password$/, ""));
  const record = await getSiteBySlug(env.DB, slug);
  if (!record) return passwordPage(slug, "Site not found.");

  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  if (!(await verifySitePassword(record.site, password))) {
    return passwordPage(slug, "Password did not match.");
  }

  const cookie = await signedAccessCookie(env, record.site.id);
  return new Response(null, {
    status: 303,
    headers: {
      location: `/s/${encodeURIComponent(slug)}/`,
      "set-cookie": setCookieHeader(env.ACCESS_COOKIE_NAME, cookie, 60 * 60 * 12),
    },
  });
}

async function handlePublicSite(request: Request, env: Env, ctx: WorkerContext, url: URL): Promise<Response> {
  const parsed = parsePublicPath(url.pathname);
  if (!parsed) return errorResponse("Site slug missing", 404);

  const record = await getSiteBySlug(env.DB, parsed.slug);
  if (!record) return errorResponse("Site not found", 404);

  const decision = await decideAccess(env, request, record.site);
  if (decision.status === "inactive") return inactivePage(decision.reason);
  if (decision.status === "password-required") return passwordPage(record.site.slug);

  const { serveDynamicSite } = await import("./dynamic");
  const response = await serveDynamicSite(env, ctx, request, record, parsed.assetPathname);
  ctx.waitUntil(recordAnalytics(env.DB, record.site.id, request, parsed.assetPathname, response.status));
  return response;
}

function parsePublicPath(pathname: string): { slug: string; assetPathname: string } | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "s" || !parts[1]) return null;
  const slug = decodeURIComponent(parts[1]);
  const rest = parts.slice(2).join("/");
  return { slug, assetPathname: rest ? `/${rest}` : "/" };
}

function requireOwnerEmail(value: string | null | undefined): string {
  const text = requireText(value, "Owner email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    throw new Error("Owner email must be a valid email address.");
  }
  return text;
}

function requireText(value: string | null | undefined, label: string): string {
  const text = value?.trim();
  if (!text) throw new Error(`${label} is required.`);
  return text;
}

function requirePassword(value: string | null | undefined): string {
  const password = requireText(value, "Password");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  return password;
}

function normalizeSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (!slug) throw new Error("Slug must contain letters or numbers.");
  return slug;
}
