import { describe, expect, it } from "vitest";
import { hashPassword as clientHashPassword } from "../src/lib/password";
import { hashPassword, signValue, verifyPassword, verifySignedValue } from "../src/worker/crypto";

describe("password and cookie crypto", () => {
  it("hashes and verifies passwords", async () => {
    const hashed = await hashPassword("correct horse");

    await expect(verifyPassword("correct horse", hashed.salt, hashed.hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hashed.salt, hashed.hash)).resolves.toBe(false);
  });

  it("verifies dashboard password hashes on the worker", async () => {
    const hashed = await clientHashPassword("site-secret");

    await expect(verifyPassword("site-secret", hashed.salt, hashed.hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hashed.salt, hashed.hash)).resolves.toBe(false);
  });

  it("signs and verifies access cookie payloads", async () => {
    const signed = await signValue("secret", "site:abc");

    await expect(verifySignedValue("secret", signed, "site:abc")).resolves.toBe(true);
    await expect(verifySignedValue("secret", signed, "site:other")).resolves.toBe(false);
    await expect(verifySignedValue("other-secret", signed, "site:abc")).resolves.toBe(false);
  });
});
