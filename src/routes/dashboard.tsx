import { useEffect, type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { AppShell } from "../components/ui/app-shell";
import { Alert } from "../components/ui/alert";
import { useAuth } from "../context/AuthContext";
import { useNotice } from "../context/NoticeContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
   const { sessionEmail, authReady } = useAuth();
   const { notice } = useNotice();
   const [, navigate] = useLocation();

   useEffect(() => {
      if (!authReady) return;
      if (!sessionEmail) {
         navigate("/auth", { replace: true });
      }
   }, [authReady, sessionEmail, navigate]);

   if (!authReady) {
      return null;
   }

   if (!sessionEmail) {
      return <Redirect to="/auth" />;
   }

   return (
      <AppShell>
         {notice && (
            <div className="px-8 pt-6 stack:px-8">
               <Alert tone={notice.tone === "bad" ? "danger" : "info"}>{notice.text}</Alert>
            </div>
         )}
         {children}
      </AppShell>
   );
}
