import type { WorkerEntrypoint } from "cloudflare:workers";

export interface AssetBindingProps {
  siteId: string;
  deploymentId: string;
}

export interface AssetBindingStub {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  DB: D1Database;
  ASSET_BUCKET: R2Bucket;
  DASHBOARD: Fetcher;
  LOADER: WorkerLoader;
  ENVIRONMENT: string;
  ACCESS_COOKIE_NAME: string;
  COOKIE_SECRET: string;
}

export type WorkerContext = ExecutionContext & {
  exports: {
    AssetBinding(props: { props: AssetBindingProps }): WorkerEntrypoint<Env, AssetBindingProps> & AssetBindingStub;
  };
};
