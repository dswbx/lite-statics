import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { SiteSummary } from "../shared/types";

interface AuthContextValue {
  sessionEmail: string;
  sites: SiteSummary[];
  setSites: React.Dispatch<React.SetStateAction<SiteSummary[]>>;
  loadSites: (email: string) => Promise<boolean>;
  signIn: (email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionEmail, setSessionEmail] = useState(() => localStorage.getItem("static-host-owner") ?? "");
  const [sites, setSites] = useState<SiteSummary[]>([]);

  const loadSites = useCallback(async (email: string) => {
    const response = await fetch(`/api/sites?ownerEmail=${encodeURIComponent(email)}`);
    if (!response.ok) return false;
    const data = (await response.json()) as { sites: SiteSummary[] };
    setSites(data.sites);
    return true;
  }, []);

  useEffect(() => {
    if (!sessionEmail) setSites([]);
  }, [sessionEmail]);

  const signIn = useCallback((email: string) => {
    localStorage.setItem("static-host-owner", email);
    setSessionEmail(email);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("static-host-owner");
    void supabase.auth.signOut().catch(() => undefined);
    setSessionEmail("");
    setSites([]);
  }, []);

  const value = useMemo(
    () => ({ sessionEmail, sites, setSites, loadSites, signIn, signOut }),
    [sessionEmail, sites, loadSites, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
