import type { Session } from "@supabase/supabase-js";

export type GetUserFn = () => Promise<{
  data: { user: { id: string; email?: string | null } | null };
  error: Error | null;
}>;

export async function resolveAuthSession(
  session: Session | null,
  getUser: GetUserFn,
): Promise<Session | null> {
  if (!session) return null;
  const { data: { user }, error } = await getUser();
  if (error || !user) return null;
  return session;
}
