// Cloudflare Workers caps PBKDF2 at 100k iterations; keep in sync with the
// browser copy in src/lib/password.ts or password verification breaks.
const PASSWORD_ITERATIONS = 100_000;
const SIGNING_ALGORITHM = { name: "HMAC", hash: "SHA-256" } as const;

export function bytesToBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let text = "";
  for (const byte of view) text += String.fromCharCode(byte);
  return btoa(text);
}

export function base64ToBytes(value: string): Uint8Array {
  const text = atob(value);
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    bytes[index] = text.charCodeAt(index);
  }
  return bytes;
}

export function bytesToBase64Url(bytes: ArrayBuffer): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return base64ToBytes(normalized + padding);
}

export async function sha256Hex(input: ArrayBuffer | string): Promise<string> {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return { salt: bytesToBase64(saltBytes.buffer), hash: bytesToBase64(hash) };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const saltBytes = base64ToBytes(salt);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const actual = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return timingSafeEqual(bytesToBase64(actual), expectedHash);
}

export async function signValue(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), SIGNING_ALGORITHM, false, ["sign"]);
  const signature = await crypto.subtle.sign(SIGNING_ALGORITHM, key, new TextEncoder().encode(value));
  return `${value}.${bytesToBase64Url(signature)}`;
}

export async function verifySignedValue(secret: string, signed: string, expectedValue: string): Promise<boolean> {
  const dot = signed.lastIndexOf(".");
  if (dot < 1) return false;
  const value = signed.slice(0, dot);
  const signature = signed.slice(dot + 1);
  if (!timingSafeEqual(value, expectedValue)) return false;
  const expected = await signValue(secret, value);
  const expectedSignature = expected.slice(expected.lastIndexOf(".") + 1);
  return timingSafeEqual(signature, expectedSignature);
}

export function timingSafeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  if (leftBytes.length !== rightBytes.length) return false;
  let diff = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    diff |= leftBytes[index] ^ rightBytes[index];
  }
  return diff === 0;
}
