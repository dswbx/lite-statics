import { BarChart3, MapPinned } from "lucide-react";
import type { AnalyticsRow } from "../../shared/types";
import { aggregateViewsByCountry, aggregateViewsByDay } from "../../lib/analytics";
import { ViewsByDayChart } from "./ViewsByDayChart";
import { WorldAccessMap } from "./WorldAccessMap";

export function AnalyticsPanel({ analytics }: { analytics: AnalyticsRow[] }) {
  const daily = aggregateViewsByDay(analytics);
  const countries = aggregateViewsByCountry(analytics);
  return (
    <section className="analytics">
      <h3>
        <BarChart3 size={20} /> Analytics
      </h3>
      <p className="hint">Visit events may take up to a minute to appear while they are collected in the background.</p>
      <div className="analyticsGrid">
        <div className="chartPanel">
          <strong>Views by day</strong>
          <ViewsByDayChart points={daily} />
        </div>
        <div className="chartPanel">
          <strong>
            <MapPinned size={18} /> World access
          </strong>
          <WorldAccessMap countries={countries} />
        </div>
      </div>
      <div className="table">
        <div className="tableHead">
          <span>Day</span>
          <span>Path</span>
          <span>Status</span>
          <span>Country</span>
          <span>Referrer</span>
          <span>Views</span>
        </div>
        {analytics.map((row) => (
          <div className="tableRow" key={`${row.day}-${row.path}-${row.status}-${row.country}-${row.referrerHost}`}>
            <span>{row.day}</span>
            <span>{row.path}</span>
            <span>{row.status}</span>
            <span>{row.country}</span>
            <span>{row.referrerHost}</span>
            <span>{row.views}</span>
          </div>
        ))}
        {analytics.length === 0 && <p className="empty">No visits recorded yet.</p>}
      </div>
    </section>
  );
}
