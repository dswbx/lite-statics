import { LockKeyhole, Plus, Upload } from "lucide-react";
import { useLocation } from "wouter";
import type { SiteSummary } from "../../shared/types";
import { siteAccessLabel, siteDisplayStatus } from "../../lib/site";
import { Eyebrow } from "../ui/Eyebrow";
import { StatusPill } from "../ui/StatusPill";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";

export function DashboardHome({ sites }: { sites: SiteSummary[] }) {
   const [, navigate] = useLocation();

   return (
      <section className="grid gap-6 pt-[26px]">
         <header className="flex items-center justify-between gap-[18px] max-stack:flex-col max-stack:items-stretch">
            <div>
               <Eyebrow>Your sites</Eyebrow>
               <h1 className="mb-1 text-[clamp(2rem,4.5vw,4.2rem)]">Deployments</h1>
            </div>
            <Button
               type="button"
               onClick={() => navigate("/dashboard/sites/new")}
            >
               <Plus size={18} /> New site
            </Button>
         </header>
         {sites.length === 0 ? (
            <section className="grid min-h-[340px] place-items-center content-center gap-3 border-2 border-ink bg-surface p-7 text-center shadow-brutal">
               <Upload size={34} />
               <h2>No sites yet.</h2>
               <p>Start by uploading an HTML file or ZIP archive.</p>
               <Button
                  type="button"
                  onClick={() => navigate("/dashboard/sites/new")}
               >
                  <Plus size={18} /> Add your first site
               </Button>
            </section>
         ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[18px]">
               {sites.map((site) => {
                  const status = siteDisplayStatus(site);
                  const isDisabled = status.kind === "disabled";
                  return (
                     <button
                        key={site.id}
                        type="button"
                        className={cn(
                           "grid min-h-[190px] content-start justify-stretch gap-2.5 border-2 border-ink bg-surface text-left text-ink shadow-brutal hover:bg-sky",
                           isDisabled && "bg-warm hover:bg-warm-hover",
                        )}
                        onClick={() =>
                           navigate(
                              `/dashboard/sites/${encodeURIComponent(site.id)}`
                           )
                        }
                     >
                        <StatusPill kind={status.kind}>{status.label}</StatusPill>
                        <strong className="text-[1.25rem]">
                           {site.name}
                           {site.accessMode === "password" && (
                              <LockKeyhole
                                 size={14}
                                 aria-label="Password protected"
                                 className="ml-1.5 inline-block align-[-2px]"
                              />
                           )}
                        </strong>
                        <small className="text-muted">/s/{site.slug}/</small>
                        <span className="text-muted">{siteAccessLabel(site)}</span>
                     </button>
                  );
               })}
            </div>
         )}
      </section>
   );
}
