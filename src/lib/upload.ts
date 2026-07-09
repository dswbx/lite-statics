import JSZip from "jszip";

export type PreviewAsset = { pathname: string; size: number };

export function titleFromFile(fileName: string): string {
  const base = fileName.replace(/\.(html?|zip)$/i, "").replace(/[-_]+/g, " ").trim();
  if (!base) return "Untitled site";
  return base.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function previewUploadAssets(file: File): Promise<PreviewAsset[]> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
    return [{ pathname: "/index.html", size: file.size }];
  }
  if (!lowerName.endsWith(".zip")) throw new Error("Use one HTML file or one ZIP archive.");

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const assets: PreviewAsset[] = [];
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const pathname = safePreviewPath(name);
    if (!pathname) throw new Error(`ZIP contains an unsafe or unsupported path: ${name}`);
    const content = await entry.async("arraybuffer");
    assets.push({ pathname, size: content.byteLength });
  }
  if (!assets.some((asset) => asset.pathname === "/index.html")) {
    throw new Error("ZIP uploads must contain index.html at the root.");
  }
  return assets.sort((left, right) => {
    if (left.pathname === "/index.html") return -1;
    if (right.pathname === "/index.html") return 1;
    return left.pathname.localeCompare(right.pathname);
  });
}

function safePreviewPath(input: string): string | null {
  const normalized = input.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.endsWith("/")) return null;
  const parts = normalized.split("/");
  if (parts.some((part) => part === ".." || part === "." || part.length === 0)) return null;
  if (/^[a-zA-Z]+:/.test(normalized)) return null;
  return `/${parts.join("/")}`;
}

export function uniqueSlug(value: string, existingSlugs: string[]): string {
  const base = slugify(value) || "site";
  const existing = new Set(existingSlugs);
  if (!existing.has(base)) return base;
  for (let index = 2; index < 10_000; index += 1) {
    const candidate = `${base}-${index}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidUploadFile(file: File | undefined): file is File {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return name.endsWith(".html") || name.endsWith(".htm") || name.endsWith(".zip");
}
