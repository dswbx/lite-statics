import { hashPassword } from "./password";

export async function readAccessFormFields(form: FormData) {
  const accessMode = String(form.get("accessMode"));
  let passwordHash: string | null = null;
  let passwordSalt: string | null = null;
  if (accessMode === "password") {
    const password = String(form.get("password") ?? "").trim();
    if (!password) throw new Error("Password is required.");
    const hashed = await hashPassword(password);
    passwordHash = hashed.hash;
    passwordSalt = hashed.salt;
  }

  const expiresAt = form.get("expiresAt") ? new Date(String(form.get("expiresAt"))).toISOString() : null;
  const disabled = form.get("disabled") === "on";
  const disabledAt = disabled ? new Date().toISOString() : null;

  return {
    access_mode: accessMode,
    password_hash: passwordHash,
    password_salt: passwordSalt,
    expires_at: expiresAt,
    disabled_at: disabledAt,
  };
}
