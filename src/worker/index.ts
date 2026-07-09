import { app } from "./app";
import type { AppFetch } from "./client";
import { flushViewTrackingBatch } from "./lib/analytics";
import type { ViewTrackingJob } from "../shared/view-tracking";
import type { Env, WorkerContext } from "./env";

const appFetch: AppFetch = (request, env, executionCtx) =>
  app.fetch(request, env, executionCtx as ExecutionContext);

export default {
  fetch(request: Request, env: Env, ctx: WorkerContext) {
    return app.fetch(request, env, ctx);
  },
  async queue(batch: MessageBatch<ViewTrackingJob>, env: Env, ctx: WorkerContext) {
    const jobs = batch.messages.map((message) => message.body);
    await flushViewTrackingBatch(appFetch, env, ctx, jobs);
    batch.ackAll();
  },
};
