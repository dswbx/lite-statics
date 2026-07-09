import { describe, expect, it, vi } from "vitest";
import { dedupeInflight } from "../src/lib/dedupe-inflight";

describe("dedupeInflight", () => {
  it("runs the loader once for concurrent calls with the same key", async () => {
    const loader = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "ok";
    });

    const [first, second] = await Promise.all([
      dedupeInflight("sites", loader),
      dedupeInflight("sites", loader),
    ]);

    expect(first).toBe("ok");
    expect(second).toBe("ok");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("runs separate loaders for different keys", async () => {
    const loaderA = vi.fn(async () => "a");
    const loaderB = vi.fn(async () => "b");

    const [first, second] = await Promise.all([
      dedupeInflight("sites", loaderA),
      dedupeInflight("site:1", loaderB),
    ]);

    expect(first).toBe("a");
    expect(second).toBe("b");
    expect(loaderA).toHaveBeenCalledTimes(1);
    expect(loaderB).toHaveBeenCalledTimes(1);
  });

  it("allows a new request after the previous one settles", async () => {
    const loader = vi.fn(async () => "ok");

    await dedupeInflight("sites", loader);
    await dedupeInflight("sites", loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("does not dedupe when no cache key is provided", async () => {
    const loader = vi.fn(async () => "ok");

    await Promise.all([dedupeInflight(undefined, loader), dedupeInflight(undefined, loader)]);

    expect(loader).toHaveBeenCalledTimes(2);
  });
});
