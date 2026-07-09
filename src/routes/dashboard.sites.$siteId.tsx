import { Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { SiteManage } from "../components/dashboard/SiteManage";
import { useAuth } from "../context/AuthContext";
import { useNotice } from "../context/NoticeContext";
import { useSiteDetail } from "../hooks/useSiteDetail";
import { mapSite } from "../shared/mappers";
import type { SiteSummary } from "../shared/types";
import { supabase } from "../lib/supabase";
import { readAccessFormFields } from "../lib/access-form";
import { isValidUploadFile } from "../lib/upload";

export default function SiteDetailPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = params.siteId ? decodeURIComponent(params.siteId) : undefined;
  const { getAccessToken } = useAuth();
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

  const visibleSite = detail?.site ?? null;
  const publicUrl = visibleSite ? `${window.location.origin}/s/${visibleSite.slug}/` : "";
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
      const token = await getAccessToken();
      if (!token) throw new Error("Sign in before deploying.");
      const response = await fetch(`/api/sites/${site.id}/deploy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = (await response.json()) as { site?: SiteSummary; publicUrl?: string; error?: string };
      if (!response.ok || !data.site) throw new Error(data.error ?? "Deploy failed.");
      setDetail({ site: data.site, analytics: detail?.analytics ?? [] });
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
    setBusy(true);
    clearNotice();
    try {
      const accessFields = await readAccessFormFields(form);

      const { data, error: updateError } = await supabase
        .from("sites")
        .update(accessFields)
        .eq("id", site.id)
        .select("*")
        .single();
      if (updateError || !data) throw new Error(updateError?.message ?? "Could not update access.");

      const updatedSite = mapSite(data);
      setDetail((current) => (current ? { ...current, site: updatedSite } : current));
      setNotice({ tone: "ok", text: "Access settings updated." });
    } catch (accessError) {
      setNotice({ tone: "bad", text: accessError instanceof Error ? accessError.message : "Could not update access." });
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrentSite() {
    if (!window.confirm(`Delete ${site.name}? This removes the site, uploaded files, settings, and analytics.`)) return;
    setBusy(true);
    clearNotice();
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Sign in before deleting.");
      const response = await fetch(`/api/sites/${site.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Could not delete site.");
      }
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
      analytics={detail?.analytics ?? []}
      publicUrl={publicUrl}
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
