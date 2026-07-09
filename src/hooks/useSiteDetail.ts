import { useEffect, useState } from "react";
import type { AnalyticsRow, DeploymentSummary, SiteDetailResponse, SiteSummary } from "../shared/types";

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
      const response = await fetch(`/api/sites/${siteId}`);
      if (cancelled) return;
      if (!response.ok) {
        setDetail(null);
        setError("Could not load this site.");
        setLoading(false);
        return;
      }
      const data = (await response.json()) as SiteDetailResponse;
      setDetail({ site: data.site, deployment: data.deployment, analytics: data.analytics });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

  return { detail, setDetail, loading, error };
}
