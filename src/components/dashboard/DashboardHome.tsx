import { LockKeyhole, Plus, Upload } from "lucide-react";
import { useLocation } from "wouter";
import type { SiteSummary } from "../../shared/types";
import { siteAccessLabel, siteDisplayStatus } from "../../lib/site";

export function DashboardHome({ sites }: { sites: SiteSummary[] }) {
  const [, navigate] = useLocation();

  return (
    <section className="dashboardStack">
      <header className="sectionHeader">
        <div>
          <p className="eyebrow">Your sites</p>
          <h1>Deployments you have already added</h1>
        </div>
        <button type="button" onClick={() => navigate("/dashboard/sites/new")}>
          <Plus size={18} /> New site
        </button>
      </header>
      {sites.length === 0 ? (
        <section className="emptyState">
          <Upload size={34} />
          <h2>No sites yet.</h2>
          <p>Start by uploading an HTML file or ZIP archive.</p>
          <button type="button" onClick={() => navigate("/dashboard/sites/new")}>
            <Plus size={18} /> Add your first site
          </button>
        </section>
      ) : (
        <div className="siteCards">
          {sites.map((site) => {
            const status = siteDisplayStatus(site);
            return (
              <button
                key={site.id}
                type="button"
                className={`siteCard ${status.kind === "disabled" ? "disabledSite" : ""}`}
                onClick={() => navigate(`/dashboard/sites/${encodeURIComponent(site.id)}`)}
              >
                <span className={`statusPill ${status.kind}`}>{status.label}</span>
                <strong>
                  {site.name}
                  {site.accessMode === "password" && <LockKeyhole size={14} aria-label="Password protected" className="inlineLock" />}
                </strong>
                <small>/s/{site.slug}/</small>
                <span>{siteAccessLabel(site)}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
