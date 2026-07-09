import {
  Activity,
  BarChart3,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Copy,
  Trash2,
  ExternalLink,
  FileArchive,
  FileText,
  Globe2,
  LockKeyhole,
  LogOut,
  MapPinned,
  Pencil,
  Plus,
  Rocket,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import worldMap from "world-atlas/countries-110m.json";
import JSZip from "jszip";
import { supabase } from "../lib/supabase";
import type { AnalyticsRow, DeploymentSummary, SiteDetailResponse, SiteSummary } from "../shared/types";

type Notice = { tone: "ok" | "bad"; text: string } | null;
type AuthMode = "signin" | "signup";
type DashboardRoute = { kind: "landing" } | { kind: "auth" } | { kind: "dashboard" } | { kind: "new" } | { kind: "site"; siteId: string };
type PreviewAsset = { pathname: string; size: number };

interface SiteWithDetail {
  site: SiteSummary;
  deployment: DeploymentSummary | null;
  analytics: AnalyticsRow[];
}

export function App() {
  const [sessionEmail, setSessionEmail] = useState(() => localStorage.getItem("static-host-owner") ?? "");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [route, setRoute] = useState<DashboardRoute>(() => parseDashboardRoute(window.location.pathname));
  const [detail, setDetail] = useState<SiteWithDetail | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [newSiteFile, setNewSiteFile] = useState<File | null>(null);
  const [newSiteAssets, setNewSiteAssets] = useState<PreviewAsset[]>([]);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteSlug, setNewSiteSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [replacementUpload, setReplacementUpload] = useState<File | null>(null);
  const [showReplacementUpload, setShowReplacementUpload] = useState(false);
  const [dragTarget, setDragTarget] = useState<"new" | "replace" | null>(null);

  const selectedSite = useMemo(
    () => (route.kind === "site" ? sites.find((site) => site.id === route.siteId) ?? null : null),
    [route, sites],
  );
  const visibleSite = detail?.site ?? selectedSite;
  const publicUrl = visibleSite ? `${window.location.origin}/s/${visibleSite.slug}/` : "";
  const hasDeployment = Boolean(detail?.deployment ?? visibleSite?.activeDeploymentId);
  const totalViews = detail?.analytics.reduce((sum, row) => sum + row.views, 0) ?? 0;

  useEffect(() => {
    const onPopState = () => setRoute(parseDashboardRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (sessionEmail) {
      void loadSites(sessionEmail);
      return;
    }
    setSites([]);
    setDetail(null);
    if (route.kind === "dashboard" || route.kind === "new" || route.kind === "site") {
      navigateToRoute({ kind: "auth" }, true);
    }
  }, [sessionEmail, route.kind]);

  useEffect(() => {
    if (route.kind !== "site") {
      setDetail(null);
      return;
    }
    void loadDetail(route.siteId);
  }, [route]);

  function navigateToRoute(nextRoute: DashboardRoute, replace = false) {
    const nextPath = routePath(nextRoute);
    if (window.location.pathname !== nextPath) {
      const method = replace ? "replaceState" : "pushState";
      window.history[method](null, "", nextPath);
    }
    setRoute(nextRoute);
    setNotice(null);
  }

  async function loadSites(email: string) {
    const response = await fetch(`/api/sites?ownerEmail=${encodeURIComponent(email)}`);
    if (!response.ok) {
      setNotice({ tone: "bad", text: "Could not load sites. Run through the Cloudflare Worker dev server for API access." });
      return;
    }
    const data = (await response.json()) as { sites: SiteSummary[] };
    setSites(data.sites);
  }

  async function loadDetail(siteId: string) {
    const response = await fetch(`/api/sites/${siteId}`);
    if (!response.ok) {
      setNotice({ tone: "bad", text: "Could not load this site." });
      return;
    }
    const data = (await response.json()) as SiteDetailResponse;
    setDetail({ site: data.site, deployment: data.deployment, analytics: data.analytics });
  }

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    if (!email || !password) return;
    setBusy(true);
    setNotice(null);
    try {
      const endpoint = authMode === "signup" ? "/api/signup" : "/api/signin";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Authentication failed.");
      if (authMode === "signup") {
        await supabase.auth.signUp({ email, password }).catch(() => undefined);
      } else {
        await supabase.auth.signInWithPassword({ email, password }).catch(() => undefined);
      }
      localStorage.setItem("static-host-owner", email);
      setSessionEmail(email);
      await loadSites(email);
      navigateToRoute({ kind: "dashboard" }, true);
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "Authentication failed." });
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem("static-host-owner");
    void supabase.auth.signOut().catch(() => undefined);
    setSessionEmail("");
    setSites([]);
    setDetail(null);
    navigateToRoute({ kind: "landing" });
  }

  async function chooseNewSiteUpload(file: File | undefined) {
    if (!validateUpload(file)) return;
    try {
      const assets = await previewUploadAssets(file);
      setNewSiteFile(file);
      setNewSiteAssets(assets);
      const fallbackName = titleFromFile(file.name);
      setNewSiteName((current) => current || fallbackName);
      if (!slugEdited) setNewSiteSlug(uniqueSlug(fallbackName, sites.map((site) => site.slug)));
      setNotice(null);
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "Could not read upload." });
      setNewSiteFile(null);
      setNewSiteAssets([]);
    }
  }

  function chooseReplacementUpload(file: File | undefined) {
    if (!validateUpload(file)) return;
    setReplacementUpload(file);
    setShowReplacementUpload(true);
    setNotice({ tone: "ok", text: `${file.name} is ready to replace the current upload.` });
  }

  function validateUpload(file: File | undefined): file is File {
    if (!file) return false;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".html") && !name.endsWith(".htm") && !name.endsWith(".zip")) {
      setNotice({ tone: "bad", text: "Use one HTML file or one ZIP archive." });
      return false;
    }
    return true;
  }

  async function createAndDeploySite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionEmail || !newSiteFile) {
      setNotice({ tone: "bad", text: "Upload assets before creating a site." });
      return;
    }
    const name = newSiteName.trim() || titleFromFile(newSiteFile.name);
    const slug = slugify(newSiteSlug || name);
    setBusy(true);
    setNotice(null);
    try {
      const createResponse = await fetch("/api/sites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ownerEmail: sessionEmail, name, slug }),
      });
      const created = (await createResponse.json()) as { site?: SiteSummary; error?: string };
      if (!createResponse.ok || !created.site) throw new Error(created.error ?? "Could not create site.");

      const form = new FormData();
      form.set("file", newSiteFile);
      const deployResponse = await fetch(`/api/sites/${created.site.id}/deploy`, { method: "POST", body: form });
      const deployed = (await deployResponse.json()) as { site?: SiteSummary; deployment?: DeploymentSummary; publicUrl?: string; error?: string };
      if (!deployResponse.ok || !deployed.site || !deployed.deployment) throw new Error(deployed.error ?? "Upload failed.");

      setSites((current) => [deployed.site!, ...current.filter((site) => site.id !== deployed.site!.id)]);
      setDetail({ site: deployed.site, deployment: deployed.deployment, analytics: [] });
      setNewSiteFile(null);
      setNewSiteAssets([]);
      setNewSiteName("");
      setNewSiteSlug("");
      setSlugEdited(false);
      navigateToRoute({ kind: "site", siteId: deployed.site.id });
      setNotice({ tone: "ok", text: `Site published at ${new URL(deployed.publicUrl ?? `/s/${deployed.site.slug}/`, window.location.origin).toString()}` });
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "Could not publish site." });
    } finally {
      setBusy(false);
    }
  }

  async function deployReplacement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const managedSite = detail?.site ?? selectedSite;
    if (!managedSite || !replacementUpload) return;
    const form = new FormData();
    form.set("file", replacementUpload);
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/sites/${managedSite.id}/deploy`, { method: "POST", body: form });
      const data = (await response.json()) as { site?: SiteSummary; deployment?: DeploymentSummary; publicUrl?: string; error?: string };
      if (!response.ok || !data.site || !data.deployment) throw new Error(data.error ?? "Deploy failed.");
      setSites((current) => current.map((site) => (site.id === data.site!.id ? data.site! : site)));
      setDetail({ site: data.site, deployment: data.deployment, analytics: detail?.analytics ?? [] });
      setReplacementUpload(null);
      setShowReplacementUpload(false);
      setNotice({ tone: "ok", text: "Upload replaced. The public URL now serves the new version." });
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "Deploy failed." });
    } finally {
      setBusy(false);
    }
  }

  async function updateAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const managedSite = detail?.site ?? selectedSite;
    if (!managedSite) return;
    const form = new FormData(event.currentTarget);
    const accessMode = String(form.get("accessMode"));
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/sites/${managedSite.id}/access`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accessMode,
          password: form.get("password"),
          expiresAt: form.get("expiresAt") ? new Date(String(form.get("expiresAt"))).toISOString() : null,
          disabled: form.get("disabled") === "on",
        }),
      });
      const data = (await response.json()) as { site?: SiteSummary; error?: string };
      if (!response.ok || !data.site) throw new Error(data.error ?? "Could not update access.");
      setSites((current) => current.map((site) => (site.id === data.site!.id ? data.site! : site)));
      setDetail((current) => (current ? { ...current, site: data.site! } : current));
      setNotice({ tone: "ok", text: "Access settings updated." });
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "Could not update access." });
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrentSite(site: SiteSummary) {
    if (!window.confirm(`Delete ${site.name}? This removes the site, deployments, settings, and analytics.`)) return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/sites/${site.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not delete site.");
      setSites((current) => current.filter((item) => item.id !== site.id));
      setDetail(null);
      navigateToRoute({ kind: "dashboard" });
      setNotice({ tone: "ok", text: `${site.name} was deleted.` });
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "Could not delete site." });
    } finally {
      setBusy(false);
    }
  }

  if (route.kind === "landing") {
    return <Landing signedIn={Boolean(sessionEmail)} onAuth={() => navigateToRoute({ kind: "auth" })} onDashboard={() => navigateToRoute({ kind: "dashboard" })} />;
  }

  if (route.kind === "auth") {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        busy={busy}
        notice={notice}
        onSubmit={submitAuth}
        onHome={() => navigateToRoute({ kind: "landing" })}
      />
    );
  }

  return (
    <main className="appShell">
      <header className="topbar">
        <button type="button" className="brandButton" onClick={() => navigateToRoute({ kind: "dashboard" })}>
          Static Harbor
        </button>
        <nav aria-label="Dashboard">
          <button type="button" className={route.kind === "dashboard" ? "active" : ""} onClick={() => navigateToRoute({ kind: "dashboard" })}>
            Sites
          </button>
          <button type="button" className={route.kind === "new" ? "active" : ""} onClick={() => navigateToRoute({ kind: "new" })}>
            <Plus size={18} /> New site
          </button>
        </nav>
        <div className="accountChip">
          <span>{sessionEmail}</span>
          <button type="button" className="iconButton" onClick={signOut} aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {notice && <p className={`notice ${notice.tone}`}>{notice.text}</p>}

      {route.kind === "dashboard" && (
        <DashboardHome sites={sites} onNew={() => navigateToRoute({ kind: "new" })} onOpen={(siteId) => navigateToRoute({ kind: "site", siteId })} />
      )}

      {route.kind === "new" && (
        <NewSiteScreen
          file={newSiteFile}
          assets={newSiteAssets}
          name={newSiteName}
          slug={newSiteSlug}
          busy={busy}
          dragActive={dragTarget === "new"}
          onChooseFile={chooseNewSiteUpload}
          onName={setNewSiteName}
          onSlug={(value) => {
            setSlugEdited(true);
            setNewSiteSlug(slugify(value));
          }}
          onDrag={(active) => setDragTarget(active ? "new" : null)}
          onSubmit={createAndDeploySite}
        />
      )}

      {route.kind === "site" && visibleSite && (
        <SiteManageScreen
          site={visibleSite}
          deployment={detail?.deployment ?? null}
          analytics={detail?.analytics ?? []}
          publicUrl={publicUrl}
          hasDeployment={hasDeployment}
          replacementUpload={replacementUpload}
          showReplacementUpload={showReplacementUpload}
          busy={busy}
          totalViews={totalViews}
          dragActive={dragTarget === "replace"}
          onChooseReplacement={chooseReplacementUpload}
          onShowReplacementUpload={setShowReplacementUpload}
          onDrag={(active) => setDragTarget(active ? "replace" : null)}
          onDeploy={deployReplacement}
          onUpdateAccess={updateAccess}
          onDelete={deleteCurrentSite}
        />
      )}

      {route.kind === "site" && !visibleSite && (
        <section className="emptyState">
          <Rocket size={34} />
          <h2>Loading site...</h2>
        </section>
      )}
    </main>
  );
}

function Landing({ signedIn, onAuth, onDashboard }: { signedIn: boolean; onAuth: () => void; onDashboard: () => void }) {
  return (
    <main className="landingShell">
      <section className="landingHero">
        <p className="eyebrow">Static hosting for small sites</p>
        <h1>Upload HTML. Share a public URL.</h1>
        <p className="lede">
          Static Harbor hosts one-page HTML files or ZIP static sites on Cloudflare. You need an account before uploading so your deployments,
          passwords, expiry rules, and analytics stay attached to you.
        </p>
        <div className="heroActions">
          <button type="button" onClick={signedIn ? onDashboard : onAuth}>
            <ShieldCheck size={18} /> {signedIn ? "Open dashboard" : "Sign up to upload"}
          </button>
          {!signedIn && (
            <button type="button" className="ghost" onClick={onAuth}>
              Sign in
            </button>
          )}
        </div>
      </section>
      <section className="explainerGrid">
        <Explainer icon={<Upload />} title="Upload after sign up" text="Start from an HTML file or a ZIP with index.html. No anonymous drop zone." />
        <Explainer icon={<Globe2 />} title="Publish to /s/slug" text="Each site gets a stable public endpoint that serves your uploaded assets." />
        <Explainer icon={<LockKeyhole />} title="Control access" text="Switch between public and password access, set expiry, and review simple analytics." />
      </section>
    </main>
  );
}

function AuthScreen({
  mode,
  setMode,
  busy,
  notice,
  onSubmit,
  onHome,
}: {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  busy: boolean;
  notice: Notice;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onHome: () => void;
}) {
  return (
    <main className="authShell">
      <button type="button" className="brandButton" onClick={onHome}>
        Static Harbor
      </button>
      <form onSubmit={onSubmit} className="authCard">
        <p className="eyebrow">{mode === "signup" ? "Create account" : "Welcome back"}</p>
        <h1>{mode === "signup" ? "Sign up before uploading." : "Sign in to manage sites."}</h1>
        <div className="segmented modeSwitch">
          <label>
            <input type="radio" name="mode" checked={mode === "signup"} onChange={() => setMode("signup")} /> Sign up
          </label>
          <label>
            <input type="radio" name="mode" checked={mode === "signin"} onChange={() => setMode("signin")} /> Sign in
          </label>
        </div>
        <label>
          Email
          <input name="email" type="email" placeholder="you@example.com" required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength={8} placeholder="At least 8 characters" required />
        </label>
        <button disabled={busy} type="submit">
          <ShieldCheck size={18} /> {mode === "signup" ? "Create account" : "Sign in"}
        </button>
        {notice && <p className={`notice inline ${notice.tone}`}>{notice.text}</p>}
      </form>
    </main>
  );
}

function DashboardHome({ sites, onNew, onOpen }: { sites: SiteSummary[]; onNew: () => void; onOpen: (siteId: string) => void }) {
  return (
    <section className="dashboardStack">
      <header className="sectionHeader">
        <div>
          <p className="eyebrow">Your sites</p>
          <h1>Deployments you have already added</h1>
        </div>
        <button type="button" onClick={onNew}>
          <Plus size={18} /> New site
        </button>
      </header>
      {sites.length === 0 ? (
        <section className="emptyState">
          <Upload size={34} />
          <h2>No sites yet.</h2>
          <p>Start by uploading an HTML file or ZIP archive.</p>
          <button type="button" onClick={onNew}>
            <Plus size={18} /> Add your first site
          </button>
        </section>
      ) : (
        <div className="siteCards">
          {sites.map((site) => {
            const status = siteDisplayStatus(site);
            return (
              <button key={site.id} type="button" className={`siteCard ${status.kind === "disabled" ? "disabledSite" : ""}`} onClick={() => onOpen(site.id)}>
                <span className={`statusPill ${status.kind}`}>{status.label}</span>
                <strong>{site.name}</strong>
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

function NewSiteScreen({
  file,
  assets,
  name,
  slug,
  busy,
  dragActive,
  onChooseFile,
  onName,
  onSlug,
  onDrag,
  onSubmit,
}: {
  file: File | null;
  assets: PreviewAsset[];
  name: string;
  slug: string;
  busy: boolean;
  dragActive: boolean;
  onChooseFile: (file: File | undefined) => void;
  onName: (value: string) => void;
  onSlug: (value: string) => void;
  onDrag: (active: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="createLayout">
      <section className="panel strong uploadFirst">
        <p className="eyebrow">New site</p>
        <h1>Upload assets first.</h1>
        <p className="hint">After upload, you can keep the suggested name and slug or edit them before publishing.</p>
        <UploadBox file={file} dragActive={dragActive} onChooseFile={onChooseFile} onDrag={onDrag} label="Drop HTML or ZIP here" />
        {file && (
          <div className="inlineUploadNotice">
            <strong>{file.name} is ready.</strong>
            <span>{assets.length} {assets.length === 1 ? "file" : "files"} found. Review the list, then publish.</span>
          </div>
        )}
        {assets.length > 0 && <PreviewAssetList assets={assets} />}
      </section>
      <section className="panel publishPanel">
        <h2>Publish details</h2>
        <label>
          Name optional
          <input value={name} onChange={(event) => onName(event.currentTarget.value)} placeholder={file ? titleFromFile(file.name) : "Filled from upload"} />
        </label>
        <label>
          Slug
          <input value={slug} onChange={(event) => onSlug(event.currentTarget.value)} placeholder="auto-generated" />
        </label>
        <p className="previewUrl">Public URL preview: /s/{slug || "generated-slug"}/</p>
        <button disabled={busy || !file} type="submit">
          <Rocket size={18} /> Create site and upload
        </button>
      </section>
    </form>
  );
}

function SiteManageScreen({
  site,
  deployment,
  analytics,
  publicUrl,
  hasDeployment,
  replacementUpload,
  showReplacementUpload,
  busy,
  totalViews,
  dragActive,
  onChooseReplacement,
  onShowReplacementUpload,
  onDrag,
  onDeploy,
  onUpdateAccess,
  onDelete,
}: {
  site: SiteSummary;
  deployment: DeploymentSummary | null;
  analytics: AnalyticsRow[];
  publicUrl: string;
  hasDeployment: boolean;
  replacementUpload: File | null;
  showReplacementUpload: boolean;
  busy: boolean;
  totalViews: number;
  dragActive: boolean;
  onChooseReplacement: (file: File | undefined) => void;
  onShowReplacementUpload: (show: boolean) => void;
  onDrag: (active: boolean) => void;
  onDeploy: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateAccess: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onDelete: (site: SiteSummary) => void;
}) {
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [accessEditing, setAccessEditing] = useState(!hasDeployment);
  const shownAssets = showAllAssets ? deployment?.assets ?? [] : deployment?.assets.slice(0, 3) ?? [];
  const extraAssetCount = Math.max((deployment?.assets.length ?? 0) - shownAssets.length, 0);
  const status = siteDisplayStatus(site);
  const isDisabled = status.kind === "disabled";

  return (
    <section className="dashboardStack">
      <header className="siteHeader">
        <div>
          <p className="eyebrow">Site settings</p>
          <div className="siteTitleRow">
            <h1>{site.name}</h1>
            <span className={`statusPill ${status.kind}`}>{status.label}</span>
          </div>
          {isDisabled && <p className="disabledHint">This site is disabled. The public URL shows an inactive page until access is re-enabled.</p>}
          {hasDeployment ? (
            <a href={publicUrl} target="_blank" rel="noreferrer">
              {publicUrl}
            </a>
          ) : (
            <span className="pendingLink">No public upload yet.</span>
          )}
        </div>
        <div className="siteActions">
          <a className={`primaryCta ${!hasDeployment || isDisabled ? "disabled" : ""}`} href={hasDeployment ? publicUrl : undefined} target="_blank" rel="noreferrer" aria-disabled={!hasDeployment || isDisabled}>
            <ExternalLink size={18} /> Open site
          </a>
          <button type="button" className="copyIcon" disabled={!hasDeployment || isDisabled} onClick={() => void navigator.clipboard.writeText(publicUrl)} aria-label="Copy public link">
            <Copy size={18} />
          </button>
        </div>
      </header>

      <div className="summaryGrid">
        <Metric icon={<FileText />} label="Current upload" value={deployment ? `${deployment.assetCount} files` : "None"} />
        <Metric icon={<FileArchive />} label="Size" value={deployment ? formatBytes(deployment.totalBytes) : "-"} />
        <Metric icon={<Activity />} label="Views" value={String(totalViews)} />
      </div>

      <div className="gridTwo">
        <section className="panel strong">
          <h3>
            <CheckCircle2 size={20} /> Uploaded state
          </h3>
          {deployment ? (
            <div className="uploadState">
              <strong>Live upload</strong>
              <span>{deployment.assetCount} assets, {formatBytes(deployment.totalBytes)}</span>
              <span>Uploaded {formatDate(deployment.createdAt)}</span>
              <ul className="assetList" aria-label="Uploaded assets">
                {shownAssets.map((asset) => (
                  <li key={asset.pathname}>
                    <span>{asset.pathname}</span>
                    <small>{asset.contentType} · {formatBytes(asset.size)}</small>
                  </li>
                ))}
              </ul>
              {(deployment.assets.length > 3 || showAllAssets) && (
                <button type="button" className="textButton" onClick={() => setShowAllAssets((current) => !current)}>
                  {showAllAssets ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showAllAssets ? "Show fewer assets" : `Show ${extraAssetCount} more`}
                </button>
              )}
            </div>
          ) : (
            <p className="empty">Nothing has been uploaded for this site yet.</p>
          )}
          {hasDeployment && !showReplacementUpload && (
            <button type="button" className="ghost" onClick={() => onShowReplacementUpload(true)}>
              <Upload size={18} /> Replace upload
            </button>
          )}
          {(!hasDeployment || showReplacementUpload) && (
            <form onSubmit={onDeploy} className="replaceForm">
              <UploadBox file={replacementUpload} dragActive={dragActive} onChooseFile={onChooseReplacement} onDrag={onDrag} label="Replace with HTML or ZIP" />
              <div className="buttonRow">
                <button disabled={busy || !replacementUpload} type="submit">
                  <Upload size={18} /> Upload replacement
                </button>
                {hasDeployment && (
                  <button type="button" className="ghost" onClick={() => onShowReplacementUpload(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

        <section className="panel strong">
          <div className="panelTitleRow">
            <h3>
              <LockKeyhole size={20} /> Access and expiry
            </h3>
            {hasDeployment && !accessEditing && (
              <button type="button" className="copyIcon" onClick={() => setAccessEditing(true)} aria-label="Edit access settings">
                <Pencil size={17} />
              </button>
            )}
          </div>
          {!accessEditing ? (
            <div className="readOnlySettings">
              <div>
                <span>Access</span>
                <strong>{site.accessMode === "password" ? "Password protected" : "Public"}</strong>
              </div>
              <div>
                <span>Expiry</span>
                <strong>{site.expiresAt ? formatDate(site.expiresAt) : "No expiry set"}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{site.disabledAt ? "Disabled" : "Active"}</strong>
              </div>
            </div>
          ) : (
            <form
              key={site.id}
              onSubmit={async (event) => {
                await onUpdateAccess(event);
                setAccessEditing(false);
              }}
            >
              <div className="segmented">
                <label>
                  <input type="radio" name="accessMode" value="public" defaultChecked={site.accessMode === "public"} /> Public
                </label>
                <label>
                  <input type="radio" name="accessMode" value="password" defaultChecked={site.accessMode === "password"} /> Password
                </label>
              </div>
              <label>
                Password
                <input name="password" type="password" placeholder="Required when password mode is selected" />
              </label>
              <label>
                Active until
                <input name="expiresAt" type="datetime-local" />
              </label>
              <label className="check">
                <input name="disabled" type="checkbox" defaultChecked={Boolean(site.disabledAt)} /> Disable now
              </label>
              <div className="buttonRow">
                <button disabled={busy} type="submit">
                  <CalendarClock size={18} /> Save settings
                </button>
                {hasDeployment && (
                  <button type="button" className="ghost" onClick={() => setAccessEditing(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      </div>

      <AnalyticsPanel analytics={analytics} />

      <section className="dangerZone">
        <div>
          <h3>
            <Trash2 size={20} /> Delete site
          </h3>
          <p>This removes the site from your dashboard and disables the public URL.</p>
        </div>
        <button type="button" className="dangerButton" onClick={() => onDelete(site)}>
          <Trash2 size={18} /> Delete site
        </button>
      </section>
    </section>
  );
}

function AnalyticsPanel({ analytics }: { analytics: AnalyticsRow[] }) {
  const daily = aggregateViewsByDay(analytics);
  const countries = aggregateViewsByCountry(analytics);
  return (
    <section className="analytics">
      <h3>
        <BarChart3 size={20} /> Analytics
      </h3>
      <div className="analyticsGrid">
        <div className="chartPanel">
          <strong>Views by day</strong>
          <ViewsByDayChart points={daily} />
        </div>
        <div className="chartPanel">
          <strong>
            <MapPinned size={18} /> World access
          </strong>
          <WorldAccessMap countries={countries} />
        </div>
      </div>
      <div className="table">
          <div className="tableHead">
            <span>Day</span>
            <span>Path</span>
            <span>Status</span>
            <span>Country</span>
            <span>Referrer</span>
            <span>Views</span>
          </div>
          {analytics.map((row) => (
            <div className="tableRow" key={`${row.day}-${row.path}-${row.status}-${row.country}-${row.referrerHost}`}>
              <span>{row.day}</span>
              <span>{row.path}</span>
              <span>{row.status}</span>
              <span>{row.country}</span>
              <span>{row.referrerHost}</span>
              <span>{row.views}</span>
            </div>
          ))}
          {analytics.length === 0 && <p className="empty">No visits recorded yet.</p>}
        </div>
      </section>
  );
}

function UploadBox({
  file,
  dragActive,
  label,
  onChooseFile,
  onDrag,
}: {
  file: File | null;
  dragActive: boolean;
  label: string;
  onChooseFile: (file: File | undefined) => void;
  onDrag: (active: boolean) => void;
}) {
  return (
    <label
      className={`dropzone ${dragActive ? "active" : ""}`}
      onDragEnter={() => onDrag(true)}
      onDragLeave={() => onDrag(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrag(false);
        onChooseFile(event.dataTransfer.files[0]);
      }}
    >
      <Upload size={30} />
      <span>{label}</span>
      <small>{file ? file.name : "or click to choose a file"}</small>
      <input name="file" type="file" accept=".html,.htm,.zip" onChange={(event) => onChooseFile(event.currentTarget.files?.[0])} />
    </label>
  );
}

function PreviewAssetList({ assets }: { assets: PreviewAsset[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleAssets = expanded ? assets : assets.slice(0, 6);
  const remaining = assets.length - visibleAssets.length;
  return (
    <section className="previewAssets" aria-label="Files ready to upload">
      <div className="previewAssetsHeader">
        <strong>Files to publish</strong>
        <span>{assets.length} total</span>
      </div>
      <ul className="assetList">
        {visibleAssets.map((asset) => (
          <li key={asset.pathname}>
            <span>{asset.pathname}</span>
            <small>{formatBytes(asset.size)}</small>
          </li>
        ))}
      </ul>
      {assets.length > 6 && (
        <button type="button" className="textButton" onClick={() => setExpanded((current) => !current)}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? "Show fewer files" : `Show ${remaining} more`}
        </button>
      )}
    </section>
  );
}

function Explainer({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="explainer">
      {icon}
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function siteDisplayStatus(site: SiteSummary): { kind: "uploaded" | "empty" | "disabled"; label: string } {
  if (site.disabledAt) return { kind: "disabled", label: "Disabled" };
  if (site.activeDeploymentId) return { kind: "uploaded", label: "Uploaded" };
  return { kind: "empty", label: "No upload" };
}

function siteAccessLabel(site: SiteSummary): string {
  const mode = site.accessMode === "password" ? "Password protected" : "Public";
  return site.disabledAt ? `${mode}, disabled` : mode;
}

function ViewsByDayChart({ points }: { points: Array<{ day: string; views: number }> }) {
  if (points.length === 0) {
    return <div className="chartEmpty">No views yet</div>;
  }

  return (
    <div className="barChart" aria-label="Views grouped by day">
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={points} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="#ccd7cf" />
          <XAxis dataKey="day" tickFormatter={shortDay} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "rgba(15, 118, 110, 0.08)" }} />
          <Bar dataKey="views" name="Views" fill="#0f766e" stroke="#17201b" strokeWidth={2} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="chartLabels">
        <span>{points[0]?.day}</span>
        <strong>{points.reduce((sum, point) => sum + point.views, 0)} total views</strong>
        <span>{points.at(-1)?.day}</span>
      </div>
    </div>
  );
}

function WorldAccessMap({ countries }: { countries: Array<{ country: string; views: number }> }) {
  const maxViews = Math.max(...countries.map((country) => country.views), 1);
  const plottedCountries = countries
    .map((country) => ({ ...country, coordinates: countryCoordinates(country.country) }))
    .filter((country): country is { country: string; views: number; coordinates: [number, number] } => Boolean(country.coordinates));
  return (
    <div className="worldPanel">
      <div className="worldMap" aria-label="World access map">
        <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 150 }} className="realWorldMap">
          <Geographies geography={worldMap}>
            {({ geographies }) =>
              geographies.map((geography) => (
                <Geography key={geography.rsmKey} geography={geography} className="mapGeography" tabIndex={-1} />
              ))
            }
          </Geographies>
          {plottedCountries.slice(0, 12).map((country) => (
            <Marker key={country.country} coordinates={country.coordinates}>
              <circle className="mapDot" r={6 + (country.views / maxViews) * 12}>
                <title>{country.country}: {country.views} views</title>
              </circle>
            </Marker>
          ))}
        </ComposableMap>
        {countries.length === 0 && <span className="mapEmpty">No country data</span>}
        {countries.length > 0 && plottedCountries.length === 0 && <span className="mapEmpty">Country codes unavailable</span>}
      </div>
      <div className="countryList">
        {countries.slice(0, 5).map((country) => (
          <div key={country.country}>
            <span>{country.country}</span>
            <strong>{country.views}</strong>
          </div>
        ))}
        {countries.length === 0 && <p className="empty">Country data appears after public visits.</p>}
      </div>
    </div>
  );
}

function aggregateViewsByDay(rows: AnalyticsRow[]): Array<{ day: string; views: number }> {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    byDay.set(row.day, (byDay.get(row.day) ?? 0) + row.views);
  }
  return [...byDay.entries()]
    .map(([day, views]) => ({ day, views }))
    .sort((left, right) => left.day.localeCompare(right.day));
}

function aggregateViewsByCountry(rows: AnalyticsRow[]): Array<{ country: string; views: number }> {
  const byCountry = new Map<string, number>();
  for (const row of rows) {
    byCountry.set(row.country, (byCountry.get(row.country) ?? 0) + row.views);
  }
  return [...byCountry.entries()]
    .map(([country, views]) => ({ country, views }))
    .sort((left, right) => right.views - left.views);
}

const COUNTRY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  CH: { lat: 46.8, lon: 8.2 },
  DE: { lat: 51.2, lon: 10.4 },
  FR: { lat: 46.2, lon: 2.2 },
  IT: { lat: 41.9, lon: 12.6 },
  AT: { lat: 47.5, lon: 14.5 },
  GB: { lat: 54.5, lon: -2.5 },
  UK: { lat: 54.5, lon: -2.5 },
  NL: { lat: 52.1, lon: 5.3 },
  ES: { lat: 40.4, lon: -3.7 },
  US: { lat: 39.8, lon: -98.6 },
  CA: { lat: 56.1, lon: -106.3 },
  BR: { lat: -14.2, lon: -51.9 },
  IN: { lat: 20.6, lon: 78.9 },
  JP: { lat: 36.2, lon: 138.3 },
  CN: { lat: 35.9, lon: 104.2 },
  AU: { lat: -25.3, lon: 133.8 },
  SG: { lat: 1.35, lon: 103.8 },
};

function countryCoordinates(country: string): [number, number] | null {
  const coordinate = COUNTRY_COORDINATES[country.toUpperCase()];
  if (!coordinate) return null;
  return [coordinate.lon, coordinate.lat];
}

function shortDay(day: string): string {
  const [, month, date] = day.split("-");
  return month && date ? `${month}/${date}` : day;
}

function parseDashboardRoute(pathname: string): DashboardRoute {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/") return { kind: "landing" };
  if (normalized === "/auth") return { kind: "auth" };
  if (normalized === "/dashboard/sites/new") return { kind: "new" };
  if (normalized === "/dashboard") return { kind: "dashboard" };
  const siteMatch = normalized.match(/^\/dashboard\/sites\/([^/]+)$/);
  if (siteMatch) return { kind: "site", siteId: decodeURIComponent(siteMatch[1]) };
  return { kind: "dashboard" };
}

function routePath(route: DashboardRoute): string {
  if (route.kind === "landing") return "/";
  if (route.kind === "auth") return "/auth";
  if (route.kind === "new") return "/dashboard/sites/new";
  if (route.kind === "site") return `/dashboard/sites/${encodeURIComponent(route.siteId)}`;
  return "/dashboard";
}

function titleFromFile(fileName: string): string {
  const base = fileName.replace(/\.(html?|zip)$/i, "").replace(/[-_]+/g, " ").trim();
  if (!base) return "Untitled site";
  return base.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function previewUploadAssets(file: File): Promise<PreviewAsset[]> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
    return [{ pathname: "/index.html", size: file.size }];
  }
  if (!lowerName.endsWith(".zip")) throw new Error("Use one HTML file or one ZIP archive.");

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const assets: PreviewAsset[] = [];
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const pathname = safePreviewPath(name);
    if (!pathname) throw new Error(`ZIP contains an unsafe or unsupported path: ${name}`);
    const content = await entry.async("arraybuffer");
    assets.push({ pathname, size: content.byteLength });
  }
  if (!assets.some((asset) => asset.pathname === "/index.html")) {
    throw new Error("ZIP uploads must contain index.html at the root.");
  }
  return assets.sort((left, right) => {
    if (left.pathname === "/index.html") return -1;
    if (right.pathname === "/index.html") return 1;
    return left.pathname.localeCompare(right.pathname);
  });
}

function safePreviewPath(input: string): string | null {
  const normalized = input.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.endsWith("/")) return null;
  const parts = normalized.split("/");
  if (parts.some((part) => part === ".." || part === "." || part.length === 0)) return null;
  if (/^[a-zA-Z]+:/.test(normalized)) return null;
  return `/${parts.join("/")}`;
}

function uniqueSlug(value: string, existingSlugs: string[]): string {
  const base = slugify(value) || "site";
  const existing = new Set(existingSlugs);
  if (!existing.has(base)) return base;
  for (let index = 2; index < 10_000; index += 1) {
    const candidate = `${base}-${index}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
