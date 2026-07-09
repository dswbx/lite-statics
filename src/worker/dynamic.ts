import type { Env, WorkerContext } from "./env";
import type { SiteAccessRecord } from "./db";
import { assetKey } from "./assets";

const STATIC_WORKER_CODE = `
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
`;

export async function serveDynamicSite(
  env: Env,
  ctx: WorkerContext,
  request: Request,
  record: SiteAccessRecord,
  assetPathname: string,
): Promise<Response> {
  if (!record.deployment) {
    return new Response("No deployment", { status: 404 });
  }

  const deployment = record.deployment;
  const assetRequest = rewriteAssetRequest(request, assetPathname);
  if (env.LOADER) {
    const stub = env.LOADER.get(deployment.worker_id, async () => ({
      compatibilityDate: "2026-07-08",
      mainModule: "index.js",
      modules: {
        "index.js": { js: STATIC_WORKER_CODE },
      },
      env: {
        ASSETS: ctx.exports.AssetBinding({
          props: { siteId: record.site.id, deploymentId: deployment.id },
        }),
      },
      globalOutbound: null,
    }));
    return stub.getEntrypoint().fetch(assetRequest);
  }

  const object = await env.ASSET_BUCKET.get(assetKey(record.site.id, deployment.id, fallbackStoragePath(assetPathname)));
  if (!object) return new Response("Not Found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "cache-control": "public, max-age=60",
    },
  });
}

function fallbackStoragePath(pathname: string): string {
  return pathname === "/" ? "/index.html" : pathname;
}

function rewriteAssetRequest(request: Request, pathname: string): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}
