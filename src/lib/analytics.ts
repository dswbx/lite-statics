import type { AnalyticsRow } from "../shared/types";

const COUNTRY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  CH: { lat: 46.8, lon: 8.2 },
  DE: { lat: 51.2, lon: 10.4 },
  FR: { lat: 46.2, lon: 2.2 },
  IT: { lat: 41.9, lon: 12.6 },
  AT: { lat: 47.5, lon: 14.5 },
  GB: { lat: 54.5, lon: -2.5 },
  UK: { lat: 54.5, lon: -2.5 },
  NL: { lat: 52.1, lon: 5.3 },
  ES: { lat: 40.4, lon: -3.7 },
  US: { lat: 39.8, lon: -98.6 },
  CA: { lat: 56.1, lon: -106.3 },
  BR: { lat: -14.2, lon: -51.9 },
  IN: { lat: 20.6, lon: 78.9 },
  JP: { lat: 36.2, lon: 138.3 },
  CN: { lat: 35.9, lon: 104.2 },
  AU: { lat: -25.3, lon: 133.8 },
  SG: { lat: 1.35, lon: 103.8 },
};

export function aggregateViewsByDay(rows: AnalyticsRow[]): Array<{ day: string; views: number }> {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    byDay.set(row.day, (byDay.get(row.day) ?? 0) + row.views);
  }
  return [...byDay.entries()]
    .map(([day, views]) => ({ day, views }))
    .sort((left, right) => left.day.localeCompare(right.day));
}

export function aggregateViewsByCountry(rows: AnalyticsRow[]): Array<{ country: string; views: number }> {
  const byCountry = new Map<string, number>();
  for (const row of rows) {
    byCountry.set(row.country, (byCountry.get(row.country) ?? 0) + row.views);
  }
  return [...byCountry.entries()]
    .map(([country, views]) => ({ country, views }))
    .sort((left, right) => right.views - left.views);
}

export function countryCoordinates(country: string): [number, number] | null {
  const coordinate = COUNTRY_COORDINATES[country.toUpperCase()];
  if (!coordinate) return null;
  return [coordinate.lon, coordinate.lat];
}
