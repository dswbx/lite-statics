export type AccessMode = "public" | "password";

export interface SiteAssetSummary {
  pathname: string;
  contentType: string;
  size: number;
}

export interface SiteSummary {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  accessMode: AccessMode;
  expiresAt: string | null;
  disabledAt: string | null;
  assetCount: number | null;
  totalBytes: number | null;
  deployedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assets: SiteAssetSummary[];
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
  publicUrl: string;
}

export interface SiteDetailResponse {
  site: SiteSummary;
  analytics: AnalyticsRow[];
}
