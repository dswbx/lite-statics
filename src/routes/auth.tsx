import { useState } from "react";
import { useLocation } from "wouter";
import { AuthForm } from "../components/auth/AuthForm";
import { useNotice } from "../context/NoticeContext";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [busy, setBusy] = useState(false);
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
      const result =
        mode === "signup"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw new Error(result.error.message);
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
