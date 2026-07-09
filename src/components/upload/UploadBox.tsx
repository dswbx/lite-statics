import { Upload } from "lucide-react";

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
      className={`dropzone ${dragActive ? "active" : ""}`}
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
      <span>{label}</span>
      <small>{file ? file.name : "or click to choose a file"}</small>
      <input name="file" type="file" accept=".html,.htm,.zip" onChange={(event) => onChooseFile(event.currentTarget.files?.[0])} />
    </label>
  );
}
