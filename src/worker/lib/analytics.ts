import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsDbRow } from "../../shared/mappers";
import type { AggregatedViewTracking, ViewTrackingJob } from "../../shared/view-tracking";
import type { AppFetch, FetchExecutionContext } from "../client";
import { createServiceClient } from "../client";
import type { Env } from "../env";

export function viewTrackingJobFrom(
  siteId: string,
  request: Request,
  pathname: string,
  status: number,
): ViewTrackingJob {
  return {
    siteId,
    day: new Date().toISOString().slice(0, 10),
    path: pathname,
    status,
    country: request.cf?.country ? String(request.cf.country) : "unknown",
    referrerHost: referrerHostFrom(request.headers.get("referer")),
  };
}

export function aggregateViewTrackingJobs(jobs: ViewTrackingJob[]): AggregatedViewTracking[] {
  const aggregated = new Map<string, AggregatedViewTracking>();

  for (const job of jobs) {
    const key = [
      job.siteId,
      job.day,
      job.path,
      job.status,
      job.country,
      job.referrerHost,
    ].join("\0");
    const existing = aggregated.get(key);
    if (existing) {
      existing.views += 1;
      continue;
    }
    aggregated.set(key, { ...job, views: 1 });
  }

  return [...aggregated.values()];
}

export async function flushViewTrackingBatch(
  appFetch: AppFetch,
  env: Env,
  executionCtx: FetchExecutionContext,
  jobs: ViewTrackingJob[],
): Promise<void> {
  const aggregated = aggregateViewTrackingJobs(jobs);
  if (aggregated.length === 0) return;

  const client = await createServiceClient(appFetch, env, executionCtx);
  for (const row of aggregated) {
    await upsertAggregatedViews(client, row);
  }
}

async function upsertAggregatedViews(client: SupabaseClient, row: AggregatedViewTracking): Promise<void> {
  const { data: existing } = await client
    .from("analytics_daily")
    .select("views")
    .eq("site_id", row.siteId)
    .eq("day", row.day)
    .eq("path", row.path)
    .eq("status", row.status)
    .eq("country", row.country)
    .eq("referrer_host", row.referrerHost)
    .maybeSingle<Pick<AnalyticsDbRow, "views">>();

  if (existing) {
    await client
      .from("analytics_daily")
      .update({ views: existing.views + row.views })
      .eq("site_id", row.siteId)
      .eq("day", row.day)
      .eq("path", row.path)
      .eq("status", row.status)
      .eq("country", row.country)
      .eq("referrer_host", row.referrerHost);
    return;
  }

  await client.from("analytics_daily").insert({
    site_id: row.siteId,
    day: row.day,
    path: row.path,
    status: row.status,
    country: row.country,
    referrer_host: row.referrerHost,
    views: row.views,
  });
}

function referrerHostFrom(value: string | null): string {
  if (!value) return "direct";
  try {
    return new URL(value).host || "direct";
  } catch {
    return "direct";
  }
}
