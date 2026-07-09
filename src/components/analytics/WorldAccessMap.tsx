import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import worldMap from "world-atlas/countries-110m.json";
import { countryCoordinates } from "../../lib/analytics";

export function WorldAccessMap({ countries }: { countries: Array<{ country: string; views: number }> }) {
  const maxViews = Math.max(...countries.map((country) => country.views), 1);
  const plottedCountries = countries
    .map((country) => ({ ...country, coordinates: countryCoordinates(country.country) }))
    .filter((country): country is { country: string; views: number; coordinates: [number, number] } => Boolean(country.coordinates));
  return (
    <div className="worldPanel">
      <div className="worldMap" aria-label="World access map">
        <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 150 }} className="realWorldMap">
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
        {countries.length === 0 && <span className="mapEmpty">No country data</span>}
        {countries.length > 0 && plottedCountries.length === 0 && <span className="mapEmpty">Country codes unavailable</span>}
      </div>
      <div className="countryList">
        {countries.slice(0, 5).map((country) => (
          <div key={country.country}>
            <span>{country.country}</span>
            <strong>{country.views}</strong>
          </div>
        ))}
        {countries.length === 0 && <p className="empty">Country data appears after public visits.</p>}
      </div>
    </div>
  );
}
