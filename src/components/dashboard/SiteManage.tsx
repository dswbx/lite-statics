import {
  Activity,
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
import type { AnalyticsRow, SiteSummary } from "../../shared/types";
import { formatBytes, formatDate } from "../../lib/format";
import { siteDisplayStatus, siteHasUpload } from "../../lib/site";
import { AnalyticsPanel } from "../analytics/AnalyticsPanel";
import { UploadBox } from "../upload/UploadBox";
import { Metric } from "../ui/Metric";
import { AccessSettingsFields } from "./AccessSettingsFields";

export function SiteManage({
  site,
  analytics,
  publicUrl,
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
  analytics: AnalyticsRow[];
  publicUrl: string;
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
  const hasUpload = siteHasUpload(site);
  const [accessEditing, setAccessEditing] = useState(!hasUpload);
  const shownAssets = showAllAssets ? site.assets : site.assets.slice(0, 3);
  const extraAssetCount = Math.max(site.assets.length - shownAssets.length, 0);
  const status = siteDisplayStatus(site);
  const isDisabled = status.kind === "disabled";

  return (
    <section className="dashboardStack">
      <header className="siteHeader">
        <div>
          <p className="eyebrow">
            Site settings
            {site.accessMode === "password" && <LockKeyhole size={14} aria-label="Password protected" className="inlineLock" />}
          </p>
          <div className="siteTitleRow">
            <h1>{site.name}</h1>
            <span className={`statusPill ${status.kind}`}>{status.label}</span>
          </div>
          {isDisabled && <p className="disabledHint">This site is disabled. The public URL shows an inactive page until access is re-enabled.</p>}
          {hasUpload ? (
            <a href={publicUrl} target="_blank" rel="noreferrer">
              {publicUrl}
            </a>
          ) : (
            <span className="pendingLink">No public upload yet.</span>
          )}
        </div>
        <div className="siteActions">
          <a className={`primaryCta ${!hasUpload || isDisabled ? "disabled" : ""}`} href={hasUpload ? publicUrl : undefined} target="_blank" rel="noreferrer" aria-disabled={!hasUpload || isDisabled}>
            <ExternalLink size={18} /> Open site
          </a>
          <button type="button" className="copyIcon" disabled={!hasUpload || isDisabled} onClick={() => void navigator.clipboard.writeText(publicUrl)} aria-label="Copy public link">
            <Copy size={18} />
          </button>
        </div>
      </header>

      <div className="summaryGrid">
        <Metric icon={<FileText />} label="Current upload" value={hasUpload ? `${site.assetCount} files` : "None"} />
        <Metric icon={<FileArchive />} label="Size" value={hasUpload && site.totalBytes != null ? formatBytes(site.totalBytes) : "-"} />
        <Metric icon={<Activity />} label="Views" value={String(totalViews)} />
      </div>

      <div className="gridTwo">
        <section className="panel strong">
          <h3>
            <CheckCircle2 size={20} /> Uploaded state
          </h3>
          {hasUpload ? (
            <div className="uploadState">
              <strong>Live upload</strong>
              <span>
                {site.assetCount} assets, {site.totalBytes != null ? formatBytes(site.totalBytes) : "-"}
              </span>
              <span>Uploaded {site.deployedAt ? formatDate(site.deployedAt) : "-"}</span>
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
              {(site.assets.length > 3 || showAllAssets) && (
                <button type="button" className="textButton" onClick={() => setShowAllAssets((current) => !current)}>
                  {showAllAssets ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showAllAssets ? "Show fewer assets" : `Show ${extraAssetCount} more`}
                </button>
              )}
            </div>
          ) : (
            <p className="empty">Nothing has been uploaded for this site yet.</p>
          )}
          {hasUpload && !showReplacementUpload && (
            <button type="button" className="ghost" onClick={() => onShowReplacementUpload(true)}>
              <Upload size={18} /> Replace upload
            </button>
          )}
          {(!hasUpload || showReplacementUpload) && (
            <form onSubmit={onDeploy} className="replaceForm">
              <UploadBox file={replacementUpload} dragActive={dragActive} onChooseFile={onChooseReplacement} onDrag={onDrag} label="Replace with HTML or ZIP" />
              <div className="buttonRow">
                <button disabled={busy || !replacementUpload} type="submit">
                  <Upload size={18} /> Upload replacement
                </button>
                {hasUpload && (
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
            {hasUpload && !accessEditing && (
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
              <AccessSettingsFields
                defaultAccessMode={site.accessMode}
                defaultDisabled={Boolean(site.disabledAt)}
                busy={busy}
                onCancel={hasUpload ? () => setAccessEditing(false) : undefined}
              />
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
