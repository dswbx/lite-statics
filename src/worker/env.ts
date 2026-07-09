import type { ViewTrackingJob } from "../shared/view-tracking";

export interface Env {
  DB: D1Database;
  ASSET_BUCKET: R2Bucket;
  DASHBOARD: Fetcher;
  VIEW_TRACKING_QUEUE: Queue<ViewTrackingJob>;
  RATE_LIMIT_AUTH: RateLimit;
  RATE_LIMIT_API: RateLimit;
  RATE_LIMIT_REST: RateLimit;
  RATE_LIMIT_STATIC: RateLimit;
  RATE_LIMIT_DEFAULT: RateLimit;
  ACCESS_COOKIE_NAME: string;
  COOKIE_SECRET: string;
  JWT_SECRET: string;
}

export type WorkerContext = ExecutionContext;
