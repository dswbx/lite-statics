import { Upload } from "lucide-react";
import { cn } from "../../lib/cn";

export function UploadBox({
  file,
  dragActive,
  label,
  onChooseFile,
  onDrag,
}: {
  file: File | null;
  dragActive: boolean;
  label: string;
  onChooseFile: (file: File | undefined) => void;
  onDrag: (active: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "grid min-h-[220px] cursor-pointer place-items-center content-center gap-2 border-2 border-dashed border-ink bg-sky-soft text-center",
        dragActive && "bg-lime",
      )}
      onDragEnter={() => onDrag(true)}
      onDragLeave={() => onDrag(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrag(false);
        onChooseFile(event.dataTransfer.files[0]);
      }}
    >
      <Upload size={30} />
      <span className="text-base font-black text-ink">{label}</span>
      <small className="text-muted">{file ? file.name : "or click to choose a file"}</small>
      <input
        className="dropzone-input"
        name="file"
        type="file"
        accept=".html,.htm,.zip"
        onChange={(event) => onChooseFile(event.currentTarget.files?.[0])}
      />
    </label>
  );
}
