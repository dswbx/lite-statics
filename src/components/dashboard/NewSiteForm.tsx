import { LockKeyhole, Rocket } from "lucide-react";
import { PreviewAssetList } from "../upload/PreviewAssetList";
import { UploadBox } from "../upload/UploadBox";
import { titleFromFile, type PreviewAsset } from "../../lib/upload";
import { AccessSettingsFields } from "./AccessSettingsFields";
import { Eyebrow } from "../ui/Eyebrow";
import { Panel } from "../ui/Panel";
import { Button } from "../ui/Button";

export function NewSiteForm({
  file,
  assets,
  name,
  slug,
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
  busy: boolean;
  dragActive: boolean;
  onChooseFile: (file: File | undefined) => void;
  onName: (value: string) => void;
  onSlug: (value: string) => void;
  onDrag: (active: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] gap-6 pt-[26px] max-stack:grid-cols-1"
    >
      <Panel tone="strong" className="[&_h1]:text-[clamp(2.2rem,5vw,5rem)]">
        <Eyebrow>New site</Eyebrow>
        <h1>Upload assets first.</h1>
        <p className="text-[0.92rem] leading-normal text-hint">After upload, you can keep the suggested name and slug or edit them before publishing.</p>
        <UploadBox file={file} dragActive={dragActive} onChooseFile={onChooseFile} onDrag={onDrag} label="Drop HTML or ZIP here" />
        {file && (
          <div className="mt-3.5 grid gap-1 border-2 border-ink bg-lime px-3.5 py-3">
            <strong>{file.name} is ready.</strong>
            <span className="text-[0.9rem] font-extrabold text-label">
              {assets.length} {assets.length === 1 ? "file" : "files"} found. Review the list, then publish.
            </span>
          </div>
        )}
        {assets.length > 0 && <PreviewAssetList assets={assets} />}
      </Panel>
      <Panel className="self-start">
        <h2>Publish details</h2>
        <label>
          Name optional
          <input value={name} onChange={(event) => onName(event.currentTarget.value)} placeholder={file ? titleFromFile(file.name) : "Filled from upload"} />
        </label>
        <label>
          Slug
          <input value={slug} onChange={(event) => onSlug(event.currentTarget.value)} placeholder="auto-generated" />
        </label>
        <p className="border-2 border-ink bg-sky-soft p-2.5 text-[0.92rem] font-[850] leading-normal text-hint">
          Public URL preview: /s/{slug || "generated-slug"}/
        </p>
      </Panel>
      <Panel tone="strong">
        <h2>
          <LockKeyhole size={20} /> Access and expiry
        </h2>
        <AccessSettingsFields showSubmit={false} />
        <Button disabled={busy || !file} type="submit">
          <Rocket size={18} /> Create site and upload
        </Button>
      </Panel>
    </form>
  );
}
