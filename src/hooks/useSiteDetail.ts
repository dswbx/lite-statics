import { useEffect, useState } from "react";
import { mapAnalytics, mapDeployment, mapSite } from "../shared/mappers";
import type { AnalyticsRow, DeploymentSummary, SiteSummary } from "../shared/types";
import { supabase } from "../lib/supabase";

export interface SiteWithDetail {
  site: SiteSummary;
  deployment: DeploymentSummary | null;
  analytics: AnalyticsRow[];
}

export function useSiteDetail(siteId: string | undefined) {
  const [detail, setDetail] = useState<SiteWithDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(siteId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) {
      setDetail(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setDetail(null);
    setLoading(true);
    setError(null);

    void (async () => {
      const { data: site, error: siteError } = await supabase.from("sites").select("*").eq("id", siteId).maybeSingle();
      if (cancelled) return;
      if (siteError || !site) {
        setDetail(null);
        setError("Could not load this site.");
        setLoading(false);
        return;
      }

      const deploymentId = site.active_deployment_id;
      const [{ data: deployment }, { data: analytics }] = await Promise.all([
        deploymentId
          ? supabase.from("deployments").select("*").eq("id", deploymentId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("analytics_daily")
          .select("day, path, status, country, referrer_host, views")
          .eq("site_id", siteId)
          .order("day", { ascending: false })
          .order("views", { ascending: false })
          .limit(100),
      ]);

      if (cancelled) return;
      setDetail({
        site: mapSite(site),
        deployment: deployment ? mapDeployment(deployment) : null,
        analytics: (analytics ?? []).map(mapAnalytics),
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

  return { detail, setDetail, loading, error };
}
