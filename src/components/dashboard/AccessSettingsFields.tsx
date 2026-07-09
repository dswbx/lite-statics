import { CalendarClock } from "lucide-react";
import { useState } from "react";
import type { AccessMode } from "../../shared/types";

export function AccessSettingsFields({
  defaultAccessMode = "public",
  defaultDisabled = false,
  showSubmit = true,
  busy = false,
  onCancel,
}: {
  defaultAccessMode?: AccessMode;
  defaultDisabled?: boolean;
  showSubmit?: boolean;
  busy?: boolean;
  onCancel?: () => void;
}) {
  const [accessMode, setAccessMode] = useState<AccessMode>(defaultAccessMode);

  return (
    <>
      <div className="segmented">
        <label>
          <input
            type="radio"
            name="accessMode"
            value="public"
            checked={accessMode === "public"}
            onChange={() => setAccessMode("public")}
          />{" "}
          Public
        </label>
        <label>
          <input
            type="radio"
            name="accessMode"
            value="password"
            checked={accessMode === "password"}
            onChange={() => setAccessMode("password")}
          />{" "}
          Password
        </label>
      </div>
      {accessMode === "password" && (
        <label>
          Password
          <input name="password" type="password" placeholder="Required for password-protected sites" required />
        </label>
      )}
      <label>
        Active until
        <input name="expiresAt" type="datetime-local" />
      </label>
      <label className="check">
        <input name="disabled" type="checkbox" defaultChecked={defaultDisabled} /> Disable now
      </label>
      {showSubmit && (
        <div className="buttonRow">
          <button disabled={busy} type="submit">
            <CalendarClock size={18} /> Save settings
          </button>
          {onCancel && (
            <button type="button" className="ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      )}
    </>
  );
}
