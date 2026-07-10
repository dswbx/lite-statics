import {
   CheckCircle2,
   ChevronDown,
   ChevronUp,
   ExternalLink,
   File,
   Globe,
   Lock,
   Pencil,
   Trash2,
   Upload,
} from "lucide-react";
import { useState } from "react";
import type { AnalyticsRow, SiteSummary } from "../../shared/types";
import { formatBytes, formatDate } from "../../lib/format";
import { siteDisplayStatus, siteHasUpload } from "../../lib/site";
import { cn } from "../../lib/cn";
import { AnalyticsPanel } from "../analytics/AnalyticsPanel";
import { UploadBox } from "../upload/UploadBox";
import { Metric } from "../ui/metric";
import { AccessSettingsFields } from "./AccessSettingsFields";
import { Button } from "../ui/button";
import { PrimaryCta } from "../ui/primary-cta";
import { Badge } from "../ui/badge";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "../ui/card";
import { ConfirmDialog } from "../ui/confirm-dialog";

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
   const [deleteOpen, setDeleteOpen] = useState(false);
   const hasUpload = siteHasUpload(site);
   const [accessEditing, setAccessEditing] = useState(!hasUpload);
   const shownAssets = showAllAssets ? site.assets : site.assets.slice(0, 3);
   const extraAssetCount = Math.max(site.assets.length - shownAssets.length, 0);
   const status = siteDisplayStatus(site);
   const isDisabled = status.kind === "disabled";

   const sizeText = formatBytes(site.totalBytes ?? 0);
   const [sizeValue, ...sizeUnitParts] = sizeText.split(" ");
   const sizeUnit = sizeUnitParts.join(" ");

   return (
      <div>
         <header className="border-b border-line px-8 py-7 max-stack:px-5 max-stack:py-5">
            <div className="flex items-start justify-between gap-6 max-stack:flex-col">
               <div className="flex flex-col gap-2.5">
                  <div className="font-mono text-[12px] text-muted">
                     sites / <span className="text-ink">{site.slug}</span>
                  </div>
                  <div className="flex items-center gap-3.5 flex-wrap">
                     <h1 className="font-mono text-[40px] max-stack:text-[32px] leading-none font-semibold tracking-[-0.035em]">
                        {site.name}
                     </h1>
                     {isDisabled ? (
                        <Badge variant="muted">disabled</Badge>
                     ) : hasUpload ? (
                        <Badge variant="accent">
                           <span className="size-1.5 rounded-full bg-accent" />
                           live
                        </Badge>
                     ) : (
                        <Badge variant="outline">no upload</Badge>
                     )}
                  </div>
               </div>
               <div className="flex items-center gap-2.5 max-stack:w-full">
                  <span className="inline-flex items-center font-mono text-[13px] text-accent bg-surface border border-line px-3.5 py-2 rounded-lg">
                     /s/{site.slug}/
                  </span>
                  <PrimaryCta
                     disabled={!hasUpload || isDisabled}
                     href={hasUpload ? publicUrl : undefined}
                     target="_blank"
                     rel="noreferrer"
                  >
                     <ExternalLink size={16} strokeWidth={2} /> Open site
                  </PrimaryCta>
               </div>
            </div>
         </header>

         <div className="px-8 py-7 max-stack:px-5 max-stack:py-5 flex flex-col gap-3.5">
            <div className="grid grid-cols-3 gap-3.5 max-stack:grid-cols-3">
               <Metric label="files" value={site.assetCount || 0} />
               <Metric label="size" value={sizeValue} unit={sizeUnit} />
               <Metric label="views" value={totalViews} />
            </div>

            <div className="grid grid-cols-2 gap-3.5 max-stack:grid-cols-1">
               <Card>
                  <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <CheckCircle2
                           size={18}
                           strokeWidth={2}
                           className="text-accent"
                        />
                        Uploaded state
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                     {hasUpload ? (
                        <>
                           <div className="rounded-[10px] border border-line bg-paper p-4">
                              <div className="font-semibold text-[15px]">
                                 Live upload
                              </div>
                              <div className="font-mono text-[12px] text-muted leading-[1.7] mt-2">
                                 {site.assetCount} asset
                                 {site.assetCount === 1 ? "" : "s"} ·{" "}
                                 {formatBytes(site.totalBytes ?? 0)}
                                 <br />
                                 uploaded{" "}
                                 {formatDate(
                                    site.deployedAt ?? site.createdAt
                                 )}
                              </div>
                           </div>
                           {shownAssets.map((asset) => (
                              <div
                                 key={asset.pathname}
                                 className="rounded-lg border border-line bg-surface px-3.5 py-2.5 flex items-center gap-2.5"
                              >
                                 <File
                                    size={16}
                                    strokeWidth={2}
                                    className="text-accent shrink-0"
                                 />
                                 <span className="font-mono text-[12px] break-all">
                                    {asset.pathname} · {asset.contentType} ·{" "}
                                    {formatBytes(asset.size)}
                                 </span>
                              </div>
                           ))}
                           {(site.assets.length > 3 || showAllAssets) && (
                              <Button
                                 type="button"
                                 variant="ghost"
                                 size="sm"
                                 className="w-fit"
                                 onClick={() =>
                                    setShowAllAssets((current) => !current)
                                 }
                              >
                                 {showAllAssets ? (
                                    <ChevronUp size={16} strokeWidth={2} />
                                 ) : (
                                    <ChevronDown size={16} strokeWidth={2} />
                                 )}
                                 {showAllAssets
                                    ? "Show fewer assets"
                                    : `Show ${extraAssetCount} more`}
                              </Button>
                           )}
                        </>
                     ) : (
                        <p className="text-sm text-muted">
                           Nothing has been uploaded for this site yet.
                        </p>
                     )}

                     {hasUpload && !showReplacementUpload && (
                        <Button
                           type="button"
                           variant="outline"
                           onClick={() => onShowReplacementUpload(true)}
                        >
                           <Upload size={16} strokeWidth={2} /> Replace upload
                        </Button>
                     )}
                     {(!hasUpload || showReplacementUpload) && (
                        <form onSubmit={onDeploy} className="flex flex-col gap-3">
                           <UploadBox
                              file={replacementUpload}
                              dragActive={dragActive}
                              onChooseFile={onChooseReplacement}
                              onDrag={onDrag}
                              label="Replace with HTML or ZIP"
                           />
                           <div className="flex flex-wrap items-center gap-2.5">
                              <Button
                                 disabled={busy || !replacementUpload}
                                 type="submit"
                              >
                                 <Upload size={16} strokeWidth={2} /> Upload
                                 replacement
                              </Button>
                              {hasUpload && (
                                 <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                       onShowReplacementUpload(false)
                                    }
                                 >
                                    Cancel
                                 </Button>
                              )}
                           </div>
                        </form>
                     )}
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader className="flex-row items-center justify-between">
                     <CardTitle className="flex items-center gap-2">
                        <Lock
                           size={18}
                           strokeWidth={2}
                           className="text-accent"
                        />
                        Access & expiry
                     </CardTitle>
                     {hasUpload && !accessEditing && (
                        <Button
                           type="button"
                           variant="ghost"
                           size="icon"
                           onClick={() => setAccessEditing(true)}
                           aria-label="Edit access settings"
                        >
                           <Pencil size={16} strokeWidth={2} />
                        </Button>
                     )}
                  </CardHeader>
                  <CardContent>
                     {!accessEditing ? (
                        <div className="flex flex-col gap-2.5">
                           <div className="rounded-lg border border-line bg-paper px-3.5 py-3 flex items-center justify-between text-sm">
                              <span className="text-muted">access</span>
                              <span className="flex items-center gap-1.5 font-medium">
                                 {site.accessMode === "password" ? (
                                    <Lock size={14} strokeWidth={2} />
                                 ) : (
                                    <Globe size={14} strokeWidth={2} />
                                 )}
                                 {site.accessMode === "password"
                                    ? "Password"
                                    : "Public"}
                              </span>
                           </div>
                           <div className="rounded-lg border border-line bg-paper px-3.5 py-3 flex items-center justify-between text-sm">
                              <span className="text-muted">expiry</span>
                              <span className="font-medium">
                                 {site.expiresAt
                                    ? formatDate(site.expiresAt)
                                    : "no expiry set"}
                              </span>
                           </div>
                           <div className="rounded-lg border border-line bg-paper px-3.5 py-3 flex items-center justify-between text-sm">
                              <span className="text-muted">status</span>
                              <span className="flex items-center gap-1.5 font-medium">
                                 <span
                                    className={cn(
                                       "size-1.5 rounded-full",
                                       site.disabledAt
                                          ? "bg-muted"
                                          : "bg-accent"
                                    )}
                                 />
                                 {site.disabledAt ? "Disabled" : "Active"}
                              </span>
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
                              onCancel={
                                 hasUpload
                                    ? () => setAccessEditing(false)
                                    : undefined
                              }
                           />
                        </form>
                     )}
                  </CardContent>
               </Card>
            </div>

            <AnalyticsPanel analytics={analytics} />

            <div className="rounded-[14px] border border-danger-border bg-danger-bg p-5 flex items-center justify-between gap-4 max-stack:flex-col max-stack:items-start">
               <div>
                  <div className="font-semibold text-danger">Delete site</div>
                  <p className="text-[13px] text-danger/80 mt-1">
                     Permanently remove this deployment and disable its public
                     URL.
                  </p>
               </div>
               <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
               >
                  <Trash2 size={16} strokeWidth={2} /> Delete site
               </Button>
               <ConfirmDialog
                  open={deleteOpen}
                  onOpenChange={setDeleteOpen}
                  title="Delete this site?"
                  description="This permanently removes the deployment and disables its public URL. This cannot be undone."
                  confirmLabel="Delete site"
                  confirmIcon={<Trash2 size={16} strokeWidth={2} />}
                  destructive
                  onConfirm={() => onDelete(site)}
               />
            </div>
         </div>
      </div>
   );
}
