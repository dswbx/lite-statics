import type { SiteSummary } from "../shared/types";

export function siteDisplayStatus(site: SiteSummary): { kind: "uploaded" | "empty" | "disabled"; label: string } {
  if (site.disabledAt) return { kind: "disabled", label: "Disabled" };
  if (site.deployedAt) return { kind: "uploaded", label: "Uploaded" };
  return { kind: "empty", label: "No upload" };
}

export function siteAccessLabel(site: SiteSummary): string {
  const mode = site.accessMode === "password" ? "Password protected" : "Public";
  return site.disabledAt ? `${mode}, disabled` : mode;
}

export function siteHasUpload(site: SiteSummary): boolean {
  return Boolean(site.deployedAt);
}
