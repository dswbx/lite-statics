import { mapAnalytics, mapSite } from "../shared/mappers";
import type { AnalyticsRow, SiteSummary } from "../shared/types";
import { supabase } from "../lib/supabase";
import { useAsyncLoad } from "./useAsyncLoad";

export interface SiteWithDetail {
  site: SiteSummary;
  analytics: AnalyticsRow[];
}

export function useSiteDetail(siteId: string | undefined) {
  const { data: detail, loading, error, setData: setDetail } = useAsyncLoad<SiteWithDetail | null, string | null>(
    async () => {
      if (!siteId) return { data: null, error: null };

      const { data: site, error: siteError } = await supabase.from("sites").select("*").eq("id", siteId).maybeSingle();
      if (siteError || !site) {
        return { data: null, error: "Could not load this site." };
      }

      const { data: analytics } = await supabase
        .from("analytics_daily")
        .select("day, path, status, country, referrer_host, views")
        .eq("site_id", siteId)
        .order("day", { ascending: false })
        .order("views", { ascending: false })
        .limit(100);

      return {
        data: {
          site: mapSite(site),
          analytics: (analytics ?? []).map(mapAnalytics),
        },
        error: null,
      };
    },
    [siteId],
    {
      enabled: Boolean(siteId),
      initialData: null,
      initialError: null,
      initialLoading: Boolean(siteId),
      cacheKey: siteId ? `site:${siteId}` : undefined,
    },
  );

  return { detail, setDetail, loading, error };
}
