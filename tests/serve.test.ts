import { describe, expect, it } from "vitest";
import { parseManifestJson } from "../src/worker/lib/serve";

describe("parseManifestJson", () => {
  it("returns null when manifest is missing", () => {
    expect(parseManifestJson(null)).toBeNull();
  });

  it("parses stored manifest entries", () => {
    const manifest = parseManifestJson(
      JSON.stringify({
        "/index.html": { contentType: "text/html; charset=utf-8", size: 120, etag: "abc" },
        "/styles/site.css": { contentType: "text/css; charset=utf-8", size: 40 },
      }),
    );

    expect(manifest).toEqual({
      "/index.html": { contentType: "text/html; charset=utf-8", size: 120, etag: "abc" },
      "/styles/site.css": { contentType: "text/css; charset=utf-8", size: 40 },
    });
  });
});
