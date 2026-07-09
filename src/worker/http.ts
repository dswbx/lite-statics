export function parseCookies(request: Request): Map<string, string> {
  const result = new Map<string, string>();
  const cookie = request.headers.get("cookie");
  if (!cookie) return result;
  for (const part of cookie.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName || rawValue.length === 0) continue;
    result.set(rawName, decodeURIComponent(rawValue.join("=")));
  }
  return result;
}
