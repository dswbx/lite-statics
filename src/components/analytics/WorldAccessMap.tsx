import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import worldMap from "world-atlas/countries-110m.json";
import { countryCoordinates } from "../../lib/analytics";

export function WorldAccessMap({ countries }: { countries: Array<{ country: string; views: number }> }) {
  const maxViews = Math.max(...countries.map((country) => country.views), 1);
  const plottedCountries = countries
    .map((country) => ({ ...country, coordinates: countryCoordinates(country.country) }))
    .filter((country): country is { country: string; views: number; coordinates: [number, number] } => Boolean(country.coordinates));
  return (
    <div className="grid gap-3">
      <div className="relative min-h-[170px] overflow-hidden border-2 border-ink bg-sky" aria-label="World access map">
        <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 150 }} className="block min-h-[190px] w-full">
          <Geographies geography={worldMap}>
            {({ geographies }) =>
              geographies.map((geography) => (
                <Geography key={geography.rsmKey} geography={geography} className="mapGeography" tabIndex={-1} />
              ))
            }
          </Geographies>
          {plottedCountries.slice(0, 12).map((country) => (
            <Marker key={country.country} coordinates={country.coordinates}>
              <circle className="mapDot" r={6 + (country.views / maxViews) * 12}>
                <title>
                  {country.country}: {country.views} views
                </title>
              </circle>
            </Marker>
          ))}
        </ComposableMap>
        {countries.length === 0 && (
          <span className="absolute inset-0 grid place-items-center font-[850] text-muted">No country data</span>
        )}
        {countries.length > 0 && plottedCountries.length === 0 && (
          <span className="absolute inset-0 grid place-items-center font-[850] text-muted">Country codes unavailable</span>
        )}
      </div>
      <div className="grid gap-2">
        {countries.slice(0, 5).map((country) => (
          <div key={country.country} className="flex justify-between gap-3 border-b border-border-muted py-2">
            <span>{country.country}</span>
            <strong>{country.views}</strong>
          </div>
        ))}
        {countries.length === 0 && (
          <p className="text-[0.92rem] leading-normal text-hint">Country data appears after public visits.</p>
        )}
      </div>
    </div>
  );
}
