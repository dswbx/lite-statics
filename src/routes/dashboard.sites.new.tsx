import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { NewSiteForm } from "../components/dashboard/NewSiteForm";
import { useAuth } from "../context/AuthContext";
import { useNotice } from "../context/NoticeContext";
import type { SiteSummary } from "../shared/types";
import { supabase } from "../lib/supabase";
import { readAccessFormFields } from "../lib/access-form";
import { isSlugAvailable, isValidUploadFile, previewUploadAssets, slugify, slugifyInput, titleFromFile, uniqueSlug } from "../lib/upload";

export type SlugStatus = "idle" | "checking" | "available" | "taken";

export default function NewSitePage() {
  const { userId, getAccessToken } = useAuth();
  const { setNotice, clearNotice } = useNotice();
  const [, navigate] = useLocation();
  const [busy, setBusy] = useState(false);
  const [newSiteFile, setNewSiteFile] = useState<File | null>(null);
  const [newSiteAssets, setNewSiteAssets] = useState<Awaited<ReturnType<typeof previewUploadAssets>>>([]);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteSlug, setNewSiteSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const slug = slugify(newSiteSlug);
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    let cancelled = false;
    const handle = setTimeout(async () => {
      const available = await isSlugAvailable(slug);
      if (!cancelled) setSlugStatus(available ? "available" : "taken");
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [newSiteSlug]);

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
      if (!slugEdited) {
        const { data: existingSites } = await supabase.from("sites").select("slug");
        const existingSlugs = (existingSites ?? []).map((site) => site.slug);
        setNewSiteSlug(uniqueSlug(fallbackName, existingSlugs));
      }
      clearNotice();
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "Could not read upload." });
      setNewSiteFile(null);
      setNewSiteAssets([]);
    }
  }

  async function createAndDeploySite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !newSiteFile) {
      setNotice({ tone: "bad", text: "Upload assets before creating a site." });
      return;
    }
    const name = newSiteName.trim() || titleFromFile(newSiteFile.name);
    const slug = slugify(newSiteSlug || name);
    if (!slug) {
      setNotice({ tone: "bad", text: "Enter a slug for your site." });
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    clearNotice();
    try {
      if (!(await isSlugAvailable(slug))) {
        throw new Error(`The slug "${slug}" is already taken. Choose another.`);
      }
      const accessFields = await readAccessFormFields(form);
      const { data: created, error: createError } = await supabase
        .from("sites")
        .insert({ owner_id: userId, name, slug, ...accessFields })
        .select("*")
        .single();
      if (createError || !created) {
        const message = createError?.message ?? "";
        if (createError?.code === "23505" || /unique|already exists|constraint/i.test(message)) {
          throw new Error(`The slug "${slug}" is already taken. Choose another.`);
        }
        throw new Error(message || "Could not create site.");
      }

      const token = await getAccessToken();
      if (!token) throw new Error("Sign in before deploying.");

      const deployForm = new FormData();
      deployForm.set("file", newSiteFile);
      const deployResponse = await fetch(`/api/sites/${created.id}/deploy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: deployForm,
      });
      const deployed = (await deployResponse.json()) as {
        site?: SiteSummary;
        publicUrl?: string;
        error?: string;
      };
      if (!deployResponse.ok || !deployed.site) {
        throw new Error(deployed.error ?? "Upload failed.");
      }

      setNewSiteFile(null);
      setNewSiteAssets([]);
      setNewSiteName("");
      setNewSiteSlug("");
      setSlugEdited(false);
      setSlugStatus("idle");
      navigate(`/dashboard/sites/${encodeURIComponent(deployed.site.id)}`);
      setNotice({
        tone: "ok",
        text: `Site published at ${new URL(deployed.publicUrl ?? `/s/${deployed.site.slug}/`, window.location.origin).toString()}`,
      });
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
      slugStatus={slugStatus}
      busy={busy}
      dragActive={dragActive}
      onChooseFile={chooseNewSiteUpload}
      onName={setNewSiteName}
      onSlug={(value) => {
        setSlugEdited(true);
        setNewSiteSlug(slugifyInput(value));
      }}
      onDrag={setDragActive}
      onSubmit={createAndDeploySite}
    />
  );
}
