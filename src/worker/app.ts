import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv, FetchExecutionContext } from "./client";
import type { Env } from "./env";
import publicRoutes from "./routes/public";
import sitesRoutes from "./routes/sites";
import { getLiteApp } from "./supalite";

function jsonError(message: string, status = 400): Response {
   return Response.json({ error: message }, { status });
}

export function createApp() {
   const app = new Hono<AppEnv>();

   const appFetch = (
      request: Request,
      env: Env,
      executionCtx: FetchExecutionContext
   ) => app.fetch(request, env, executionCtx as unknown as ExecutionContext);

   app.use("*", async (c, next) => {
      c.set("appFetch", appFetch);
      await next();
   });

   app.onError((error) => {
      if (error instanceof HTTPException) {
         const response = error.getResponse();
         if (response.headers.get("content-type")?.includes("application/json"))
            return response;
         return jsonError(error.message, error.status);
      }
      const message =
         error instanceof Error ? error.message : "Unexpected error";
      return jsonError(message, 500);
   });

   // @todo: add supalite to context, and use as a middleware
   app.all("/auth/v1", (c) => getLiteApp(c.env).fetch(c.req.raw));
   app.all("/auth/v1/*", (c) => getLiteApp(c.env).fetch(c.req.raw));
   app.all("/rest/v1", (c) => getLiteApp(c.env).fetch(c.req.raw));
   app.all("/rest/v1/*", (c) => getLiteApp(c.env).fetch(c.req.raw));

   app.route("/api/sites", sitesRoutes);
   app.route("/s", publicRoutes);

   app.all("*", (c) => c.env.DASHBOARD.fetch(c.req.raw));

   return app;
}

export const app = createApp();
