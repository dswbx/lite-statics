import { Lock, Rocket } from "lucide-react";
import { PreviewAssetList } from "../upload/PreviewAssetList";
import { UploadBox } from "../upload/UploadBox";
import { titleFromFile, type PreviewAsset } from "../../lib/upload";
import type { SlugStatus } from "../../routes/dashboard.sites.new";
import { AccessSettingsFields } from "./AccessSettingsFields";
import { Eyebrow } from "../ui/eyebrow";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function NewSiteForm({
  file,
  assets,
  name,
  slug,
  slugStatus,
  busy,
  dragActive,
  onChooseFile,
  onName,
  onSlug,
  onDrag,
  onSubmit,
}: {
  file: File | null;
  assets: PreviewAsset[];
  name: string;
  slug: string;
  slugStatus: SlugStatus;
  busy: boolean;
  dragActive: boolean;
  onChooseFile: (file: File | undefined) => void;
  onName: (value: string) => void;
  onSlug: (value: string) => void;
  onDrag: (active: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <header className="border-b border-line px-8 py-7 max-stack:px-5 max-stack:py-5">
        <Eyebrow>new site</Eyebrow>
        <h1 className="font-mono text-[44px] leading-none font-semibold tracking-[-0.035em] max-stack:text-[34px]">
          Upload assets first
        </h1>
        <p className="mt-2.5 text-[15px] text-muted">
          Keep the suggested name and slug, or edit them before publishing.
        </p>
      </header>
      <div className="grid grid-cols-[1fr_380px] gap-6 px-8 py-7 max-stack:grid-cols-1 max-stack:px-5 max-stack:py-5">
        <div className="min-h-[420px]">
          <UploadBox file={file} dragActive={dragActive} onChooseFile={onChooseFile} onDrag={onDrag} label="Drop HTML or ZIP here" />
          {assets.length > 0 && <PreviewAssetList assets={assets} />}
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Publish details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="site-name" className="font-mono text-[11px] uppercase text-muted">name (optional)</Label>
                <Input
                  id="site-name"
                  value={name}
                  onChange={(event) => onName(event.currentTarget.value)}
                  placeholder={file ? titleFromFile(file.name) : "Filled from upload"}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="site-slug" className="font-mono text-[11px] uppercase text-muted">slug</Label>
                <Input
                  id="site-slug"
                  mono
                  value={slug}
                  onChange={(event) => onSlug(event.currentTarget.value)}
                  placeholder="auto-generated"
                  aria-invalid={slugStatus === "taken"}
                />
                {slug && slugStatus === "checking" && (
                  <span className="font-mono text-[11px] text-muted">Checking availability…</span>
                )}
                {slug && slugStatus === "available" && (
                  <span className="font-mono text-[11px] text-accent">Slug is available.</span>
                )}
                {slug && slugStatus === "taken" && (
                  <span className="font-mono text-[11px] text-danger">That slug is already taken. Choose another.</span>
                )}
              </div>
              <div className="rounded-[9px] border border-accent-soft bg-accent-soft px-3.5 py-2.5 font-mono text-[13px] text-accent">
                → /s/{slug || "generated-slug"}/
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Lock size={16} strokeWidth={2} className="text-accent" />
              <CardTitle>Access & expiry</CardTitle>
            </CardHeader>
            <CardContent>
              <AccessSettingsFields showSubmit={false} />
            </CardContent>
          </Card>
          <Button
            disabled={busy || !file || slugStatus === "taken" || slugStatus === "checking"}
            type="submit"
            variant="default"
            className="w-full"
          >
            <Rocket size={16} strokeWidth={2} /> Create site & upload
          </Button>
        </div>
      </div>
    </form>
  );
}
