import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { shortDay } from "../../lib/format";

export function ViewsByDayChart({ points }: { points: Array<{ day: string; views: number }> }) {
  if (points.length === 0) {
    return (
      <div className="grid min-h-[170px] place-items-center border border-dashed border-chart-empty text-muted">
        No views yet
      </div>
    );
  }

  return (
    <div aria-label="Views grouped by day">
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={points} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="#ccd7cf" />
          <XAxis dataKey="day" tickFormatter={shortDay} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "rgba(15, 118, 110, 0.08)" }} />
          <Bar dataKey="views" name="Views" fill="#0f766e" stroke="#17201b" strokeWidth={2} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between gap-3 text-[0.82rem] text-muted">
        <span>{points[0]?.day}</span>
        <strong className="text-ink">{points.reduce((sum, point) => sum + point.views, 0)} total views</strong>
        <span>{points.at(-1)?.day}</span>
      </div>
    </div>
  );
}
