import { useState } from "react";
import { useLocation } from "wouter";
import { NewSiteForm } from "../components/dashboard/NewSiteForm";
import { useAuth } from "../context/AuthContext";
import { useNotice } from "../context/NoticeContext";
import type { DeploymentSummary, SiteSummary } from "../shared/types";
import { isValidUploadFile, previewUploadAssets, slugify, titleFromFile, uniqueSlug } from "../lib/upload";

export default function NewSitePage() {
  const { sessionEmail, sites, setSites } = useAuth();
  const { setNotice, clearNotice } = useNotice();
  const [, navigate] = useLocation();
  const [busy, setBusy] = useState(false);
  const [newSiteFile, setNewSiteFile] = useState<File | null>(null);
  const [newSiteAssets, setNewSiteAssets] = useState<Awaited<ReturnType<typeof previewUploadAssets>>>([]);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteSlug, setNewSiteSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function chooseNewSiteUpload(file: File | undefined) {
    if (!isValidUploadFile(file)) {
      if (file) setNotice({ tone: "bad", text: "Use one HTML file or one ZIP archive." });
      return;
    }
    try {
      const assets = await previewUploadAssets(file);
      setNewSiteFile(file);
      setNewSiteAssets(assets);
      const fallbackName = titleFromFile(file.name);
      setNewSiteName((current) => current || fallbackName);
      if (!slugEdited) setNewSiteSlug(uniqueSlug(fallbackName, sites.map((site) => site.slug)));
      clearNotice();
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "Could not read upload." });
      setNewSiteFile(null);
      setNewSiteAssets([]);
    }
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
    clearNotice();
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
      setNewSiteFile(null);
      setNewSiteAssets([]);
      setNewSiteName("");
      setNewSiteSlug("");
      setSlugEdited(false);
      navigate(`/dashboard/sites/${encodeURIComponent(deployed.site.id)}`);
      setNotice({ tone: "ok", text: `Site published at ${new URL(deployed.publicUrl ?? `/s/${deployed.site.slug}/`, window.location.origin).toString()}` });
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "Could not publish site." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <NewSiteForm
      file={newSiteFile}
      assets={newSiteAssets}
      name={newSiteName}
      slug={newSiteSlug}
      busy={busy}
      dragActive={dragActive}
      onChooseFile={chooseNewSiteUpload}
      onName={setNewSiteName}
      onSlug={(value) => {
        setSlugEdited(true);
        setNewSiteSlug(slugify(value));
      }}
      onDrag={setDragActive}
      onSubmit={createAndDeploySite}
    />
  );
}
