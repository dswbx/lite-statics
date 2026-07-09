import { WorkerEntrypoint } from "cloudflare:workers";
import { handleAssetRequest } from "@cloudflare/worker-bundler";
import type { AssetManifest, AssetStorage } from "@cloudflare/worker-bundler";
import type { Env, AssetBindingProps } from "./env";
import { getDeployment, parseManifest } from "./db";
import type { StoredAssetManifest } from "../shared/types";

export class AssetBinding extends WorkerEntrypoint<Env, AssetBindingProps> {
  async fetch(request: Request): Promise<Response> {
    const { siteId, deploymentId } = this.ctx.props;
    const deployment = await getDeployment(this.env.DB, deploymentId);
    if (!deployment || deployment.site_id !== siteId) {
      return new Response("Assets not found", { status: 404 });
    }

    const manifest = toWorkerBundlerManifest(parseManifest(deployment));
    const storage: AssetStorage = {
      get: async (pathname: string) => {
        const object = await this.env.ASSET_BUCKET.get(assetKey(siteId, deploymentId, pathname));
        return object ? object.arrayBuffer() : null;
      },
    };
    const response = await handleAssetRequest(request, manifest, storage, {
      not_found_handling: "single-page-application",
    });
    return response ?? new Response("Not Found", { status: 404 });
  }
}

export function assetKey(siteId: string, deploymentId: string, pathname: string): string {
  return `sites/${siteId}/deployments/${deploymentId}/assets${pathname}`;
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
