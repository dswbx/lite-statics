export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, { status });
}

export async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Expected application/json");
  }
  return (await request.json()) as T;
}

export function parseCookies(request: Request): Map<string, string> {
  const result = new Map<string, string>();
  const cookie = request.headers.get("cookie");
  if (!cookie) return result;
  for (const part of cookie.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName || rawValue.length === 0) continue;
    result.set(rawName, rawValue.join("="));
  }
  return result;
}

export function setCookieHeader(name: string, value: string, maxAgeSeconds: number): string {
  return `${name}=${value}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function isSitePath(pathname: string): boolean {
  return pathname === "/s" || pathname.startsWith("/s/");
}
