export function assetKey(siteId: string, pathname: string): string {
  return `${siteId}${pathname}`;
}

export function sitePrefix(siteId: string): string {
  return `${siteId}/`;
}
