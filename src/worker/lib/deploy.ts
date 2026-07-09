import type { SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "../env";
import { mapSite, type SiteRow } from "../../shared/mappers";
import type { StoredAssetManifest } from "../../shared/types";
import { normalizeUpload } from "../upload";
import { assetKey } from "./storage";

export async function getSiteBySlug(client: SupabaseClient, slug: string): Promise<SiteRow | null> {
  const { data: site, error } = await client.from("sites").select("*").eq("slug", slug).maybeSingle<SiteRow>();
  if (error || !site) return null;
  return site;
}

export async function deploySite(
  env: Env,
  client: SupabaseClient,
  siteId: string,
  file: File,
): Promise<{ site: SiteRow; publicUrl: string }> {
  const { data: site, error: siteError } = await client.from("sites").select("*").eq("id", siteId).single<SiteRow>();
  if (siteError || !site) throw new Error("Site not found");

  const normalized = await normalizeUpload(file);
  const previousManifest = parseManifestJson(site.manifest_json);

  await Promise.all(
    normalized.assets.map((asset) =>
      env.ASSET_BUCKET.put(assetKey(siteId, asset.pathname), asset.bytes, {
        httpMetadata: { contentType: asset.contentType },
      }),
    ),
  );

  if (previousManifest) {
    await deleteStaleAssets(env, siteId, previousManifest, normalized.manifest);
  }

  const now = new Date().toISOString();
  const { data: updatedSite, error: updateError } = await client
    .from("sites")
    .update({
      asset_count: normalized.assets.length,
      total_bytes: normalized.totalBytes,
      manifest_json: JSON.stringify(normalized.manifest),
      deployed_at: site.deployed_at ?? now,
      updated_at: now,
    })
    .eq("id", siteId)
    .select("*")
    .single<SiteRow>();
  if (updateError || !updatedSite) throw new Error(updateError?.message ?? "Site disappeared after deploy");

  return {
    site: updatedSite,
    publicUrl: `/s/${updatedSite.slug}/`,
  };
}

export async function deleteSiteAssets(env: Env, siteId: string): Promise<void> {
  const listed = await env.ASSET_BUCKET.list({ prefix: `${siteId}/` });
  if (listed.objects.length === 0) return;
  await Promise.all(listed.objects.map((object) => env.ASSET_BUCKET.delete(object.key)));
}

export function deployResponseBody(result: { site: SiteRow; publicUrl: string }) {
  return {
    site: mapSite(result.site),
    publicUrl: result.publicUrl,
  };
}

function parseManifestJson(manifestJson: string | null): StoredAssetManifest | null {
  if (!manifestJson) return null;
  return JSON.parse(manifestJson) as StoredAssetManifest;
}

async function deleteStaleAssets(
  env: Env,
  siteId: string,
  previous: StoredAssetManifest,
  next: StoredAssetManifest,
): Promise<void> {
  const nextPaths = new Set(Object.keys(next));
  const stalePaths = Object.keys(previous).filter((pathname) => !nextPaths.has(pathname));
  await Promise.all(stalePaths.map((pathname) => env.ASSET_BUCKET.delete(assetKey(siteId, pathname))));
}
