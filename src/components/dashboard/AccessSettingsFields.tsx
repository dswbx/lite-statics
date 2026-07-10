import { CalendarClock } from "lucide-react";
import { useState } from "react";
import type { AccessMode } from "../../shared/types";
import { Button } from "../ui/Button";

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
      <div className="mb-3.5 grid grid-cols-2 gap-2">
        <label className="mb-0 flex items-center gap-2 border-2 border-ink bg-cream p-2.5">
          <input
            className="min-h-0 w-auto"
            type="radio"
            name="accessMode"
            value="public"
            checked={accessMode === "public"}
            onChange={() => setAccessMode("public")}
          />{" "}
          Public
        </label>
        <label className="mb-0 flex items-center gap-2 border-2 border-ink bg-cream p-2.5">
          <input
            className="min-h-0 w-auto"
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
      <label className="mb-0 flex items-center gap-2 border-2 border-ink bg-cream p-2.5">
        <input className="min-h-0 w-auto" name="disabled" type="checkbox" defaultChecked={defaultDisabled} /> Disable now
      </label>
      {showSubmit && (
        <div className="flex flex-wrap items-center gap-2.5">
          <Button disabled={busy} type="submit">
            <CalendarClock size={18} /> Save settings
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </>
  );
}
