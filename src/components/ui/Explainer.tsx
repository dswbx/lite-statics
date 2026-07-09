export function Explainer({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="explainer">
      {icon}
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}
