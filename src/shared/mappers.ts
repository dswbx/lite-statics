import type { AnalyticsRow, DeploymentAssetSummary, DeploymentSummary, SiteSummary, StoredAssetManifest } from "./types";

export interface SiteRow {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  access_mode: "public" | "password";
  password_hash: string | null;
  password_salt: string | null;
  expires_at: string | null;
  disabled_at: string | null;
  active_deployment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeploymentRow {
  id: string;
  site_id: string;
  worker_id: string;
  asset_count: number;
  total_bytes: number;
  manifest_json: string;
  created_at: string;
}

export interface AnalyticsDbRow {
  day: string;
  path: string;
  status: number;
  country: string;
  referrer_host: string;
  views: number;
}

export function mapSite(row: SiteRow): SiteSummary {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    name: row.name,
    accessMode: row.access_mode,
    expiresAt: row.expires_at,
    disabledAt: row.disabled_at,
    activeDeploymentId: row.active_deployment_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function assetsFromManifest(manifestJson: string): DeploymentAssetSummary[] {
  const manifest = JSON.parse(manifestJson) as StoredAssetManifest;
  return Object.entries(manifest)
    .map(([pathname, entry]) => ({ pathname, contentType: entry.contentType, size: entry.size }))
    .sort((left, right) => {
      if (left.pathname === "/index.html") return -1;
      if (right.pathname === "/index.html") return 1;
      return left.pathname.localeCompare(right.pathname);
    });
}

export function mapDeployment(row: DeploymentRow): DeploymentSummary {
  return {
    id: row.id,
    siteId: row.site_id,
    workerId: row.worker_id,
    assetCount: row.asset_count,
    totalBytes: row.total_bytes,
    createdAt: row.created_at,
    assets: assetsFromManifest(row.manifest_json),
  };
}

export function mapAnalytics(row: AnalyticsDbRow): AnalyticsRow {
  return {
    day: row.day,
    path: row.path,
    status: row.status,
    country: row.country,
    referrerHost: row.referrer_host,
    views: row.views,
  };
}
