import { Panel } from "./Panel";

export function Explainer({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Panel as="article" className="[&_svg]:text-teal">
      {icon}
      <h2>{title}</h2>
      <p className="text-[0.92rem] leading-normal text-hint">{text}</p>
    </Panel>
  );
}
