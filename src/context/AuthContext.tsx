import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface AuthContextValue {
  sessionEmail: string;
  userId: string;
  authReady: boolean;
  signOut: () => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionEmail, setSessionEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [authReady, setAuthReady] = useState(false);

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const syncSession = useCallback((session: { user: { id: string; email?: string | null } } | null) => {
    setSessionEmail(session?.user.email ?? "");
    setUserId(session?.user.id ?? "");
    setAuthReady(true);
  }, []);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [syncSession]);

  const signOut = useCallback(() => {
    void supabase.auth.signOut().catch(() => undefined);
    setSessionEmail("");
    setUserId("");
  }, []);

  const value = useMemo(
    () => ({ sessionEmail, userId, authReady, signOut, getAccessToken }),
    [sessionEmail, userId, authReady, signOut, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
