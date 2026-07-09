// static asset manifest and request handling adapted from @cloudflare/worker-bundler's
// asset-handler (MIT). only the serving subset is included; the esbuild bundler is not.

export interface AssetMetadata {
  contentType: string | undefined;
  etag: string;
}

export type AssetManifest = Map<string, AssetMetadata>;

export interface AssetStorage {
  get(pathname: string): Promise<ReadableStream | ArrayBuffer | string | null>;
}

export interface AssetConfig {
  html_handling?:
    | "auto-trailing-slash"
    | "force-trailing-slash"
    | "drop-trailing-slash"
    | "none";
  not_found_handling?: "single-page-application" | "404-page" | "none";
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function getExtension(path: string): string {
  const lastDot = path.lastIndexOf(".");
  if (lastDot === -1) return "";
  if (lastDot < path.lastIndexOf("/")) return "";
  return path.slice(lastDot).toLowerCase();
}

function inferContentType(path: string): string | undefined {
  return MIME_TYPES[getExtension(path)];
}

async function computeETag(content: string | ArrayBuffer): Promise<string> {
  if (typeof content === "string") {
    let hash = 2166136261;
    for (let i = 0; i < content.length; i++) {
      hash ^= content.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }
  const hashBuffer = await crypto.subtle.digest("SHA-256", content);
  return [...new Uint8Array(hashBuffer).slice(0, 8)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildAssetManifest(
  assets: Record<string, string | ArrayBuffer>,
): Promise<AssetManifest> {
  const manifest: AssetManifest = new Map();
  await Promise.all(
    Object.entries(assets).map(async ([pathname, content]) => {
      manifest.set(pathname, {
        contentType: inferContentType(pathname),
        etag: await computeETag(content),
      });
    }),
  );
  return manifest;
}

function exists(manifest: AssetManifest, pathname: string): AssetMetadata | undefined {
  return manifest.get(pathname);
}

function decodePath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/")
    .replaceAll(/\/+/g, "/");
}

function encodePath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => {
      try {
        return encodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

type AssetIntent = {
  type: "asset";
  pathname: string;
  meta: AssetMetadata;
  status: number;
};

type RedirectIntent = {
  type: "redirect";
  to: string;
};

type RequestIntent = AssetIntent | RedirectIntent;

function assetIntent(pathname: string, meta: AssetMetadata, status = 200): AssetIntent {
  return { type: "asset", pathname, meta, status };
}

function redirectIntent(to: string): RedirectIntent {
  return { type: "redirect", to };
}

function notFound(
  manifest: AssetManifest,
  config: Required<AssetConfig>,
  acceptsHtml: boolean,
): AssetIntent | undefined {
  switch (config.not_found_handling) {
    case "single-page-application": {
      if (!acceptsHtml) return undefined;
      const meta = exists(manifest, "/index.html");
      return meta ? assetIntent("/index.html", meta, 200) : undefined;
    }
    case "404-page": {
      return undefined;
    }
    default:
      return undefined;
  }
}

function safeRedirect(
  file: string,
  destination: string,
  manifest: AssetManifest,
  config: Required<AssetConfig>,
  skip: boolean,
): RedirectIntent | undefined {
  if (skip) return undefined;
  if (!exists(manifest, destination)) {
    const intent = getIntent(destination, manifest, config, true, true);
    if (intent?.type === "asset" && intent.meta.etag === exists(manifest, file)?.etag) {
      return redirectIntent(destination);
    }
  }
  return undefined;
}

function htmlAutoTrailingSlash(
  pathname: string,
  manifest: AssetManifest,
  config: Required<AssetConfig>,
  skipRedirects: boolean,
  acceptsHtml: boolean,
): RequestIntent | undefined {
  let meta: AssetMetadata | undefined;
  let redirect: RedirectIntent | undefined;
  const exactMeta = exists(manifest, pathname);

  if (pathname.endsWith("/index")) {
    if (exactMeta) return assetIntent(pathname, exactMeta);
    if ((redirect = safeRedirect(`${pathname}.html`, pathname.slice(0, -5), manifest, config, skipRedirects))) {
      return redirect;
    }
    if ((redirect = safeRedirect(`${pathname.slice(0, -6)}.html`, pathname.slice(0, -6), manifest, config, skipRedirects))) {
      return redirect;
    }
  } else if (pathname.endsWith("/index.html")) {
    if ((redirect = safeRedirect(pathname, pathname.slice(0, -10), manifest, config, skipRedirects))) {
      return redirect;
    }
    if ((redirect = safeRedirect(`${pathname.slice(0, -11)}.html`, pathname.slice(0, -11), manifest, config, skipRedirects))) {
      return redirect;
    }
  } else if (pathname.endsWith("/")) {
    const indexPath = `${pathname}index.html`;
    if ((meta = exists(manifest, indexPath))) return assetIntent(indexPath, meta);
    if ((redirect = safeRedirect(`${pathname.slice(0, -1)}.html`, pathname.slice(0, -1), manifest, config, skipRedirects))) {
      return redirect;
    }
  } else if (pathname.endsWith(".html")) {
    if ((redirect = safeRedirect(pathname, pathname.slice(0, -5), manifest, config, skipRedirects))) {
      return redirect;
    }
    if ((redirect = safeRedirect(`${pathname.slice(0, -5)}/index.html`, `${pathname.slice(0, -5)}/`, manifest, config, skipRedirects))) {
      return redirect;
    }
  }

  if (exactMeta) return assetIntent(pathname, exactMeta);
  const htmlPath = `${pathname}.html`;
  if ((meta = exists(manifest, htmlPath))) return assetIntent(htmlPath, meta);
  if ((redirect = safeRedirect(`${pathname}/index.html`, `${pathname}/`, manifest, config, skipRedirects))) {
    return redirect;
  }
  return notFound(manifest, config, acceptsHtml);
}

function getIntent(
  pathname: string,
  manifest: AssetManifest,
  config: Required<AssetConfig>,
  skipRedirects = false,
  acceptsHtml = true,
): RequestIntent | undefined {
  switch (config.html_handling) {
    case "auto-trailing-slash":
      return htmlAutoTrailingSlash(pathname, manifest, config, skipRedirects, acceptsHtml);
    case "none": {
      const meta = exists(manifest, pathname);
      return meta ? assetIntent(pathname, meta) : notFound(manifest, config, acceptsHtml);
    }
    default:
      return htmlAutoTrailingSlash(pathname, manifest, config, skipRedirects, acceptsHtml);
  }
}

function normalizeConfig(config?: AssetConfig): Required<AssetConfig> {
  return {
    html_handling: config?.html_handling ?? "auto-trailing-slash",
    not_found_handling: config?.not_found_handling ?? "none",
  };
}

const CACHE_CONTROL_REVALIDATE = "public, max-age=0, must-revalidate";
const CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable";

function getCacheControl(pathname: string): string {
  if (/\.[a-f0-9]{8,}\.\w+$/.test(pathname)) return CACHE_CONTROL_IMMUTABLE;
  return CACHE_CONTROL_REVALIDATE;
}

export async function handleAssetRequest(
  request: Request,
  manifest: AssetManifest,
  storage: AssetStorage,
  config?: AssetConfig,
): Promise<Response | null> {
  const normalized = normalizeConfig(config);
  const method = request.method.toUpperCase();
  if (!["GET", "HEAD"].includes(method)) return null;

  const { pathname } = new URL(request.url);
  const decodedPathname = decodePath(pathname);
  const intent = getIntent(
    decodedPathname,
    manifest,
    normalized,
    false,
    (request.headers.get("Accept") || "").includes("text/html"),
  );
  if (!intent) return null;

  if (intent.type === "redirect") {
    const url = new URL(request.url);
    const encodedDest = encodePath(intent.to);
    return new Response(null, {
      status: 307,
      headers: { Location: encodedDest + url.search },
    });
  }

  const encodedPathname = encodePath(decodedPathname);
  if (encodedPathname !== pathname) {
    const url = new URL(request.url);
    return new Response(null, {
      status: 307,
      headers: { Location: encodedPathname + url.search },
    });
  }

  const { pathname: assetPath, meta, status } = intent;
  const strongETag = `"${meta.etag}"`;
  const weakETag = `W/${strongETag}`;
  const ifNoneMatch = request.headers.get("If-None-Match") || "";
  const eTags = new Set(ifNoneMatch.split(",").map((token) => token.trim()));
  const headers = new Headers();
  headers.set("ETag", strongETag);
  if (meta.contentType) headers.set("Content-Type", meta.contentType);
  headers.set("Cache-Control", getCacheControl(decodedPathname));
  if (eTags.has(weakETag) || eTags.has(strongETag)) {
    return new Response(null, { status: 304, headers });
  }

  const body = method === "HEAD" ? null : await storage.get(assetPath);
  return new Response(body, { status, headers });
}
