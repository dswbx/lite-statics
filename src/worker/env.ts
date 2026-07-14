import type { ViewTrackingJob } from "../shared/view-tracking";

export interface Env {
  DB: D1Database;
  ASSET_BUCKET: R2Bucket;
  DASHBOARD: Fetcher;
  VIEW_TRACKING_QUEUE: Queue<ViewTrackingJob>;
  RATE_LIMIT: RateLimit;
  EMAIL: SendEmail;
  ACCESS_COOKIE_NAME: string;
  COOKIE_SECRET: string;
  JWT_SECRET: string;
  SITE_URL: string;
  EMAIL_FROM_ADDRESS: string;
  EMAIL_FROM_NAME: string;
}

export type WorkerContext = ExecutionContext;
