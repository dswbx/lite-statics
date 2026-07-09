import { describe, expect, it } from "vitest";
import { assetKey, sitePrefix } from "../src/worker/lib/storage";

describe("assetKey", () => {
  it("stores assets under the site id folder", () => {
    expect(assetKey("550e8400-e29b-41d4-a716-446655440000", "/index.html")).toBe(
      "550e8400-e29b-41d4-a716-446655440000/index.html",
    );
    expect(assetKey("550e8400-e29b-41d4-a716-446655440000", "/styles/site.css")).toBe(
      "550e8400-e29b-41d4-a716-446655440000/styles/site.css",
    );
  });

  it("builds list prefixes for site cleanup", () => {
    expect(sitePrefix("550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000/");
  });
});
