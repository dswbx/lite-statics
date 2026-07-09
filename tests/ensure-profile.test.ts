import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, supabaseMock } = vi.hoisted(() => {
  const fromMock = vi.fn();
  return {
    fromMock,
    supabaseMock: { from: fromMock },
  };
});

vi.mock("../src/lib/supabase", () => ({
  supabase: supabaseMock,
}));

import { ensureProfile } from "../src/lib/ensure-profile";

describe("ensureProfile", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("inserts a profile when one is missing", async () => {
    const selectEq = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const insert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: selectEq }),
      insert,
    });

    await ensureProfile("user-1", "user@example.com");

    expect(insert).toHaveBeenCalledWith({ id: "user-1", email: "user@example.com" });
  });

  it("skips insert when the profile already exists", async () => {
    const selectEq = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "user-1" }, error: null }),
    });
    const insert = vi.fn();
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: selectEq }),
      insert,
    });

    await ensureProfile("user-1", "user@example.com");

    expect(insert).not.toHaveBeenCalled();
  });
});
