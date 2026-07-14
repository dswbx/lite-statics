import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { consumeAuthHashSession } from "../lib/auth-hash-session";
import { resolveAuthSession } from "../lib/resolve-auth-session";
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
  const [, navigate] = useLocation();

  const syncSession = useCallback((session: { user: { id: string; email?: string | null } } | null) => {
    setSessionEmail(session?.user.email ?? "");
    setUserId(session?.user.id ?? "");
    setAuthReady(true);
  }, []);

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const resolved = await resolveAuthSession(data.session, () => supabase.auth.getUser());
    if (!resolved) {
      if (data.session) {
        await supabase.auth.signOut();
        syncSession(null);
      }
      return null;
    }
    return resolved.access_token;
  }, [syncSession]);

  useEffect(() => {
    void consumeAuthHashSession()
      .then((result) => {
        if (!result) return;
        if (result.type === "recovery") {
          navigate("/auth/reset-password", { replace: true });
          return;
        }
        navigate("/dashboard", { replace: true });
      })
      .catch(() => undefined);
  }, [navigate]);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") {
        const resolved = await resolveAuthSession(session, () => supabase.auth.getUser());
        if (!resolved && session) {
          await supabase.auth.signOut();
        }
        syncSession(resolved);
        return;
      }
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
