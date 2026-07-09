import type { AccessMode, AnalyticsRow, DeploymentAssetSummary, DeploymentSummary, SiteSummary, StoredAssetManifest } from "../shared/types";
import { hashPassword, randomId, verifyPassword } from "./crypto";

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  password_salt: string | null;
  created_at: string;
}

interface SiteRow {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  access_mode: AccessMode;
  password_hash: string | null;
  password_salt: string | null;
  expires_at: string | null;
  disabled_at: string | null;
  active_deployment_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DeploymentRow {
  id: string;
  site_id: string;
  worker_id: string;
  asset_count: number;
  total_bytes: number;
  manifest_json: string;
  created_at: string;
}

interface AnalyticsDbRow {
  day: string;
  path: string;
  status: number;
  country: string;
  referrer_host: string;
  views: number;
}

export interface SiteAccessRecord {
  site: SiteRow;
  deployment: DeploymentRow | null;
}

export function toSiteSummary(row: SiteRow): SiteSummary {
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

export function toDeploymentSummary(row: DeploymentRow): DeploymentSummary {
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

export async function createUserWithPassword(db: D1Database, email: string, password: string): Promise<{ id: string; email: string }> {
  const normalized = email.trim().toLowerCase();
  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(normalized).first<{ id: string }>();
  if (existing) throw new Error("An account already exists for that email.");
  const id = randomId("usr");
  const hashed = await hashPassword(password);
  await db
    .prepare("INSERT INTO users (id, email, password_hash, password_salt) VALUES (?, ?, ?, ?)")
    .bind(id, normalized, hashed.hash, hashed.salt)
    .run();
  return { id, email: normalized };
}

export async function signInUser(db: D1Database, email: string, password: string): Promise<{ id: string; email: string }> {
  const normalized = email.trim().toLowerCase();
  const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(normalized).first<UserRow>();
  if (!user?.password_hash || !user.password_salt) throw new Error("No account exists for that email.");
  if (!(await verifyPassword(password, user.password_salt, user.password_hash))) {
    throw new Error("Email or password did not match.");
  }
  return { id: user.id, email: user.email };
}

export async function getOrCreateUser(db: D1Database, email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(normalized).first<{ id: string }>();
  if (existing) return existing.id;
  const id = randomId("usr");
  await db.prepare("INSERT INTO users (id, email) VALUES (?, ?)").bind(id, normalized).run();
  return id;
}

export async function listSites(db: D1Database, ownerEmail: string): Promise<SiteSummary[]> {
  const normalized = ownerEmail.trim().toLowerCase();
  const owner = await db.prepare("SELECT id FROM users WHERE email = ?").bind(normalized).first<{ id: string }>();
  if (!owner) return [];
  const rows = await db
    .prepare("SELECT * FROM sites WHERE owner_id = ? ORDER BY created_at DESC")
    .bind(owner.id)
    .all<SiteRow>();
  return rows.results.map(toSiteSummary);
}

export async function createSite(db: D1Database, ownerEmail: string, name: string, slug: string): Promise<SiteSummary> {
  const normalized = ownerEmail.trim().toLowerCase();
  const owner = await db.prepare("SELECT id FROM users WHERE email = ?").bind(normalized).first<{ id: string }>();
  if (!owner) throw new Error("Sign in before creating a site.");
  const id = randomId("site");
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sites (id, owner_id, slug, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, owner.id, slug, name, now, now)
    .run();
  const site = await getSiteById(db, id);
  if (!site) throw new Error("Created site could not be loaded.");
  return toSiteSummary(site);
}

export async function getSiteById(db: D1Database, siteId: string): Promise<SiteRow | null> {
  return db.prepare("SELECT * FROM sites WHERE id = ?").bind(siteId).first<SiteRow>();
}

export async function deleteSite(db: D1Database, siteId: string): Promise<boolean> {
  const result = await db.prepare("DELETE FROM sites WHERE id = ?").bind(siteId).run();
  return result.meta.changes > 0;
}

export async function getSiteBySlug(db: D1Database, slug: string): Promise<SiteAccessRecord | null> {
  const site = await db.prepare("SELECT * FROM sites WHERE slug = ?").bind(slug).first<SiteRow>();
  if (!site) return null;
  const deployment = site.active_deployment_id
    ? await db.prepare("SELECT * FROM deployments WHERE id = ?").bind(site.active_deployment_id).first<DeploymentRow>()
    : null;
  return { site, deployment };
}

export async function getDeployment(db: D1Database, deploymentId: string): Promise<DeploymentRow | null> {
  return db.prepare("SELECT * FROM deployments WHERE id = ?").bind(deploymentId).first<DeploymentRow>();
}

export async function saveDeployment(
  db: D1Database,
  siteId: string,
  deploymentId: string,
  workerId: string,
  manifest: StoredAssetManifest,
  assetCount: number,
  totalBytes: number,
): Promise<DeploymentSummary> {
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `INSERT INTO deployments (id, site_id, worker_id, asset_count, total_bytes, manifest_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(deploymentId, siteId, workerId, assetCount, totalBytes, JSON.stringify(manifest), now),
    db.prepare("UPDATE sites SET active_deployment_id = ?, updated_at = ? WHERE id = ?").bind(deploymentId, now, siteId),
  ]);
  const deployment = await getDeployment(db, deploymentId);
  if (!deployment) throw new Error("Deployment could not be loaded after saving.");
  return toDeploymentSummary(deployment);
}

export async function updateAccess(
  db: D1Database,
  siteId: string,
  accessMode: AccessMode,
  passwordHash: string | null,
  passwordSalt: string | null,
  expiresAt: string | null,
  disabled: boolean,
): Promise<SiteSummary> {
  const now = new Date().toISOString();
  const disabledAt = disabled ? now : null;
  await db
    .prepare(
      `UPDATE sites
       SET access_mode = ?, password_hash = ?, password_salt = ?, expires_at = ?, disabled_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(accessMode, passwordHash, passwordSalt, expiresAt, disabledAt, now, siteId)
    .run();
  const site = await getSiteById(db, siteId);
  if (!site) throw new Error("Site not found after access update.");
  return toSiteSummary(site);
}

export async function getSiteDetail(db: D1Database, siteId: string): Promise<{
  site: SiteSummary;
  deployment: DeploymentSummary | null;
  analytics: AnalyticsRow[];
} | null> {
  const site = await getSiteById(db, siteId);
  if (!site) return null;
  const deployment = site.active_deployment_id ? await getDeployment(db, site.active_deployment_id) : null;
  const analyticsRows = await db
    .prepare("SELECT day, path, status, country, referrer_host, views FROM analytics_daily WHERE site_id = ? ORDER BY day DESC, views DESC LIMIT 100")
    .bind(siteId)
    .all<AnalyticsDbRow>();
  return {
    site: toSiteSummary(site),
    deployment: deployment ? toDeploymentSummary(deployment) : null,
    analytics: analyticsRows.results.map((row) => ({
      day: row.day,
      path: row.path,
      status: row.status,
      country: row.country,
      referrerHost: row.referrer_host,
      views: row.views,
    })),
  };
}

export async function recordAnalytics(
  db: D1Database,
  siteId: string,
  request: Request,
  pathname: string,
  status: number,
): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const country = request.cf?.country ? String(request.cf.country) : "unknown";
  const referrerHost = referrerHostFrom(request.headers.get("referer"));
  await db
    .prepare(
      `INSERT INTO analytics_daily (site_id, day, path, status, country, referrer_host, views)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(site_id, day, path, status, country, referrer_host)
       DO UPDATE SET views = views + 1`,
    )
    .bind(siteId, day, pathname, status, country, referrerHost)
    .run();
}

export function parseManifest(row: DeploymentRow): StoredAssetManifest {
  return JSON.parse(row.manifest_json) as StoredAssetManifest;
}

function referrerHostFrom(value: string | null): string {
  if (!value) return "direct";
  try {
    return new URL(value).host || "direct";
  } catch {
    return "direct";
  }
}
