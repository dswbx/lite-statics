import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { passwordPage, accessCookieSecure, signedAccessCookie, verifySitePassword } from "../access";
import { createServiceClient, createUserClient, type AppEnv } from "../client";
import { deleteSiteAssets, deployResponseBody, deploySite, getSiteBySlug } from "../lib/deploy";

export default new Hono<AppEnv>()
  .get("/slug-available", async (c) => {
    const slug = (c.req.query("slug") ?? "").trim().toLowerCase();
    if (!slug) return c.json({ available: false });
    // RLS limits a user client to their own sites, so check with the service
    // client to catch collisions across every owner (slugs are globally unique).
    const serviceClient = await createServiceClient(c.get("appFetch"), c.env, c.executionCtx);
    const { data, error } = await serviceClient.from("sites").select("id").eq("slug", slug).maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ available: !data });
  })
  .post("/:slug/password", async (c) => {
    const slug = decodeURIComponent(c.req.param("slug"));
    const serviceClient = await createServiceClient(c.get("appFetch"), c.env, c.executionCtx);
    const site = await getSiteBySlug(serviceClient, slug);
    if (!site) return passwordPage(slug, "Site not found.");

    const form = await c.req.formData();
    const password = String(form.get("password") ?? "");
    if (!(await verifySitePassword(site, password))) {
      return passwordPage(slug, "Password did not match.");
    }

    const cookie = await signedAccessCookie(c.env, site.id);
    setCookie(c, c.env.ACCESS_COOKIE_NAME, cookie, {
      maxAge: 60 * 60 * 12,
      path: "/",
      httpOnly: true,
      secure: accessCookieSecure(c.req.raw),
      sameSite: "Lax",
    });
    return c.redirect(`/s/${encodeURIComponent(slug)}/`, 303);
  })
  .post("/:siteId/deploy", async (c) => {
    const authorization = c.req.header("Authorization");
    if (!authorization) return c.json({ error: "Sign in before deploying." }, 401);

    const userClient = createUserClient(c.get("appFetch"), c.env, c.executionCtx, authorization);
    const siteId = c.req.param("siteId");
    const { data: ownedSite, error: ownershipError } = await userClient.from("sites").select("id").eq("id", siteId).maybeSingle();
    if (ownershipError || !ownedSite) return c.json({ error: "Site not found" }, 404);

    const form = await c.req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return c.json({ error: "Upload field `file` must contain an HTML file or ZIP archive." }, 400);
    }

    const serviceClient = await createServiceClient(c.get("appFetch"), c.env, c.executionCtx);
    try {
      const result = await deploySite(c.env, serviceClient, siteId, file);
      return c.json(deployResponseBody(result), 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Deploy failed.";
      const status = message === "Site not found" ? 404 : 400;
      return c.json({ error: message }, status);
    }
  })
  .delete("/:siteId", async (c) => {
    const authorization = c.req.header("Authorization");
    if (!authorization) return c.json({ error: "Sign in before deleting." }, 401);

    const userClient = createUserClient(c.get("appFetch"), c.env, c.executionCtx, authorization);
    const siteId = c.req.param("siteId");
    const { data: ownedSite, error: ownershipError } = await userClient.from("sites").select("id").eq("id", siteId).maybeSingle();
    if (ownershipError || !ownedSite) return c.json({ error: "Site not found" }, 404);

    const serviceClient = await createServiceClient(c.get("appFetch"), c.env, c.executionCtx);
    await deleteSiteAssets(c.env, siteId);
    const { error: deleteError } = await serviceClient.from("sites").delete().eq("id", siteId);
    if (deleteError) return c.json({ error: deleteError.message }, 500);
    return c.body(null, 204);
  });
