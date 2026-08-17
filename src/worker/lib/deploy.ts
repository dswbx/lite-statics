import type { SupabaseClient } from "@supabase/supabase-js";
import { mapSite, type SiteRow } from "../../shared/mappers";
import type { StoredAssetManifest } from "../../shared/types";
import { normalizeUpload } from "../upload";
import { SITE_ASSETS_BUCKET } from "../storage/constants";
import { assetKey, sitePrefix } from "./storage";

async function ensureSiteAssetsBucket(client: SupabaseClient): Promise<void> {
  const { data, error: listError } = await client.storage.listBuckets();
  if (listError) throw new Error(listError.message);
  if (data?.some((bucket) => bucket.id === SITE_ASSETS_BUCKET)) return;

  const { error: createError } = await client.storage.createBucket(SITE_ASSETS_BUCKET, {
    public: false,
  });
  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(createError.message);
  }
}

export async function getSiteBySlug(client: SupabaseClient, slug: string): Promise<SiteRow | null> {
  const { data: site, error } = await client.from("sites").select("*").eq("slug", slug).maybeSingle<SiteRow>();
  if (error || !site) return null;
  return site;
}

export async function deploySite(
  client: SupabaseClient,
  siteId: string,
  file: File,
): Promise<{ site: SiteRow; publicUrl: string }> {
  const { data: site, error: siteError } = await client.from("sites").select("*").eq("id", siteId).single<SiteRow>();
  if (siteError || !site) throw new Error("Site not found");

  const normalized = await normalizeUpload(file);
  const previousManifest = parseManifestJson(site.manifest_json);
  await ensureSiteAssetsBucket(client);
  const bucket = client.storage.from(SITE_ASSETS_BUCKET);

  await Promise.all(
    normalized.assets.map(async (asset) => {
      const { error } = await bucket.upload(assetKey(siteId, asset.pathname), asset.bytes, {
        contentType: asset.contentType,
        upsert: true,
      });
      if (error) throw new Error(error.message);
    }),
  );

  if (previousManifest) {
    await deleteStaleAssets(client, siteId, previousManifest, normalized.manifest);
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

export async function deleteSiteAssets(client: SupabaseClient, siteId: string): Promise<void> {
  const paths = await listStoredObjectPaths(client, siteId);
  if (paths.length === 0) return;

  const { error } = await client.storage.from(SITE_ASSETS_BUCKET).remove(paths);
  if (error) throw new Error(error.message);
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
  client: SupabaseClient,
  siteId: string,
  previous: StoredAssetManifest,
  next: StoredAssetManifest,
): Promise<void> {
  const nextPaths = new Set(Object.keys(next));
  const stalePaths = Object.keys(previous)
    .filter((pathname) => !nextPaths.has(pathname))
    .map((pathname) => assetKey(siteId, pathname));
  if (stalePaths.length === 0) return;

  const { error } = await client.storage.from(SITE_ASSETS_BUCKET).remove(stalePaths);
  if (error) throw new Error(error.message);
}

async function listStoredObjectPaths(client: SupabaseClient, siteId: string): Promise<string[]> {
  const prefix = sitePrefix(siteId);
  const paths: string[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await client.storage.from(SITE_ASSETS_BUCKET).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    for (const item of data) {
      if (item.id !== null) {
        paths.push(`${prefix}${item.name}`);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return paths;
}
