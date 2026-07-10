import { LogOut, Plus } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { Button } from "../components/ui/Button";
import { Notice } from "../components/ui/Notice";
import { Shell } from "../components/ui/Shell";
import { useAuth } from "../context/AuthContext";
import { useNotice } from "../context/NoticeContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
   const { sessionEmail, authReady, signOut } = useAuth();
   const { notice } = useNotice();
   const [location, navigate] = useLocation();
   const dashboardActive =
      location === "/dashboard" ||
      (location.startsWith("/dashboard/sites/") &&
         location !== "/dashboard/sites/new");
   const newActive = location === "/dashboard/sites/new";

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
      <Shell variant="app">
         <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 border-b-2 border-ink pb-[22px] max-stack:grid-cols-1">
            <Button
               type="button"
               variant="brand"
               onClick={() => navigate("/dashboard")}
            >
               Static Harbor
            </Button>
            <nav className="flex flex-wrap items-center justify-center gap-3 max-stack:justify-stretch" aria-label="Dashboard">
               <Button
                  type="button"
                  variant="nav"
                  active={dashboardActive}
                  onClick={() => navigate("/dashboard")}
               >
                  Sites
               </Button>
               <Button
                  type="button"
                  variant="nav"
                  active={newActive}
                  onClick={() => navigate("/dashboard/sites/new")}
               >
                  <Plus size={18} /> New site
               </Button>
            </nav>
            <div className="flex flex-wrap items-center justify-end gap-3 text-[0.9rem] font-extrabold text-lede max-stack:justify-stretch">
               <span>{sessionEmail}</span>
               <Button
                  type="button"
                  variant="icon"
                  onClick={() => {
                     signOut();
                     navigate("/");
                  }}
                  aria-label="Sign out"
               >
                  <LogOut size={18} />
               </Button>
            </div>
         </header>

         {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

         {children}
      </Shell>
   );
}
