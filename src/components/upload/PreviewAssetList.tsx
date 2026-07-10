import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { formatBytes } from "../../lib/format";
import type { PreviewAsset } from "../../lib/upload";
import { Button } from "../ui/Button";

export function PreviewAssetList({ assets }: { assets: PreviewAsset[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleAssets = expanded ? assets : assets.slice(0, 6);
  const remaining = assets.length - visibleAssets.length;
  return (
    <section
      className="mt-3.5 grid gap-2.5 border-2 border-ink bg-sky-soft p-3.5"
      aria-label="Files ready to upload"
    >
      <div className="flex justify-between gap-3 text-[0.88rem] text-muted">
        <strong>Files to publish</strong>
        <span>{assets.length} total</span>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {visibleAssets.map((asset) => (
          <li key={asset.pathname} className="grid gap-0.5 border border-border-muted bg-cream p-2.5">
            <span className="font-[850] [overflow-wrap:anywhere]">{asset.pathname}</span>
            <small className="text-muted">{formatBytes(asset.size)}</small>
          </li>
        ))}
      </ul>
      {assets.length > 6 && (
        <Button type="button" variant="text" onClick={() => setExpanded((current) => !current)}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? "Show fewer files" : `Show ${remaining} more`}
        </Button>
      )}
    </section>
  );
}
