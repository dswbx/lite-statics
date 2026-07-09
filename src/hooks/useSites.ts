import { fetchSiteSummaries } from "../lib/sites";
import type { SiteSummary } from "../shared/types";
import { useAsyncLoad } from "./useAsyncLoad";

export function useSites() {
  const { data: sites, loading, error, reload, setData: setSites } = useAsyncLoad<SiteSummary[], boolean>(
    async () => {
      const result = await fetchSiteSummaries();
      if (result.error) return { data: [], error: true };
      return { data: result.sites, error: false };
    },
    [],
    {
      initialData: [],
      cacheKey: "sites",
    },
  );

  return { sites, loading, error, reload, setSites };
}
