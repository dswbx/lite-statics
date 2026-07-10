import type { Session } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { resolveAuthSession } from "../src/lib/resolve-auth-session";

const session = {
  access_token: "token",
  refresh_token: "refresh",
  expires_in: 3600,
  token_type: "bearer",
  user: { id: "user-1", email: "user@example.com" },
} as Session;

describe("resolveAuthSession", () => {
  it("returns null when there is no session", async () => {
    const getUser = async () => ({ data: { user: { id: "user-1" } }, error: null });

    await expect(resolveAuthSession(null, getUser)).resolves.toBeNull();
  });

  it("keeps the session when getUser returns a user", async () => {
    const getUser = async () => ({ data: { user: { id: "user-1", email: "user@example.com" } }, error: null });

    await expect(resolveAuthSession(session, getUser)).resolves.toBe(session);
  });

  it("returns null when getUser returns an error", async () => {
    const getUser = async () => ({ data: { user: null }, error: new Error("user not found") });

    await expect(resolveAuthSession(session, getUser)).resolves.toBeNull();
  });

  it("returns null when getUser returns no user", async () => {
    const getUser = async () => ({ data: { user: null }, error: null });

    await expect(resolveAuthSession(session, getUser)).resolves.toBeNull();
  });
});
