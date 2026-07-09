import { describe, expect, it } from "vitest";
import { aggregateViewTrackingJobs, viewTrackingJobFrom } from "../src/worker/lib/analytics";
import type { ViewTrackingJob } from "../src/shared/view-tracking";

describe("viewTrackingJobFrom", () => {
  it("extracts day, country, and referrer host from the request", () => {
    const request = new Request("https://example.com/s/demo/", {
      headers: {
        referer: "https://google.com/search",
      },
    });
    Object.defineProperty(request, "cf", {
      value: { country: "DE" },
    });

    const job = viewTrackingJobFrom("site-1", request, "/", 200);

    expect(job).toEqual({
      siteId: "site-1",
      day: new Date().toISOString().slice(0, 10),
      path: "/",
      status: 200,
      country: "DE",
      referrerHost: "google.com",
    });
  });

  it("falls back to unknown country and direct referrer", () => {
    const job = viewTrackingJobFrom("site-1", new Request("https://example.com/"), "/assets/app.js", 404);

    expect(job.country).toBe("unknown");
    expect(job.referrerHost).toBe("direct");
  });
});

describe("aggregateViewTrackingJobs", () => {
  const baseJob: ViewTrackingJob = {
    siteId: "site-1",
    day: "2026-07-09",
    path: "/",
    status: 200,
    country: "US",
    referrerHost: "direct",
  };

  it("merges duplicate keys and sums views", () => {
    const aggregated = aggregateViewTrackingJobs([
      baseJob,
      baseJob,
      { ...baseJob, path: "/about" },
    ]);

    expect(aggregated).toEqual([
      { ...baseJob, views: 2 },
      { ...baseJob, path: "/about", views: 1 },
    ]);
  });

  it("returns an empty array for no jobs", () => {
    expect(aggregateViewTrackingJobs([])).toEqual([]);
  });
});
