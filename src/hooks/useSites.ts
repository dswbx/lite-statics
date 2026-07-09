import { useCallback, useEffect, useState } from "react";
import { fetchSiteSummaries } from "../lib/sites";
import type { SiteSummary } from "../shared/types";

export function useSites() {
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    const result = await fetchSiteSummaries();
    if (result.error) {
      setError(true);
      setSites([]);
      setLoading(false);
      return false;
    }
    setSites(result.sites);
    setLoading(false);
    return true;
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { sites, loading, error, reload, setSites };
}
