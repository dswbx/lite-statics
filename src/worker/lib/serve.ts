import { handleAssetRequest, type AssetManifest, type AssetStorage } from "./assets";
import type { Env } from "../env";
import type { SiteRow } from "../../shared/mappers";
import type { StoredAssetManifest } from "../../shared/types";
import { assetKey } from "./storage";

export function parseManifestJson(manifestJson: string | null): StoredAssetManifest | null {
  if (!manifestJson) return null;
  return JSON.parse(manifestJson) as StoredAssetManifest;
}

export async function serveSiteFromR2(
  env: Env,
  site: SiteRow,
  request: Request,
  assetPathname: string,
): Promise<Response> {
  const manifest = parseManifestJson(site.manifest_json);
  if (!manifest) return new Response("No deployment", { status: 404 });

  const assetRequest = rewriteAssetRequest(request, assetPathname);
  const bundlerManifest = toWorkerBundlerManifest(manifest);
  const storage: AssetStorage = {
    get: async (pathname: string) => {
      const object = await env.ASSET_BUCKET.get(assetKey(site.id, pathname));
      return object ? object.arrayBuffer() : null;
    },
  };

  const response = await handleAssetRequest(assetRequest, bundlerManifest, storage, {
    not_found_handling: "single-page-application",
  });
  return response ?? new Response("Not Found", { status: 404 });
}

function rewriteAssetRequest(request: Request, pathname: string): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

function toWorkerBundlerManifest(stored: StoredAssetManifest): AssetManifest {
  const manifest: AssetManifest = new Map();
  for (const [pathname, entry] of Object.entries(stored)) {
    manifest.set(pathname, {
      contentType: entry.contentType,
      etag: entry.etag ?? "",
    });
  }
  return manifest;
}
