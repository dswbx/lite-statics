import { Grid, Lock, LogOut, Moon, Plus, Sun } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSites } from "@/hooks/useSites";
import type { SiteSummary } from "@/shared/types";
import { Button } from "./button";
import { ConfirmDialog } from "./confirm-dialog";

function ThemeToggle({ className }: { className?: string }) {
   const { resolvedTheme, toggle } = useTheme();
   const isDark = resolvedTheme === "dark";
   return (
      <Button
         type="button"
         variant="ghost"
         size="icon"
         className={cn("size-8 text-muted", className)}
         aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
         onClick={toggle}
      >
         {isDark ? (
            <Sun size={16} strokeWidth={2} />
         ) : (
            <Moon size={16} strokeWidth={2} />
         )}
      </Button>
   );
}

function Brand({ onClick }: { onClick?: () => void }) {
   return (
      <button
         type="button"
         onClick={onClick}
         className="flex items-center gap-2.5 px-2 pt-1 pb-5 font-mono text-[18px] font-semibold"
      >
         <span className="inline-flex size-7 items-center justify-center rounded-lg bg-ink text-[14px] text-on-ink">
            S
         </span>
         Statics
      </button>
   );
}

function NavItem({ site, active }: { site: SiteSummary; active: boolean }) {
   const isPassword = site.accessMode === "password";
   return (
      <Link
         href={`/dashboard/sites/${site.id}`}
         className={cn(
            "flex min-w-0 items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-sm transition-colors",
            active
               ? "bg-accent-soft font-semibold text-ink"
               : "text-muted hover:bg-surface2 hover:text-ink",
         )}
      >
         {isPassword ? (
            <Lock size={13} strokeWidth={2} className="shrink-0" />
         ) : (
            <span className="size-[7px] shrink-0 rounded-full bg-accent" />
         )}
         <span className="truncate">{site.name || site.slug}</span>
      </Link>
   );
}

function AccountFooter({ onRequestLogout }: { onRequestLogout: () => void }) {
   const { sessionEmail } = useAuth();
   const [handle, domain] = sessionEmail.split("@");
   return (
      <div className="mt-auto flex items-center gap-2.5 border-t border-line p-3">
         <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-on-accent">
            {(handle || "?").charAt(0).toUpperCase()}
         </span>
         <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{handle}</div>
            <div className="truncate font-mono text-[11px] text-muted">{domain}</div>
         </div>
         <div className="ml-auto flex items-center gap-0.5">
            <ThemeToggle />
            <Button
               type="button"
               variant="ghost"
               size="icon"
               className="size-8 text-muted"
               aria-label="Log out"
               onClick={onRequestLogout}
            >
               <LogOut size={16} strokeWidth={2} />
            </Button>
         </div>
      </div>
   );
}

function Sidebar({ onRequestLogout }: { onRequestLogout: () => void }) {
   const [location, navigate] = useLocation();
   const { sites } = useSites();
   const newActive = location === "/dashboard/sites/new";

   return (
      <aside className="hidden w-[248px] shrink-0 flex-col self-start border-r border-line bg-surface px-4 py-[22px] stack:sticky stack:top-0 stack:flex stack:h-screen">
         <Brand onClick={() => navigate("/dashboard")} />
         <Button
            type="button"
            variant={newActive ? "accent" : "default"}
            className="mb-[22px] w-full"
            onClick={() => navigate("/dashboard/sites/new")}
         >
            <Plus size={15} strokeWidth={2} /> New site
         </Button>
         <div className="px-2 pb-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
            deployments
         </div>
         <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
            {sites.map((site) => (
               <NavItem
                  key={site.id}
                  site={site}
                  active={location === `/dashboard/sites/${site.id}`}
               />
            ))}
         </nav>
         <AccountFooter onRequestLogout={onRequestLogout} />
      </aside>
   );
}

function MobileTabBar({ onRequestLogout }: { onRequestLogout: () => void }) {
   const [location, navigate] = useLocation();
   const { resolvedTheme, toggle } = useTheme();
   const isDark = resolvedTheme === "dark";
   const sitesActive =
      location === "/dashboard" ||
      (location.startsWith("/dashboard/sites/") && location !== "/dashboard/sites/new");
   return (
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-around border-t border-line bg-surface px-6 pt-2 pb-3 stack:hidden">
         <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className={cn("flex flex-col items-center gap-1 text-[11px]", sitesActive ? "text-ink" : "text-muted")}
         >
            <Grid size={20} strokeWidth={2} />
            Sites
         </button>
         <button
            type="button"
            onClick={() => navigate("/dashboard/sites/new")}
            className="flex flex-col items-center gap-1 text-[11px] text-ink"
            aria-label="New site"
         >
            <span className="-mt-6 flex size-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-pop">
               <Plus size={22} strokeWidth={2} />
            </span>
            New
         </button>
         <button
            type="button"
            onClick={toggle}
            className="flex flex-col items-center gap-1 text-[11px] text-muted"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
         >
            {isDark ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
            Theme
         </button>
         <button
            type="button"
            onClick={onRequestLogout}
            className="flex flex-col items-center gap-1 text-[11px] text-muted"
         >
            <LogOut size={20} strokeWidth={2} />
            Logout
         </button>
      </nav>
   );
}

export function AppShell({ children }: { children: ReactNode }) {
   const { signOut } = useAuth();
   const [, navigate] = useLocation();
   const [logoutOpen, setLogoutOpen] = useState(false);

   return (
      <div className="flex min-h-screen bg-paper">
         <Sidebar onRequestLogout={() => setLogoutOpen(true)} />
         <main className="min-w-0 flex-1 pb-24 stack:pb-0">{children}</main>
         <MobileTabBar onRequestLogout={() => setLogoutOpen(true)} />
         <ConfirmDialog
            open={logoutOpen}
            onOpenChange={setLogoutOpen}
            title="Log out?"
            description="You'll need to sign in again to manage your sites."
            confirmLabel="Log out"
            onConfirm={() => {
               signOut();
               navigate("/");
            }}
         />
      </div>
   );
}
