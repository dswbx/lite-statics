/** @vitest-environment happy-dom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setSession = vi.fn();
const getSession = vi.fn();

vi.mock("../src/lib/supabase", () => ({
  supabase: {
    auth: {
      setSession: (...args: unknown[]) => setSession(...args),
      getSession: (...args: unknown[]) => getSession(...args),
    },
  },
}));

describe("consumeAuthRedirectSession", () => {
  beforeEach(() => {
    setSession.mockReset();
    getSession.mockReset();
    window.history.replaceState(null, "", "/auth/callback");
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("throws when the query carries an OAuth error", async () => {
    const { consumeAuthRedirectSession } = await import("../src/lib/auth-hash-session");
    window.history.replaceState(
      null,
      "",
      "/auth/callback?error=access_denied&error_description=User%20denied",
    );

    await expect(consumeAuthRedirectSession()).rejects.toThrow("User denied");
  });

  it("sets a session from hash tokens", async () => {
    const { consumeAuthRedirectSession } = await import("../src/lib/auth-hash-session");
    setSession.mockResolvedValue({ error: null });
    window.history.replaceState(
      null,
      "",
      "/auth/callback#access_token=at&refresh_token=rt&type=signup",
    );

    await expect(consumeAuthRedirectSession()).resolves.toEqual({ type: "signup" });
    expect(setSession).toHaveBeenCalledWith({
      access_token: "at",
      refresh_token: "rt",
    });
  });

  it("returns a session after a PKCE code redirect", async () => {
    const { consumeAuthRedirectSession } = await import("../src/lib/auth-hash-session");
    getSession.mockResolvedValue({
      data: { session: { access_token: "at" } },
      error: null,
    });
    window.history.replaceState(null, "", "/auth/callback?code=pkce-code");

    await expect(consumeAuthRedirectSession()).resolves.toEqual({ type: null });
    expect(getSession).toHaveBeenCalled();
  });

  it("returns null when there is no code or hash session", async () => {
    const { consumeAuthRedirectSession } = await import("../src/lib/auth-hash-session");
    window.history.replaceState(null, "", "/auth/callback");

    await expect(consumeAuthRedirectSession()).resolves.toBeNull();
  });
});
