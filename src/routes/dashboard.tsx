import { LogOut, Plus } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
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
      <main className="appShell">
         <header className="topbar">
            <button
               type="button"
               className="brandButton"
               onClick={() => navigate("/dashboard")}
            >
               Static Harbor
            </button>
            <nav aria-label="Dashboard">
               <button
                  type="button"
                  className={dashboardActive ? "active" : ""}
                  onClick={() => navigate("/dashboard")}
               >
                  Sites
               </button>
               <button
                  type="button"
                  className={newActive ? "active" : ""}
                  onClick={() => navigate("/dashboard/sites/new")}
               >
                  <Plus size={18} /> New site
               </button>
            </nav>
            <div className="accountChip">
               <span>{sessionEmail}</span>
               <button
                  type="button"
                  className="iconButton"
                  onClick={() => {
                     signOut();
                     navigate("/");
                  }}
                  aria-label="Sign out"
               >
                  <LogOut size={18} />
               </button>
            </div>
         </header>

         {notice && <p className={`notice ${notice.tone}`}>{notice.text}</p>}

         {children}
      </main>
   );
}
