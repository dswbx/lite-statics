import { Globe, Lock, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import type { SiteSummary } from "../../shared/types";
import { Eyebrow } from "../ui/eyebrow";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { ToggleGroup, ToggleItem } from "../ui/toggle-group";
import { MiniMetric } from "../ui/metric";
import { formatBytes } from "../../lib/format";
import { cn } from "../../lib/cn";

type Filter = "all" | "public" | "password";

function splitFormattedBytes(totalBytes: number | null): {
   value: string;
   unit: string;
} {
   const formatted = formatBytes(totalBytes || 0);
   const match = formatted.match(/^([\d.]+)\s*(.*)$/);
   if (!match) return { value: formatted, unit: "" };
   return { value: match[1], unit: match[2] };
}

function uploadedDate(site: SiteSummary): string {
   const source = site.deployedAt || site.createdAt;
   if (!source) return "";
   return new Date(source).toISOString().slice(0, 10);
}

function isLive(site: SiteSummary): boolean {
   if (site.disabledAt) return false;
   if (!site.expiresAt) return true;
   return new Date(site.expiresAt).getTime() > Date.now();
}

function NewSiteCard({ onClick }: { onClick: () => void }) {
   return (
      <button
         type="button"
         onClick={onClick}
         className="flex min-h-60 min-w-60 flex-col items-center justify-center gap-3 rounded-[14px] border-[1.5px] border-dashed border-line text-muted transition-colors hover:border-accent"
      >
         <span className="flex size-12 items-center justify-center rounded-xl bg-surface2">
            <Plus size={20} strokeWidth={2} className="text-ink" />
         </span>
         <span className="text-[15px] font-semibold text-ink">New site</span>
         <span className="font-mono text-[12px]">upload HTML or ZIP</span>
      </button>
   );
}

export function DashboardHome({ sites }: { sites: SiteSummary[] }) {
   const [, navigate] = useLocation();
   const [filter, setFilter] = useState<Filter>("all");
   const [search, setSearch] = useState("");

   const liveCount = useMemo(() => sites.filter(isLive).length, [sites]);

   const filteredSites = useMemo(() => {
      const query = search.trim().toLowerCase();
      return sites.filter((site) => {
         if (filter !== "all" && site.accessMode !== filter) return false;
         if (!query) return true;
         return (
            site.name.toLowerCase().includes(query) ||
            site.slug.toLowerCase().includes(query)
         );
      });
   }, [sites, filter, search]);

   if (sites.length === 0) {
      return (
         <div>
            <header className="border-b border-line px-8 py-7 max-stack:px-5 max-stack:py-5">
               <div className="flex items-end justify-between gap-4 max-stack:flex-col max-stack:items-start">
                  <div>
                     <Eyebrow>your sites</Eyebrow>
                     <h1 className="font-mono text-[44px] leading-none font-semibold tracking-[-0.035em] max-stack:text-[34px]">
                        Deployments
                     </h1>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="font-mono text-[13px] text-muted">
                        0 sites · 0 live
                     </span>
                     <Button
                        type="button"
                        onClick={() => navigate("/dashboard/sites/new")}
                     >
                        <Plus size={16} strokeWidth={2} /> New site
                     </Button>
                  </div>
               </div>
            </header>
            <div className="px-8 py-7 max-stack:px-5 max-stack:py-5">
               <div className="mx-auto flex max-w-[420px] flex-col items-center gap-4 py-16 text-center">
                  <h2 className="font-mono text-[20px] font-semibold tracking-[-0.02em]">
                     No deployments yet
                  </h2>
                  <NewSiteCard
                     onClick={() => navigate("/dashboard/sites/new")}
                  />
               </div>
            </div>
         </div>
      );
   }

   return (
      <div>
         <header className="border-b border-line px-8 py-7 max-stack:px-5 max-stack:py-5">
            <div className="flex items-end justify-between gap-4 max-stack:flex-col max-stack:items-start">
               <div>
                  <Eyebrow>your sites</Eyebrow>
                  <h1 className="font-mono text-[44px] leading-none font-semibold tracking-[-0.035em] max-stack:text-[34px]">
                     Deployments
                  </h1>
               </div>
               <div className="flex items-center gap-4">
                  <span className="font-mono text-[13px] text-muted">
                     {sites.length} {sites.length === 1 ? "site" : "sites"} ·{" "}
                     {liveCount} live
                  </span>
                  <Button
                     type="button"
                     onClick={() => navigate("/dashboard/sites/new")}
                  >
                     <Plus size={16} strokeWidth={2} /> New site
                  </Button>
               </div>
            </div>
         </header>
         <div className="px-8 py-7 max-stack:px-5 max-stack:py-5">
            <div className="mb-5 flex items-center gap-2.5 max-stack:flex-wrap">
               <ToggleGroup
                  value={filter}
                  onValueChange={(value) => setFilter(value as Filter)}
               >
                  <ToggleItem value="all">All</ToggleItem>
                  <ToggleItem value="public">Public</ToggleItem>
                  <ToggleItem value="password">Password</ToggleItem>
               </ToggleGroup>
               <div className="relative ml-auto">
                  <Search
                     size={14}
                     strokeWidth={2}
                     className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                  />
                  <Input
                     mono
                     value={search}
                     onChange={(event) => setSearch(event.currentTarget.value)}
                     placeholder="search sites"
                     className="w-[220px] pl-8"
                  />
               </div>
            </div>
            <div className="grid grid-cols-3 gap-[18px] max-stack:grid-cols-1">
               {filteredSites.map((site) => {
                  const live = isLive(site);
                  const isPassword = site.accessMode === "password";
                  const { value: sizeValue, unit: sizeUnit } =
                     splitFormattedBytes(site.totalBytes);
                  return (
                     <Card
                        key={site.id}
                        onClick={() =>
                           navigate(
                              `/dashboard/sites/${encodeURIComponent(site.id)}`
                           )
                        }
                        className="relative flex cursor-pointer flex-col gap-4 overflow-hidden p-[22px] transition-shadow hover:shadow-card"
                     >
                        <span
                           className={cn(
                              "absolute inset-x-0 top-0 h-1",
                              isPassword ? "bg-muted" : "bg-accent"
                           )}
                        />
                        <div className="mt-1 flex items-center justify-between">
                           {live ? (
                              <Badge variant="accent">
                                 <span className="size-1.5 rounded-full bg-accent" />
                                 live
                              </Badge>
                           ) : (
                              <Badge variant="muted">disabled</Badge>
                           )}
                           <span className="flex items-center gap-1.5 text-[12px] text-muted">
                              {isPassword ? (
                                 <Lock size={13} strokeWidth={2} />
                              ) : (
                                 <Globe size={13} strokeWidth={2} />
                              )}
                              {isPassword ? "Password" : "Public"}
                           </span>
                        </div>
                        <div>
                           <div className="truncate text-[22px] font-bold tracking-[-0.01em]">
                              {site.name}
                           </div>
                           <div className="mt-1.5 truncate font-mono text-[13px] text-accent">
                              /s/{site.slug}/
                           </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-3 gap-2 border-t border-line pt-4">
                           <MiniMetric label="views" value={0} />
                           <MiniMetric
                              label="files"
                              value={site.assetCount || 0}
                           />
                           <MiniMetric
                              label="size"
                              value={sizeValue}
                              unit={sizeUnit}
                           />
                        </div>
                        <div className="font-mono text-[11px] text-muted">
                           uploaded {uploadedDate(site)}
                        </div>
                     </Card>
                  );
               })}
               <NewSiteCard onClick={() => navigate("/dashboard/sites/new")} />
            </div>
         </div>
      </div>
   );
}
