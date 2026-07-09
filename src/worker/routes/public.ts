import { Hono } from "hono";
import type { Context } from "hono";
import { decideAccess, inactivePage, passwordPage } from "../access";
import { createServiceClient, type AppEnv } from "../client";
import type { WorkerContext } from "../env";
import { recordAnalytics } from "../lib/analytics";
import { getSiteBySlug } from "../lib/deploy";

function parsePublicPath(
   pathname: string
): { slug: string; assetPathname: string } | null {
   const parts = pathname.split("/").filter(Boolean);
   if (parts[0] !== "s" || !parts[1]) return null;
   const slug = decodeURIComponent(parts[1]);
   const rest = parts.slice(2).join("/");
   return { slug, assetPathname: rest ? `/${rest}` : "/" };
}

async function serve(c: Context<AppEnv>) {
   const parsed = parsePublicPath(new URL(c.req.raw.url).pathname);
   if (!parsed) return new Response("Site slug missing", { status: 404 });

   const serviceClient = await createServiceClient(
      c.get("appFetch"),
      c.env,
      c.executionCtx
   );
   const record = await getSiteBySlug(serviceClient, parsed.slug);
   if (!record) return new Response("Site not found", { status: 404 });

   const decision = await decideAccess(c.env, c.req.raw, record.site);
   if (decision.status === "inactive") return inactivePage(decision.reason);
   if (decision.status === "password-required")
      return passwordPage(record.site.slug);

   const workerCtx = c.executionCtx as WorkerContext;
   const { serveDynamicSite } = await import("../dynamic");
   const response = await serveDynamicSite(
      c.env,
      workerCtx,
      c.req.raw,
      record,
      parsed.assetPathname
   );
   c.executionCtx.waitUntil(
      recordAnalytics(
         serviceClient,
         record.site.id,
         c.req.raw,
         parsed.assetPathname,
         response.status
      )
   );
   return response;
}

export default new Hono<AppEnv>().get("/:slug", serve).get("/:slug/*", serve);
