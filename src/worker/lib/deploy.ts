import type { SupabaseClient } from "@supabase/supabase-js";
import { assetKey } from "../assets";
import { sha256Hex } from "../crypto";
import type { Env } from "../env";
import { mapDeployment, mapSite, type DeploymentRow, type SiteRow } from "../../shared/mappers";
import type { StoredAssetManifest } from "../../shared/types";
import { normalizeUpload } from "../upload";

export interface SiteAccessRecord {
  site: SiteRow;
  deployment: DeploymentRow | null;
}

export async function getSiteBySlug(client: SupabaseClient, slug: string): Promise<SiteAccessRecord | null> {
  const { data: site, error } = await client.from("sites").select("*").eq("slug", slug).maybeSingle<SiteRow>();
  if (error || !site) return null;
  if (!site.active_deployment_id) return { site, deployment: null };
  const { data: deployment } = await client
    .from("deployments")
    .select("*")
    .eq("id", site.active_deployment_id)
    .maybeSingle<DeploymentRow>();
  return { site, deployment: deployment ?? null };
}

export async function deploySite(
  env: Env,
  client: SupabaseClient,
  siteId: string,
  file: File,
): Promise<{ site: SiteRow; deployment: DeploymentRow; publicUrl: string }> {
  const { data: site, error: siteError } = await client.from("sites").select("*").eq("id", siteId).single<SiteRow>();
  if (siteError || !site) throw new Error("Site not found");

  const normalized = await normalizeUpload(file);
  const deploymentId = crypto.randomUUID();
  const workerId = `${siteId}:${deploymentId}:${await sha256Hex(JSON.stringify(normalized.manifest))}`;

  await Promise.all(
    normalized.assets.map((asset) =>
      env.ASSET_BUCKET.put(assetKey(siteId, deploymentId, asset.pathname), asset.bytes, {
        httpMetadata: { contentType: asset.contentType },
      }),
    ),
  );

  const now = new Date().toISOString();
  const { data: deployment, error: deploymentError } = await client
    .from("deployments")
    .insert({
      id: deploymentId,
      site_id: siteId,
      worker_id: workerId,
      asset_count: normalized.assets.length,
      total_bytes: normalized.totalBytes,
      manifest_json: JSON.stringify(normalized.manifest),
      created_at: now,
    })
    .select("*")
    .single<DeploymentRow>();
  if (deploymentError || !deployment) throw new Error(deploymentError?.message ?? "Deployment could not be saved.");

  const { data: updatedSite, error: updateError } = await client
    .from("sites")
    .update({ active_deployment_id: deploymentId, updated_at: now })
    .eq("id", siteId)
    .select("*")
    .single<SiteRow>();
  if (updateError || !updatedSite) throw new Error(updateError?.message ?? "Site disappeared after deploy");

  return {
    site: updatedSite,
    deployment,
    publicUrl: `/s/${updatedSite.slug}/`,
  };
}

export function deployResponseBody(result: { site: SiteRow; deployment: DeploymentRow; publicUrl: string }) {
  return {
    site: mapSite(result.site),
    deployment: mapDeployment(result.deployment),
    publicUrl: result.publicUrl,
  };
}

export function parseManifest(row: DeploymentRow): StoredAssetManifest {
  return JSON.parse(row.manifest_json) as StoredAssetManifest;
}
