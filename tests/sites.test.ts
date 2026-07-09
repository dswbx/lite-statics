import { describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../src/lib/supabase", () => ({
  supabase: {
    from,
  },
}));

import { fetchSiteSummaries } from "../src/lib/sites";

describe("fetchSiteSummaries", () => {
  it("returns mapped sites on success", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "site-1",
          owner_id: "user-1",
          name: "Demo",
          slug: "demo",
          access_mode: "public",
          password_hash: null,
          password_salt: null,
          expires_at: null,
          disabled_at: null,
          asset_count: null,
          total_bytes: null,
          manifest_json: null,
          deployed_at: null,
          created_at: "2026-01-02T00:00:00.000Z",
          updated_at: "2026-01-02T00:00:00.000Z",
        },
      ],
      error: null,
    });
    from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order,
      }),
    });

    const result = await fetchSiteSummaries();

    expect(result.error).toBe(false);
    expect(result.sites).toEqual([
      {
        id: "site-1",
        ownerId: "user-1",
        name: "Demo",
        slug: "demo",
        accessMode: "public",
        expiresAt: null,
        disabledAt: null,
        assetCount: null,
        totalBytes: null,
        deployedAt: null,
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        assets: [],
      },
    ]);
    expect(from).toHaveBeenCalledWith("sites");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("returns an error when the query fails", async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order,
      }),
    });

    const result = await fetchSiteSummaries();

    expect(result.error).toBe(true);
    expect(result.sites).toEqual([]);
  });
});
