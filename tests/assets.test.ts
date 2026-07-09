import { describe, expect, it } from "vitest";
import { buildAssetManifest, handleAssetRequest } from "../src/worker/lib/assets";

describe("buildAssetManifest", () => {
  it("computes content types and etags for uploaded assets", async () => {
    const manifest = await buildAssetManifest({
      "/index.html": "<h1>Hello</h1>",
      "/style.css": "body { color: red; }",
    });

    expect(manifest.get("/index.html")?.contentType).toBe("text/html; charset=utf-8");
    expect(manifest.get("/style.css")?.contentType).toBe("text/css; charset=utf-8");
    expect(manifest.get("/index.html")?.etag).toMatch(/^[0-9a-f]+$/);
    expect(manifest.get("/style.css")?.etag).toMatch(/^[0-9a-f]+$/);
  });
});

describe("handleAssetRequest", () => {
  const storage = {
    get: async (pathname: string) => {
      const assets: Record<string, string> = {
        "/index.html": "<h1>Home</h1>",
        "/style.css": "body { color: red; }",
      };
      return assets[pathname] ?? null;
    },
  };

  it("serves exact asset paths", async () => {
    const manifest = await buildAssetManifest({
      "/index.html": "<h1>Home</h1>",
      "/style.css": "body { color: red; }",
    });

    const response = await handleAssetRequest(
      new Request("https://example.com/style.css"),
      manifest,
      storage,
    );

    expect(response?.status).toBe(200);
    expect(response?.headers.get("content-type")).toBe("text/css; charset=utf-8");
    expect(await response?.text()).toBe("body { color: red; }");
  });

  it("falls back to index.html for SPA routes", async () => {
    const manifest = await buildAssetManifest({
      "/index.html": "<h1>Home</h1>",
    });

    const response = await handleAssetRequest(
      new Request("https://example.com/dashboard", {
        headers: { Accept: "text/html" },
      }),
      manifest,
      storage,
      { not_found_handling: "single-page-application" },
    );

    expect(response?.status).toBe(200);
    expect(await response?.text()).toBe("<h1>Home</h1>");
  });

  it("returns 304 when etag matches", async () => {
    const manifest = await buildAssetManifest({
      "/index.html": "<h1>Home</h1>",
      "/style.css": "body { color: red; }",
    });
    const etag = manifest.get("/style.css")?.etag;

    const response = await handleAssetRequest(
      new Request("https://example.com/style.css", {
        headers: { "If-None-Match": `"${etag}"` },
      }),
      manifest,
      storage,
    );

    expect(response?.status).toBe(304);
    expect(await response?.text()).toBe("");
  });
});
