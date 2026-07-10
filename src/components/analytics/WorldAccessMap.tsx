import type { AnalyticsRow } from "../../shared/types";
import { aggregateViewsByCountry } from "../../lib/analytics";
import { Progress } from "../ui/progress";

export function flagEmoji(code: string): string {
   if (!/^[a-zA-Z]{2}$/.test(code)) return "🌐";
   return String.fromCodePoint(
      ...code
         .toUpperCase()
         .split("")
         .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
   );
}

export function CountryAccess({ analytics }: { analytics: AnalyticsRow[] }) {
   const countries = aggregateViewsByCountry(analytics);
   const maxViews = Math.max(...countries.map((country) => country.views), 1);
   const totalVisits = countries.reduce(
      (sum, country) => sum + country.views,
      0
   );

   if (countries.length === 0) {
      return <p className="text-muted text-sm">No visits yet.</p>;
   }

   return (
      <div className="flex flex-col gap-3">
         {countries.map((country) => (
            <div key={country.country} className="flex items-center gap-3">
               <span className="text-base leading-none">
                  {flagEmoji(country.country)}
               </span>
               <span className="font-mono text-[13px] min-w-10">
                  {country.country}
               </span>
               <Progress
                  value={(country.views / maxViews) * 100}
                  className="flex-1"
               />
               <span className="font-mono text-[13px] text-muted">
                  {country.views}
               </span>
            </div>
         ))}
         <div className="font-mono text-[12px] text-muted mt-3">
            {countries.length} {countries.length === 1 ? "country" : "countries"}{" "}
            · {totalVisits} visit{totalVisits === 1 ? "" : "s"} total
         </div>
      </div>
   );
}
