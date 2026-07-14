import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { AuthForm, type AuthMode } from "../components/auth/AuthForm";
import { useNotice } from "../context/NoticeContext";
import { supabase } from "../lib/supabase";

function modeFromSearch(search: string): AuthMode {
   const mode = new URLSearchParams(search).get("mode");
   if (mode === "signin" || mode === "forgot") return mode;
   return "signup";
}

export default function AuthPage() {
   const search = useSearch();
   const [mode, setMode] = useState<AuthMode>(() => modeFromSearch(search));
   const [pendingEmail, setPendingEmail] = useState<string | null>(null);
   const [busy, setBusy] = useState(false);
   const { notice, setNotice, clearNotice } = useNotice();
   const [, navigate] = useLocation();

   async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const email = String(form.get("email") ?? "")
         .trim()
         .toLowerCase();
      const password = String(form.get("password") ?? "");
      if (!email) return;

      setBusy(true);
      clearNotice();

      try {
         if (mode === "forgot") {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw new Error(error.message);
            setPendingEmail(email);
            return;
         }

         if (!password) return;

         if (mode === "signup") {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw new Error(error.message);
            if (data.session) {
               navigate("/dashboard", { replace: true });
               return;
            }
            setPendingEmail(email);
            return;
         }

         const { error } = await supabase.auth.signInWithPassword({ email, password });
         if (error) throw new Error(error.message);
         navigate("/dashboard", { replace: true });
      } catch (error) {
         setNotice({
            tone: "bad",
            text:
               error instanceof Error
                  ? error.message
                  : "Authentication failed.",
         });
      } finally {
         setBusy(false);
      }
   }

   async function verifyCode(code: string) {
      if (!pendingEmail) return;

      setBusy(true);
      clearNotice();

      try {
         const type = mode === "forgot" ? "recovery" : "signup";

         await Promise.all([
            new Promise((resolve) => setTimeout(resolve, 800)),
            (async () => {
               const { error } = await supabase.auth.verifyOtp({
                  email: pendingEmail,
                  token: code,
                  type,
               });
               if (error) throw new Error(error.message);

               if (mode === "forgot") {
                  navigate("/auth/reset-password", { replace: true });
                  return;
               }

               navigate("/dashboard", { replace: true });
            })(),
         ]);
      } catch (error) {
         setNotice({
            tone: "bad",
            text:
               error instanceof Error
                  ? error.message
                  : "Could not verify the code.",
         });
      } finally {
         setBusy(false);
      }
   }

   return (
      <div className="shell-bg grid grid-cols-[1.1fr_1fr] max-stack:grid-cols-1">
         <aside className="auth-aside bg-ink text-on-ink p-14 flex flex-col justify-between max-stack:hidden">
            <div className="flex items-center gap-2.5">
               <span className="inline-flex size-7 items-center justify-center rounded-lg bg-paper text-[15px] text-ink font-mono">
                  S
               </span>
               <span className="font-mono text-[19px] font-semibold tracking-[-0.02em]">
                  Statics
               </span>
            </div>

            <div>
               <h2 className="font-mono text-[50px] leading-none font-semibold tracking-tighter">
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
            <AuthForm
               mode={mode}
               setMode={(nextMode) => {
                  setPendingEmail(null);
                  clearNotice();
                  setMode(nextMode);
               }}
               busy={busy}
               notice={notice}
               pendingEmail={pendingEmail}
               onSubmit={submitAuth}
               onVerifyCode={verifyCode}
            />
         </div>
      </div>
   );
}
