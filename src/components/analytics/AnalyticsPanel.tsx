import { BarChart3 } from "lucide-react";
import type { AnalyticsRow } from "../../shared/types";
import { aggregateViewsByDay } from "../../lib/analytics";
import { shortDay } from "../../lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ViewsByDayChart } from "./ViewsByDayChart";
import { CountryAccess, flagEmoji } from "./WorldAccessMap";

export function AnalyticsPanel({ analytics }: { analytics: AnalyticsRow[] }) {
  const daily = aggregateViewsByDay(analytics);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 size={18} strokeWidth={2} className="text-accent" />
          Analytics
        </CardTitle>
        <span className="font-mono text-[12px] text-muted">events ~1min delay</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5">
        <div className="grid grid-cols-[1.4fr_1fr] gap-3.5 max-stack:grid-cols-1">
          <div className="rounded-[12px] border border-line p-4">
            <div className="font-mono text-[13px] text-muted mb-3">Views by day</div>
            <ViewsByDayChart points={daily} />
          </div>
          <div className="rounded-[12px] border border-line p-4">
            <CountryAccess analytics={analytics} />
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <div className="tableHead">
            <span>day</span>
            <span>path</span>
            <span>status</span>
            <span>country</span>
            <span>referrer</span>
            <span>views</span>
          </div>
          {analytics.map((row) => (
            <div
              className="tableRow"
              key={`${row.day}-${row.path}-${row.status}-${row.country}-${row.referrerHost}`}
            >
              <span>{shortDay(row.day)}</span>
              <span className="truncate">{row.path}</span>
              <span>
                {row.status === 200 ? (
                  <Badge variant="accent">{row.status}</Badge>
                ) : (
                  <Badge variant="muted">{row.status}</Badge>
                )}
              </span>
              <span>
                {flagEmoji(row.country)} {row.country}
              </span>
              <span className="truncate">{row.referrerHost || "direct"}</span>
              <span>{row.views}</span>
            </div>
          ))}
          {analytics.length === 0 && (
            <p className="text-muted text-sm py-8 text-center">
              Visit events may take up to a minute to appear.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
