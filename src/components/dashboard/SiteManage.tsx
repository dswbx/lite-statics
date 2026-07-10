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
import { Eyebrow } from "../ui/Eyebrow";
import { StatusPill } from "../ui/StatusPill";
import { PrimaryCta } from "../ui/PrimaryCta";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";

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
    <section className="grid gap-6 pt-[26px]">
      <header className="flex items-center justify-between gap-[18px] border-2 border-ink bg-surface p-5 shadow-brutal max-stack:flex-col max-stack:items-stretch">
        <div>
          <Eyebrow>
            Site settings
            {site.accessMode === "password" && (
              <LockKeyhole size={14} aria-label="Password protected" className="ml-1.5 inline-block align-[-2px]" />
            )}
          </Eyebrow>
          <div className="mb-1 flex flex-wrap items-center gap-2.5">
            <h1 className="mb-0 text-[clamp(2rem,4.5vw,4.2rem)]">{site.name}</h1>
            <StatusPill kind={status.kind}>{status.label}</StatusPill>
          </div>
          {isDisabled && (
            <p className="mb-2.5 max-w-[620px] font-[850] text-danger-hint">
              This site is disabled. The public URL shows an inactive page until access is re-enabled.
            </p>
          )}
          {hasUpload ? (
            <a href={publicUrl} target="_blank" rel="noreferrer">
              {publicUrl}
            </a>
          ) : (
            <span className="font-[850] text-muted">No public upload yet.</span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <PrimaryCta disabled={!hasUpload || isDisabled} href={hasUpload ? publicUrl : undefined} target="_blank" rel="noreferrer">
            <ExternalLink size={18} /> Open site
          </PrimaryCta>
          <Button
            type="button"
            variant="copy"
            disabled={!hasUpload || isDisabled}
            onClick={() => void navigator.clipboard.writeText(publicUrl)}
            aria-label="Copy public link"
          >
            <Copy size={18} />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-3 max-stack:grid-cols-1">
        <Metric icon={<FileText />} label="Current upload" value={hasUpload ? `${site.assetCount} files` : "None"} />
        <Metric icon={<FileArchive />} label="Size" value={hasUpload && site.totalBytes != null ? formatBytes(site.totalBytes) : "-"} />
        <Metric icon={<Activity />} label="Views" value={String(totalViews)} />
      </div>

      <div className="grid grid-cols-2 gap-[22px] max-stack:grid-cols-1">
        <Panel tone="strong">
          <h3>
            <CheckCircle2 size={20} /> Uploaded state
          </h3>
          {hasUpload ? (
            <div className="mb-[18px] grid gap-2 border-2 border-ink bg-sky-soft p-3.5">
              <strong>Live upload</strong>
              <span>
                {site.assetCount} assets, {site.totalBytes != null ? formatBytes(site.totalBytes) : "-"}
              </span>
              <span>Uploaded {site.deployedAt ? formatDate(site.deployedAt) : "-"}</span>
              <ul className="m-2 mt-0 grid list-none gap-2 p-0" aria-label="Uploaded assets">
                {shownAssets.map((asset) => (
                  <li key={asset.pathname} className="grid gap-0.5 border border-border-muted bg-cream p-2.5">
                    <span className="font-[850] [overflow-wrap:anywhere]">{asset.pathname}</span>
                    <small className="text-muted">
                      {asset.contentType} · {formatBytes(asset.size)}
                    </small>
                  </li>
                ))}
              </ul>
              {(site.assets.length > 3 || showAllAssets) && (
                <Button type="button" variant="text" onClick={() => setShowAllAssets((current) => !current)}>
                  {showAllAssets ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showAllAssets ? "Show fewer assets" : `Show ${extraAssetCount} more`}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-[0.92rem] leading-normal text-hint">Nothing has been uploaded for this site yet.</p>
          )}
          {hasUpload && !showReplacementUpload && (
            <Button type="button" variant="ghost" onClick={() => onShowReplacementUpload(true)}>
              <Upload size={18} /> Replace upload
            </Button>
          )}
          {(!hasUpload || showReplacementUpload) && (
            <form onSubmit={onDeploy} className="grid gap-3">
              <UploadBox
                file={replacementUpload}
                dragActive={dragActive}
                onChooseFile={onChooseReplacement}
                onDrag={onDrag}
                label="Replace with HTML or ZIP"
              />
              <div className="flex flex-wrap items-center gap-2.5">
                <Button disabled={busy || !replacementUpload} type="submit">
                  <Upload size={18} /> Upload replacement
                </Button>
                {hasUpload && (
                  <Button type="button" variant="ghost" onClick={() => onShowReplacementUpload(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}
        </Panel>

        <Panel tone="strong">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <h3>
              <LockKeyhole size={20} /> Access and expiry
            </h3>
            {hasUpload && !accessEditing && (
              <Button type="button" variant="copy" onClick={() => setAccessEditing(true)} aria-label="Edit access settings">
                <Pencil size={17} />
              </Button>
            )}
          </div>
          {!accessEditing ? (
            <div className="grid gap-2.5">
              <div className="flex justify-between gap-4 border-2 border-ink bg-sky-soft p-3">
                <span className="text-[0.82rem] font-black uppercase text-muted">Access</span>
                <strong className="text-right">{site.accessMode === "password" ? "Password protected" : "Public"}</strong>
              </div>
              <div className="flex justify-between gap-4 border-2 border-ink bg-sky-soft p-3">
                <span className="text-[0.82rem] font-black uppercase text-muted">Expiry</span>
                <strong className="text-right">{site.expiresAt ? formatDate(site.expiresAt) : "No expiry set"}</strong>
              </div>
              <div className="flex justify-between gap-4 border-2 border-ink bg-sky-soft p-3">
                <span className="text-[0.82rem] font-black uppercase text-muted">Status</span>
                <strong className="text-right">{site.disabledAt ? "Disabled" : "Active"}</strong>
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
        </Panel>
      </div>

      <AnalyticsPanel analytics={analytics} />

      <section className="flex items-center justify-between gap-[18px] border-2 border-ink bg-warm p-5 shadow-brutal max-stack:flex-col max-stack:items-stretch">
        <div>
          <h3 className="mb-1.5">
            <Trash2 size={20} /> Delete site
          </h3>
          <p className="mb-0 text-danger-text">This removes the site from your dashboard and disables the public URL.</p>
        </div>
        <Button type="button" variant="danger" onClick={() => onDelete(site)}>
          <Trash2 size={18} /> Delete site
        </Button>
      </section>
    </section>
  );
}
