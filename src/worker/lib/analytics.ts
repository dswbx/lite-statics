import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsDbRow } from "../../shared/mappers";

export async function recordAnalytics(
   client: SupabaseClient,
   siteId: string,
   request: Request,
   pathname: string,
   status: number
): Promise<void> {
   const day = new Date().toISOString().slice(0, 10);
   const country = request.cf?.country ? String(request.cf.country) : "unknown";
   const referrerHost = referrerHostFrom(request.headers.get("referer"));

   const { data: existing } = await client
      .from("analytics_daily")
      .select("views")
      .eq("site_id", siteId)
      .eq("day", day)
      .eq("path", pathname)
      .eq("status", status)
      .eq("country", country)
      .eq("referrer_host", referrerHost)
      .maybeSingle<Pick<AnalyticsDbRow, "views">>();

   if (existing) {
      await client
         .from("analytics_daily")
         .update({ views: existing.views + 1 })
         .eq("site_id", siteId)
         .eq("day", day)
         .eq("path", pathname)
         .eq("status", status)
         .eq("country", country)
         .eq("referrer_host", referrerHost);
      return;
   }

   await client.from("analytics_daily").insert({
      site_id: siteId,
      day,
      path: pathname,
      status,
      country,
      referrer_host: referrerHost,
      views: 1,
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
