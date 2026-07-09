import { Rocket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { SiteManage } from "../components/dashboard/SiteManage";
import { useAuth } from "../context/AuthContext";
import { useNotice } from "../context/NoticeContext";
import { useSiteDetail } from "../hooks/useSiteDetail";
import type { DeploymentSummary, SiteSummary } from "../shared/types";
import { isValidUploadFile } from "../lib/upload";

export default function SiteDetailPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = params.siteId ? decodeURIComponent(params.siteId) : undefined;
  const { sites, setSites } = useAuth();
  const { setNotice, clearNotice } = useNotice();
  const [, navigate] = useLocation();
  const { detail, setDetail, loading, error } = useSiteDetail(siteId);

  useEffect(() => {
    if (error) setNotice({ tone: "bad", text: error });
  }, [error, setNotice]);
  const [busy, setBusy] = useState(false);
  const [replacementUpload, setReplacementUpload] = useState<File | null>(null);
  const [showReplacementUpload, setShowReplacementUpload] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const selectedSite = useMemo(() => (siteId ? (sites.find((site) => site.id === siteId) ?? null) : null), [siteId, sites]);
  const visibleSite = detail?.site ?? selectedSite;
  const publicUrl = visibleSite ? `${window.location.origin}/s/${visibleSite.slug}/` : "";
  const hasDeployment = Boolean(detail?.deployment ?? visibleSite?.activeDeploymentId);
  const totalViews = detail?.analytics.reduce((sum, row) => sum + row.views, 0) ?? 0;

  if (!visibleSite) {
    return (
      <section className="emptyState">
        <Rocket size={34} />
        <h2>{loading ? "Loading site..." : "Site not found."}</h2>
      </section>
    );
  }

  const site = visibleSite;

  function chooseReplacementUpload(file: File | undefined) {
    if (!isValidUploadFile(file)) {
      if (file) setNotice({ tone: "bad", text: "Use one HTML file or one ZIP archive." });
      return;
    }
    setReplacementUpload(file);
    setShowReplacementUpload(true);
    setNotice({ tone: "ok", text: `${file.name} is ready to replace the current upload.` });
  }

  async function deployReplacement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!replacementUpload) return;
    const form = new FormData();
    form.set("file", replacementUpload);
    setBusy(true);
    clearNotice();
    try {
      const response = await fetch(`/api/sites/${site.id}/deploy`, { method: "POST", body: form });
      const data = (await response.json()) as { site?: SiteSummary; deployment?: DeploymentSummary; publicUrl?: string; error?: string };
      if (!response.ok || !data.site || !data.deployment) throw new Error(data.error ?? "Deploy failed.");
      setSites((current) => current.map((site) => (site.id === data.site!.id ? data.site! : site)));
      setDetail({ site: data.site, deployment: data.deployment, analytics: detail?.analytics ?? [] });
      setReplacementUpload(null);
      setShowReplacementUpload(false);
      setNotice({ tone: "ok", text: "Upload replaced. The public URL now serves the new version." });
    } catch (deployError) {
      setNotice({ tone: "bad", text: deployError instanceof Error ? deployError.message : "Deploy failed." });
    } finally {
      setBusy(false);
    }
  }

  async function updateAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const accessMode = String(form.get("accessMode"));
    setBusy(true);
    clearNotice();
    try {
      const response = await fetch(`/api/sites/${site.id}/access`, {
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
    } catch (accessError) {
      setNotice({ tone: "bad", text: accessError instanceof Error ? accessError.message : "Could not update access." });
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrentSite() {
    if (!window.confirm(`Delete ${site.name}? This removes the site, deployments, settings, and analytics.`)) return;
    setBusy(true);
    clearNotice();
    try {
      const response = await fetch(`/api/sites/${site.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not delete site.");
      setSites((current) => current.filter((item) => item.id !== site.id));
      navigate("/dashboard");
      setNotice({ tone: "ok", text: `${site.name} was deleted.` });
    } catch (deleteError) {
      setNotice({ tone: "bad", text: deleteError instanceof Error ? deleteError.message : "Could not delete site." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteManage
      site={site}
      deployment={detail?.deployment ?? null}
      analytics={detail?.analytics ?? []}
      publicUrl={publicUrl}
      hasDeployment={hasDeployment}
      replacementUpload={replacementUpload}
      showReplacementUpload={showReplacementUpload}
      busy={busy}
      totalViews={totalViews}
      dragActive={dragActive}
      onChooseReplacement={chooseReplacementUpload}
      onShowReplacementUpload={setShowReplacementUpload}
      onDrag={setDragActive}
      onDeploy={deployReplacement}
      onUpdateAccess={updateAccess}
      onDelete={() => deleteCurrentSite()}
    />
  );
}
