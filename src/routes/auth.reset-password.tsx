import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotice } from "../context/NoticeContext";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
   const [, navigate] = useLocation();
   const [busy, setBusy] = useState(false);
   const { notice, setNotice, clearNotice } = useNotice();

   async function submitReset(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const password = String(form.get("password") ?? "");
      const confirm = String(form.get("confirmPassword") ?? "");
      if (!password || password !== confirm) {
         setNotice({ tone: "bad", text: "Passwords must match." });
         return;
      }
      setBusy(true);
      clearNotice();
      try {
         const { error } = await supabase.auth.updateUser({ password });
         if (error) throw new Error(error.message);
         navigate("/dashboard", { replace: true });
      } catch (error) {
         setNotice({
            tone: "bad",
            text:
               error instanceof Error
                  ? error.message
                  : "Could not update your password.",
         });
      } finally {
         setBusy(false);
      }
   }

   return (
      <div className="shell-bg min-h-screen flex items-center justify-center p-6">
         <form onSubmit={submitReset} className="max-w-md w-full">
            <Eyebrow className="mb-3">account</Eyebrow>
            <h1 className="font-mono text-[38px] font-semibold tracking-[-0.035em] mb-7">
               Choose a new password
            </h1>
            <div className="grid gap-4">
               <div className="grid gap-1.5">
                  <Label htmlFor="reset-password">New password</Label>
                  <Input
                     id="reset-password"
                     name="password"
                     type="password"
                     mono
                     minLength={8}
                     placeholder="at least 8 characters"
                     required
                  />
               </div>
               <div className="grid gap-1.5">
                  <Label htmlFor="reset-confirm-password">Confirm password</Label>
                  <Input
                     id="reset-confirm-password"
                     name="confirmPassword"
                     type="password"
                     mono
                     minLength={8}
                     placeholder="repeat your password"
                     required
                  />
               </div>
            </div>
            <Button disabled={busy} type="submit" className="w-full mt-7">
               <ShieldCheck size={18} strokeWidth={2} />
               Update password
            </Button>
            {notice && (
               <Alert tone={notice.tone === "bad" ? "danger" : "info"} className="mt-4">
                  {notice.text}
               </Alert>
            )}
         </form>
      </div>
   );
}
