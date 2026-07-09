import { useState } from "react";
import { useLocation } from "wouter";
import { AuthForm } from "../components/auth/AuthForm";
import { useAuth } from "../context/AuthContext";
import { useNotice } from "../context/NoticeContext";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [busy, setBusy] = useState(false);
  const { signIn, loadSites } = useAuth();
  const { notice, setNotice, clearNotice } = useNotice();
  const [, navigate] = useLocation();

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    if (!email || !password) return;
    setBusy(true);
    clearNotice();
    try {
      const endpoint = mode === "signup" ? "/api/signup" : "/api/signin";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Authentication failed.");
      if (mode === "signup") {
        await supabase.auth.signUp({ email, password }).catch(() => undefined);
      } else {
        await supabase.auth.signInWithPassword({ email, password }).catch(() => undefined);
      }
      signIn(email);
      const loaded = await loadSites(email);
      if (!loaded) {
        setNotice({ tone: "bad", text: "Could not load sites. Run through the Cloudflare Worker dev server for API access." });
      }
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "Authentication failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authShell">
      <AuthForm mode={mode} setMode={setMode} busy={busy} notice={notice} onSubmit={submitAuth} />
    </main>
  );
}
