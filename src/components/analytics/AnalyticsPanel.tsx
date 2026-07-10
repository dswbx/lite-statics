import { BarChart3, MapPinned } from "lucide-react";
import type { AnalyticsRow } from "../../shared/types";
import { aggregateViewsByCountry, aggregateViewsByDay } from "../../lib/analytics";
import { Panel } from "../ui/Panel";
import { ViewsByDayChart } from "./ViewsByDayChart";
import { WorldAccessMap } from "./WorldAccessMap";

export function AnalyticsPanel({ analytics }: { analytics: AnalyticsRow[] }) {
  const daily = aggregateViewsByDay(analytics);
  const countries = aggregateViewsByCountry(analytics);
  return (
    <Panel>
      <h3>
        <BarChart3 size={20} /> Analytics
      </h3>
      <p className="text-[0.92rem] leading-normal text-hint">
        Visit events may take up to a minute to appear while they are collected in the background.
      </p>
      <div className="mb-[22px] grid grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)] gap-[18px] max-stack:grid-cols-1">
        <Panel as="div" tone="chart" className="min-w-0 gap-3 shadow-none">
          <strong>Views by day</strong>
          <ViewsByDayChart points={daily} />
        </Panel>
        <Panel as="div" tone="chart" className="min-w-0 gap-3 shadow-none">
          <strong className="inline-flex items-center gap-2">
            <MapPinned size={18} /> World access
          </strong>
          <WorldAccessMap countries={countries} />
        </Panel>
      </div>
      <div className="overflow-x-auto">
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
        {analytics.length === 0 && <p className="text-[0.92rem] leading-normal text-hint">No visits recorded yet.</p>}
      </div>
    </Panel>
  );
}
