import { mapSite } from "../shared/mappers";
import type { SiteSummary } from "../shared/types";
import { supabase } from "./supabase";

export async function fetchSiteSummaries(): Promise<{ sites: SiteSummary[]; error: boolean }> {
  const { data, error } = await supabase.from("sites").select("*").order("created_at", { ascending: false });
  if (error) return { sites: [], error: true };
  return { sites: (data ?? []).map(mapSite), error: false };
}
