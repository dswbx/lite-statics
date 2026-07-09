export type AccessMode = "public" | "password";

export interface SiteSummary {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  accessMode: AccessMode;
  expiresAt: string | null;
  disabledAt: string | null;
  activeDeploymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentSummary {
  id: string;
  siteId: string;
  workerId: string;
  assetCount: number;
  totalBytes: number;
  createdAt: string;
  assets: DeploymentAssetSummary[];
}

export interface DeploymentAssetSummary {
  pathname: string;
  contentType: string;
  size: number;
}

export interface AssetManifestEntry {
  contentType: string;
  size: number;
  etag?: string;
}

export type StoredAssetManifest = Record<string, AssetManifestEntry>;

export interface AnalyticsRow {
  day: string;
  path: string;
  status: number;
  country: string;
  referrerHost: string;
  views: number;
}

export interface CreateSiteResponse {
  site: SiteSummary;
}

export interface DeploySiteResponse {
  site: SiteSummary;
  deployment: DeploymentSummary;
  publicUrl: string;
}

export interface SiteDetailResponse {
  site: SiteSummary;
  deployment: DeploymentSummary | null;
  analytics: AnalyticsRow[];
}
