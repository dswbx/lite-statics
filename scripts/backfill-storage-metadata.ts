#!/usr/bin/env bun
/**
 * Backfill SupaLite storage metadata for site assets already present in R2.
 *
 * Existing deployments created before SupaLite storage only have bytes in R2.
 * Public `/s/:slug/*` serving still works; this script registers missing
 * storage.objects rows by reading the live public site and uploading through
 * the storage API.
 *
 * Usage (local dev server must be running):
 *   bun scripts/backfill-storage-metadata.ts
 */

import { SignJWT } from "jose";
import { SITE_ASSETS_BUCKET } from "../src/worker/storage/constants";

const origin = process.env.STATICS_ORIGIN ?? "http://localhost:5173";
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-me-static-host";

async function serviceRoleKey(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ role: "service_role", sub: "00000000-0000-0000-0000-000000000001", aud: "authenticated" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(new TextEncoder().encode(jwtSecret));
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await serviceRoleKey();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("apikey", token);
  return fetch(`${origin}${path}`, { ...init, headers });
}

async function listSites(): Promise<Array<{ id: string; slug: string; manifest_json: string | null }>> {
  const response = await apiFetch("/rest/v1/sites?select=id,slug,manifest_json");
  if (!response.ok) {
    throw new Error(`failed to list sites: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as Array<{ id: string; slug: string; manifest_json: string | null }>;
}

async function ensureBucket(): Promise<void> {
  const listResponse = await apiFetch("/storage/v1/bucket");
  if (!listResponse.ok) {
    throw new Error(`failed to list buckets: ${listResponse.status} ${await listResponse.text()}`);
  }
  const buckets = (await listResponse.json()) as Array<{ id: string }>;
  if (buckets.some((bucket) => bucket.id === SITE_ASSETS_BUCKET)) return;

  const createResponse = await apiFetch("/storage/v1/bucket", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: SITE_ASSETS_BUCKET, name: SITE_ASSETS_BUCKET, public: false }),
  });
  if (!createResponse.ok && createResponse.status !== 409) {
    throw new Error(`failed to create bucket: ${createResponse.status} ${await createResponse.text()}`);
  }
}

async function listStorageObjects(siteId: string): Promise<Set<string>> {
  const response = await apiFetch(`/storage/v1/object/list/${SITE_ASSETS_BUCKET}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prefix: `${siteId}/`, limit: 1000, offset: 0 }),
  });
  if (!response.ok) {
    throw new Error(`failed to list storage objects for ${siteId}: ${response.status} ${await response.text()}`);
  }
  const objects = (await response.json()) as Array<{ name: string }>;
  return new Set(objects.map((object) => object.name));
}

async function registerObject(
  siteId: string,
  slug: string,
  pathname: string,
  contentType: string,
): Promise<void> {
  const key = `${siteId}${pathname}`;
  const publicPath = pathname === "/" ? `/s/${slug}/` : `/s/${slug}${pathname}`;
  const assetResponse = await fetch(`${origin}${publicPath}`);
  if (!assetResponse.ok) {
    throw new Error(`failed to read public asset ${publicPath}: ${assetResponse.status}`);
  }

  const uploadResponse = await apiFetch(`/storage/v1/object/${SITE_ASSETS_BUCKET}/${key}`, {
    method: "POST",
    headers: {
      "content-type": contentType,
      "x-upsert": "true",
    },
    body: await assetResponse.arrayBuffer(),
  });
  if (!uploadResponse.ok) {
    throw new Error(`failed to register ${key}: ${uploadResponse.status} ${await uploadResponse.text()}`);
  }
}

async function main() {
  await ensureBucket();
  const sites = await listSites();
  let registered = 0;

  for (const site of sites) {
    if (!site.manifest_json) continue;
    const manifest = JSON.parse(site.manifest_json) as Record<string, { contentType: string }>;
    const existing = await listStorageObjects(site.id);

    for (const [pathname, entry] of Object.entries(manifest)) {
      const key = `${site.id}${pathname}`;
      if (existing.has(key)) continue;
      await registerObject(site.id, site.slug, pathname, entry.contentType);
      registered += 1;
      console.log(`registered ${key} (${site.slug})`);
    }
  }

  console.log(`backfill complete (${registered} objects registered)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
