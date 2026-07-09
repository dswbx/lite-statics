import { Rocket } from "lucide-react";
import { PreviewAssetList } from "../upload/PreviewAssetList";
import { UploadBox } from "../upload/UploadBox";
import { titleFromFile, type PreviewAsset } from "../../lib/upload";

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
    <form onSubmit={onSubmit} className="createLayout">
      <section className="panel strong uploadFirst">
        <p className="eyebrow">New site</p>
        <h1>Upload assets first.</h1>
        <p className="hint">After upload, you can keep the suggested name and slug or edit them before publishing.</p>
        <UploadBox file={file} dragActive={dragActive} onChooseFile={onChooseFile} onDrag={onDrag} label="Drop HTML or ZIP here" />
        {file && (
          <div className="inlineUploadNotice">
            <strong>{file.name} is ready.</strong>
            <span>
              {assets.length} {assets.length === 1 ? "file" : "files"} found. Review the list, then publish.
            </span>
          </div>
        )}
        {assets.length > 0 && <PreviewAssetList assets={assets} />}
      </section>
      <section className="panel publishPanel">
        <h2>Publish details</h2>
        <label>
          Name optional
          <input value={name} onChange={(event) => onName(event.currentTarget.value)} placeholder={file ? titleFromFile(file.name) : "Filled from upload"} />
        </label>
        <label>
          Slug
          <input value={slug} onChange={(event) => onSlug(event.currentTarget.value)} placeholder="auto-generated" />
        </label>
        <p className="previewUrl">Public URL preview: /s/{slug || "generated-slug"}/</p>
        <button disabled={busy || !file} type="submit">
          <Rocket size={18} /> Create site and upload
        </button>
      </section>
    </form>
  );
}
