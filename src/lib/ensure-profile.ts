import { supabase } from "./supabase";

export async function ensureProfile(userId: string, email: string): Promise<void> {
  const { data, error: readError } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (readError) throw readError;
  if (data) return;

  const { error: insertError } = await supabase.from("profiles").insert({ id: userId, email });
  if (insertError) throw insertError;
}
