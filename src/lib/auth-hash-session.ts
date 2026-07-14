import { supabase } from "./supabase";

export async function consumeAuthHashSession(): Promise<{ type: string | null } | null> {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const errorDescription = params.get("error_description") ?? params.get("error");
  if (errorDescription) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    throw new Error(errorDescription);
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  if (error) throw error;

  return { type: params.get("type") };
}
