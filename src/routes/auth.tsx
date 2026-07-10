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
    <div className="shell-bg grid grid-cols-[1.1fr_1fr] max-stack:grid-cols-1">
      <aside className="bg-ink text-on-ink p-14 flex flex-col justify-between max-stack:hidden">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-paper text-[15px] text-ink font-mono">
            S
          </span>
          <span className="font-mono text-[19px] font-semibold tracking-[-0.02em]">
            Statics
          </span>
        </div>

        <div>
          <h2 className="font-mono text-[44px] leading-[1.05] font-semibold tracking-[-0.04em]">
            Ship a page <br /> in a minute.
          </h2>
          <p className="text-[16px] leading-[1.6] mt-5 max-w-[420px] text-on-ink/70">
            Your deployments, passwords, expiry rules and analytics stay
            attached to your account.
          </p>
        </div>

        <div className="font-mono text-[12px] text-on-ink/55">
          edge-hosted · /s/&lt;slug&gt; · https
        </div>
      </aside>

      <div className="p-14 flex flex-col justify-center max-stack:p-6">
        <AuthForm mode={mode} setMode={setMode} busy={busy} notice={notice} onSubmit={submitAuth} />
      </div>
    </div>
  );
}
