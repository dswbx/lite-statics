import { Upload } from "lucide-react";
import { useRef } from "react";
import { cn } from "../../lib/cn";
import { formatBytes } from "../../lib/format";
import { MAX_UPLOAD_LABEL } from "../../lib/upload";
import { Button } from "../ui/button";

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
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 rounded-[14px] border-[1.5px] border-dashed border-dz bg-surface p-8 text-center transition-colors",
        dragActive && "border-accent bg-accent-soft/40",
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
      <span className="flex size-16 items-center justify-center rounded-2xl bg-accent-soft">
        <Upload size={28} strokeWidth={2} className="text-accent" />
      </span>
      <span className="font-mono text-[26px] font-semibold tracking-[-0.02em]">{label}</span>
      <span className="font-mono text-[13px] text-muted">or click to choose a file</span>
      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
        Choose file
      </Button>
      <span className="font-mono text-[11px] text-muted">index.html required in ZIP · max {MAX_UPLOAD_LABEL}</span>
      {file && (
        <div className="flex w-full max-w-[360px] items-center justify-between gap-3 rounded-[10px] border border-line bg-surface2 px-3.5 py-2.5 text-left">
          <span className="truncate font-mono text-[13px]">{file.name}</span>
          <span className="shrink-0 font-mono text-[12px] text-muted">{formatBytes(file.size)}</span>
        </div>
      )}
      <input
        ref={inputRef}
        className="dropzone-input"
        name="file"
        type="file"
        accept=".html,.htm,.zip"
        onChange={(event) => onChooseFile(event.currentTarget.files?.[0])}
      />
    </label>
  );
}
