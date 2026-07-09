import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { normalizeUpload, safeAssetPath } from "../src/worker/upload";

describe("upload normalization", () => {
  it("normalizes a single HTML file to /index.html", async () => {
    const upload = await normalizeUpload(new File(["<h1>Hello</h1>"], "demo.html", { type: "text/html" }));

    expect(upload.assets).toHaveLength(1);
    expect(upload.assets[0].pathname).toBe("/index.html");
    expect(upload.manifest["/index.html"].contentType).toContain("text/html");
  });

  it("rejects unsafe zip paths", () => {
    expect(safeAssetPath("../secret.html")).toBeNull();
    expect(safeAssetPath("/absolute.html")).toBe("/absolute.html");
    expect(safeAssetPath("nested/../secret.html")).toBeNull();
    expect(safeAssetPath("script.php")).toBeNull();
  });

  it("requires a root index.html in ZIP uploads", async () => {
    const zip = new JSZip();
    zip.file("nested/index.html", "<h1>Nested</h1>");
    const bytes = await zip.generateAsync({ type: "arraybuffer" });

    await expect(normalizeUpload(new File([bytes], "site.zip"))).rejects.toThrow("index.html");
  });

  it("accepts a ZIP static site", async () => {
    const zip = new JSZip();
    zip.file("index.html", "<link rel='stylesheet' href='/style.css'>");
    zip.file("style.css", "body{color:red}");
    const bytes = await zip.generateAsync({ type: "arraybuffer" });

    const upload = await normalizeUpload(new File([bytes], "site.zip"));

    expect(upload.assets.map((asset) => asset.pathname).sort()).toEqual(["/index.html", "/style.css"]);
    expect(upload.totalBytes).toBeGreaterThan(0);
  });
});
