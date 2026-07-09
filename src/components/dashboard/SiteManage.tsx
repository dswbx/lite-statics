import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FileArchive,
  FileText,
  LockKeyhole,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import type { AnalyticsRow, DeploymentSummary, SiteSummary } from "../../shared/types";
import { formatBytes, formatDate } from "../../lib/format";
import { siteDisplayStatus } from "../../lib/site";
import { AnalyticsPanel } from "../analytics/AnalyticsPanel";
import { UploadBox } from "../upload/UploadBox";
import { Metric } from "../ui/Metric";

export function SiteManage({
  site,
  deployment,
  analytics,
  publicUrl,
  hasDeployment,
  replacementUpload,
  showReplacementUpload,
  busy,
  totalViews,
  dragActive,
  onChooseReplacement,
  onShowReplacementUpload,
  onDrag,
  onDeploy,
  onUpdateAccess,
  onDelete,
}: {
  site: SiteSummary;
  deployment: DeploymentSummary | null;
  analytics: AnalyticsRow[];
  publicUrl: string;
  hasDeployment: boolean;
  replacementUpload: File | null;
  showReplacementUpload: boolean;
  busy: boolean;
  totalViews: number;
  dragActive: boolean;
  onChooseReplacement: (file: File | undefined) => void;
  onShowReplacementUpload: (show: boolean) => void;
  onDrag: (active: boolean) => void;
  onDeploy: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateAccess: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onDelete: (site: SiteSummary) => void;
}) {
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [accessEditing, setAccessEditing] = useState(!hasDeployment);
  const shownAssets = showAllAssets ? (deployment?.assets ?? []) : (deployment?.assets.slice(0, 3) ?? []);
  const extraAssetCount = Math.max((deployment?.assets.length ?? 0) - shownAssets.length, 0);
  const status = siteDisplayStatus(site);
  const isDisabled = status.kind === "disabled";

  return (
    <section className="dashboardStack">
      <header className="siteHeader">
        <div>
          <p className="eyebrow">Site settings</p>
          <div className="siteTitleRow">
            <h1>{site.name}</h1>
            <span className={`statusPill ${status.kind}`}>{status.label}</span>
          </div>
          {isDisabled && <p className="disabledHint">This site is disabled. The public URL shows an inactive page until access is re-enabled.</p>}
          {hasDeployment ? (
            <a href={publicUrl} target="_blank" rel="noreferrer">
              {publicUrl}
            </a>
          ) : (
            <span className="pendingLink">No public upload yet.</span>
          )}
        </div>
        <div className="siteActions">
          <a className={`primaryCta ${!hasDeployment || isDisabled ? "disabled" : ""}`} href={hasDeployment ? publicUrl : undefined} target="_blank" rel="noreferrer" aria-disabled={!hasDeployment || isDisabled}>
            <ExternalLink size={18} /> Open site
          </a>
          <button type="button" className="copyIcon" disabled={!hasDeployment || isDisabled} onClick={() => void navigator.clipboard.writeText(publicUrl)} aria-label="Copy public link">
            <Copy size={18} />
          </button>
        </div>
      </header>

      <div className="summaryGrid">
        <Metric icon={<FileText />} label="Current upload" value={deployment ? `${deployment.assetCount} files` : "None"} />
        <Metric icon={<FileArchive />} label="Size" value={deployment ? formatBytes(deployment.totalBytes) : "-"} />
        <Metric icon={<Activity />} label="Views" value={String(totalViews)} />
      </div>

      <div className="gridTwo">
        <section className="panel strong">
          <h3>
            <CheckCircle2 size={20} /> Uploaded state
          </h3>
          {deployment ? (
            <div className="uploadState">
              <strong>Live upload</strong>
              <span>
                {deployment.assetCount} assets, {formatBytes(deployment.totalBytes)}
              </span>
              <span>Uploaded {formatDate(deployment.createdAt)}</span>
              <ul className="assetList" aria-label="Uploaded assets">
                {shownAssets.map((asset) => (
                  <li key={asset.pathname}>
                    <span>{asset.pathname}</span>
                    <small>
                      {asset.contentType} · {formatBytes(asset.size)}
                    </small>
                  </li>
                ))}
              </ul>
              {(deployment.assets.length > 3 || showAllAssets) && (
                <button type="button" className="textButton" onClick={() => setShowAllAssets((current) => !current)}>
                  {showAllAssets ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showAllAssets ? "Show fewer assets" : `Show ${extraAssetCount} more`}
                </button>
              )}
            </div>
          ) : (
            <p className="empty">Nothing has been uploaded for this site yet.</p>
          )}
          {hasDeployment && !showReplacementUpload && (
            <button type="button" className="ghost" onClick={() => onShowReplacementUpload(true)}>
              <Upload size={18} /> Replace upload
            </button>
          )}
          {(!hasDeployment || showReplacementUpload) && (
            <form onSubmit={onDeploy} className="replaceForm">
              <UploadBox file={replacementUpload} dragActive={dragActive} onChooseFile={onChooseReplacement} onDrag={onDrag} label="Replace with HTML or ZIP" />
              <div className="buttonRow">
                <button disabled={busy || !replacementUpload} type="submit">
                  <Upload size={18} /> Upload replacement
                </button>
                {hasDeployment && (
                  <button type="button" className="ghost" onClick={() => onShowReplacementUpload(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

        <section className="panel strong">
          <div className="panelTitleRow">
            <h3>
              <LockKeyhole size={20} /> Access and expiry
            </h3>
            {hasDeployment && !accessEditing && (
              <button type="button" className="copyIcon" onClick={() => setAccessEditing(true)} aria-label="Edit access settings">
                <Pencil size={17} />
              </button>
            )}
          </div>
          {!accessEditing ? (
            <div className="readOnlySettings">
              <div>
                <span>Access</span>
                <strong>{site.accessMode === "password" ? "Password protected" : "Public"}</strong>
              </div>
              <div>
                <span>Expiry</span>
                <strong>{site.expiresAt ? formatDate(site.expiresAt) : "No expiry set"}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{site.disabledAt ? "Disabled" : "Active"}</strong>
              </div>
            </div>
          ) : (
            <form
              key={site.id}
              onSubmit={async (event) => {
                await onUpdateAccess(event);
                setAccessEditing(false);
              }}
            >
              <div className="segmented">
                <label>
                  <input type="radio" name="accessMode" value="public" defaultChecked={site.accessMode === "public"} /> Public
                </label>
                <label>
                  <input type="radio" name="accessMode" value="password" defaultChecked={site.accessMode === "password"} /> Password
                </label>
              </div>
              <label>
                Password
                <input name="password" type="password" placeholder="Required when password mode is selected" />
              </label>
              <label>
                Active until
                <input name="expiresAt" type="datetime-local" />
              </label>
              <label className="check">
                <input name="disabled" type="checkbox" defaultChecked={Boolean(site.disabledAt)} /> Disable now
              </label>
              <div className="buttonRow">
                <button disabled={busy} type="submit">
                  <CalendarClock size={18} /> Save settings
                </button>
                {hasDeployment && (
                  <button type="button" className="ghost" onClick={() => setAccessEditing(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      </div>

      <AnalyticsPanel analytics={analytics} />

      <section className="dangerZone">
        <div>
          <h3>
            <Trash2 size={20} /> Delete site
          </h3>
          <p>This removes the site from your dashboard and disables the public URL.</p>
        </div>
        <button type="button" className="dangerButton" onClick={() => onDelete(site)}>
          <Trash2 size={18} /> Delete site
        </button>
      </section>
    </section>
  );
}
