import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? window.location.origin;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "local-dev-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: "pkce" },
});
