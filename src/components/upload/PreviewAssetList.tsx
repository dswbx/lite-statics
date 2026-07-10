import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { formatBytes } from "../../lib/format";
import type { PreviewAsset } from "../../lib/upload";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export function PreviewAssetList({ assets }: { assets: PreviewAsset[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleAssets = expanded ? assets : assets.slice(0, 6);
  const remaining = assets.length - visibleAssets.length;
  return (
    <section
      className="mt-4 flex flex-col gap-2.5 rounded-[14px] border border-line bg-surface p-4"
      aria-label="Files ready to upload"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink">Files to publish</span>
        <Badge variant="muted">{assets.length} total</Badge>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {visibleAssets.map((asset) => (
          <li
            key={asset.pathname}
            className="flex items-center justify-between gap-3 rounded-[9px] border border-line bg-surface2 px-3 py-2"
          >
            <span className="truncate font-mono text-[13px] [overflow-wrap:anywhere]">{asset.pathname}</span>
            <span className="shrink-0 font-mono text-[12px] text-muted">{formatBytes(asset.size)}</span>
          </li>
        ))}
      </ul>
      {assets.length > 6 && (
        <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setExpanded((current) => !current)}>
          {expanded ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
          {expanded ? "Show fewer files" : `Show ${remaining} more`}
        </Button>
      )}
    </section>
  );
}
