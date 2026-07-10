import { Panel } from "./Panel";

export function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Panel as="div" tone="metric" className="min-w-0 [&_svg]:h-[19px] [&_svg]:w-[19px]">
      {icon}
      <span className="mt-2.5 block text-[0.78rem] text-muted">{label}</span>
      <strong className="block text-[1.45rem] [overflow-wrap:anywhere]">{value}</strong>
    </Panel>
  );
}
