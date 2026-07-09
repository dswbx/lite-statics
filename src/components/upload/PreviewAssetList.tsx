import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { formatBytes } from "../../lib/format";
import type { PreviewAsset } from "../../lib/upload";

export function PreviewAssetList({ assets }: { assets: PreviewAsset[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleAssets = expanded ? assets : assets.slice(0, 6);
  const remaining = assets.length - visibleAssets.length;
  return (
    <section className="previewAssets" aria-label="Files ready to upload">
      <div className="previewAssetsHeader">
        <strong>Files to publish</strong>
        <span>{assets.length} total</span>
      </div>
      <ul className="assetList">
        {visibleAssets.map((asset) => (
          <li key={asset.pathname}>
            <span>{asset.pathname}</span>
            <small>{formatBytes(asset.size)}</small>
          </li>
        ))}
      </ul>
      {assets.length > 6 && (
        <button type="button" className="textButton" onClick={() => setExpanded((current) => !current)}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? "Show fewer files" : `Show ${remaining} more`}
        </button>
      )}
    </section>
  );
}
