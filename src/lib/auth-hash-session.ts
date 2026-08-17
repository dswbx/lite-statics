import { supabase } from "./supabase";

/**
 * Completes an auth redirect: PKCE `?code=` (OAuth) or hash tokens (email links).
 * Relies on supabase-js `detectSessionInUrl` for PKCE; does not call exchangeCodeForSession.
 */
export async function consumeAuthRedirectSession(): Promise<{ type: string | null } | null> {
  const params = new URLSearchParams(window.location.search);
  const queryError = params.get("error_description") ?? params.get("error");
  if (queryError) {
    window.history.replaceState(null, "", window.location.pathname);
    throw new Error(queryError);
  }

  const hash = window.location.hash.replace(/^#/, "");
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    const hashError = hashParams.get("error_description") ?? hashParams.get("error");
    if (hashError) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      throw new Error(hashError);
    }

    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      if (error) throw error;
      return { type: hashParams.get("type") };
    }
  }

  // PKCE: supabase-js exchanges `?code=` when detectSessionInUrl is true (default).
  if (params.has("code")) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) {
      window.history.replaceState(null, "", window.location.pathname);
      return { type: null };
    }
    // brief wait for in-flight detectSessionInUrl exchange
    await new Promise((resolve) => setTimeout(resolve, 50));
    const again = await supabase.auth.getSession();
    if (again.error) throw again.error;
    if (again.data.session) {
      window.history.replaceState(null, "", window.location.pathname);
      return { type: null };
    }
    throw new Error("Could not complete sign-in from the provider redirect.");
  }

  return null;
}

/** @deprecated Prefer consumeAuthRedirectSession for PKCE + hash. */
export async function consumeAuthHashSession(): Promise<{ type: string | null } | null> {
  return consumeAuthRedirectSession();
}
