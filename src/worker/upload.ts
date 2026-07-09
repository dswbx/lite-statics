import JSZip from "jszip";
import { buildAssetManifest } from "@cloudflare/worker-bundler";
import type { StoredAssetManifest } from "../shared/types";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_FILE_COUNT = 200;

const ALLOWED_EXTENSIONS = new Set([
  ".html",
  ".htm",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".txt",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
]);

export interface NormalizedAsset {
  pathname: string;
  bytes: ArrayBuffer;
  contentType: string;
}

export interface NormalizedUpload {
  assets: NormalizedAsset[];
  manifest: StoredAssetManifest;
  totalBytes: number;
}

export async function normalizeUpload(file: File): Promise<NormalizedUpload> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Upload is larger than the 10 MB MVP limit.");
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
    return buildNormalized([{ pathname: "/index.html", bytes: await file.arrayBuffer(), contentType: "text/html; charset=utf-8" }]);
  }

  if (lowerName.endsWith(".zip")) {
    return normalizeZip(await file.arrayBuffer());
  }

  throw new Error("Upload must be an HTML file or a ZIP archive.");
}

export function safeAssetPath(input: string): string | null {
  const normalized = input.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.endsWith("/")) return null;
  const parts = normalized.split("/");
  if (parts.some((part) => part === ".." || part === "." || part.length === 0)) return null;
  if (/^[a-zA-Z]+:/.test(normalized)) return null;
  const pathname = `/${parts.join("/")}`;
  const extension = extensionOf(pathname);
  if (!ALLOWED_EXTENSIONS.has(extension)) return null;
  return pathname;
}

async function normalizeZip(bytes: ArrayBuffer): Promise<NormalizedUpload> {
  const zip = await JSZip.loadAsync(bytes);
  const assets: NormalizedAsset[] = [];

  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const pathname = safeAssetPath(name);
    if (!pathname) {
      throw new Error(`ZIP contains an unsafe or unsupported path: ${name}`);
    }
    const content = await entry.async("arraybuffer");
    assets.push({ pathname, bytes: content, contentType: contentTypeFor(pathname) });
  }

  if (assets.length > MAX_FILE_COUNT) {
    throw new Error(`ZIP contains more than ${MAX_FILE_COUNT} files.`);
  }

  if (!assets.some((asset) => asset.pathname === "/index.html")) {
    throw new Error("ZIP uploads must contain index.html at the root.");
  }

  return buildNormalized(assets);
}

async function buildNormalized(assets: NormalizedAsset[]): Promise<NormalizedUpload> {
  const totalBytes = assets.reduce((sum, asset) => sum + asset.bytes.byteLength, 0);
  if (totalBytes > MAX_UPLOAD_BYTES) {
    throw new Error("Expanded upload is larger than the 10 MB MVP limit.");
  }

  const assetMap: Record<string, ArrayBuffer> = {};
  for (const asset of assets) assetMap[asset.pathname] = asset.bytes;
  const generated = await buildAssetManifest(assetMap);
  const manifest: StoredAssetManifest = {};
  for (const asset of assets) {
    const generatedEntry = generated.get(asset.pathname);
    manifest[asset.pathname] = {
      contentType: generatedEntry?.contentType ?? asset.contentType,
      size: asset.bytes.byteLength,
      etag: generatedEntry?.etag,
    };
  }
  return { assets, manifest, totalBytes };
}

function extensionOf(pathname: string): string {
  const dot = pathname.lastIndexOf(".");
  return dot === -1 ? "" : pathname.slice(dot).toLowerCase();
}

function contentTypeFor(pathname: string): string {
  const extension = extensionOf(pathname);
  switch (extension) {
    case ".html":
    case ".htm":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
    case ".mjs":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    default:
      return "text/plain; charset=utf-8";
  }
}
