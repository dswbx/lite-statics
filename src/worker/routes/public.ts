import { Hono } from "hono";
import type { Context } from "hono";
import { decideAccess, inactivePage, passwordPage } from "../access";
import { createServiceClient, type AppEnv } from "../client";
import { viewTrackingJobFrom } from "../lib/analytics";
import { getSiteBySlug } from "../lib/deploy";
import { serveSiteFromR2 } from "../lib/serve";

function parsePublicPath(pathname: string): { slug: string; assetPathname: string } | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "s" || !parts[1]) return null;
  const slug = decodeURIComponent(parts[1]);
  const rest = parts.slice(2).join("/");
  return { slug, assetPathname: rest ? `/${rest}` : "/" };
}

async function serve(c: Context<AppEnv>) {
  const parsed = parsePublicPath(new URL(c.req.raw.url).pathname);
  if (!parsed) return new Response("Site slug missing", { status: 404 });

  const serviceClient = await createServiceClient(c.get("appFetch"), c.env, c.executionCtx);
  const site = await getSiteBySlug(serviceClient, parsed.slug);
  if (!site) return new Response("Site not found", { status: 404 });

  const decision = await decideAccess(c.env, c.req.raw, site);
  if (decision.status === "inactive") return inactivePage(decision.reason);
  if (decision.status === "password-required") return passwordPage(site.slug);

  const response = await serveSiteFromR2(c.env, site, c.req.raw, parsed.assetPathname);
  const job = viewTrackingJobFrom(site.id, c.req.raw, parsed.assetPathname, response.status);
  c.executionCtx.waitUntil(c.env.VIEW_TRACKING_QUEUE.send(job));
  return response;
}

export default new Hono<AppEnv>().get("/:slug", serve).get("/:slug/*", serve);
