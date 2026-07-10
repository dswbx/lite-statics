import { Calendar, Globe, Lock } from "lucide-react";
import { useState } from "react";
import type { AccessMode } from "../../shared/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioCard } from "../ui/radio-group";

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
    <div className="flex flex-col gap-3.5">
      <RadioGroup
        name="accessMode"
        value={accessMode}
        onValueChange={(value) => setAccessMode(value as AccessMode)}
        className="flex gap-2"
      >
        <RadioCard value="public" icon={<Globe size={15} />}>
          Public
        </RadioCard>
        <RadioCard value="password" icon={<Lock size={15} />}>
          Password
        </RadioCard>
      </RadioGroup>
      {accessMode === "password" && (
        <div className="flex flex-col gap-1.5">
          <Label>Password</Label>
          <Input name="password" type="password" placeholder="Required for password-protected sites" required />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label className="font-mono text-[11px] uppercase text-muted">active until</Label>
        <div className="relative">
          <Input name="expiresAt" type="datetime-local" mono />
          <Calendar size={15} strokeWidth={2} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" />
        </div>
      </div>
      <label className="flex items-center gap-2.5 text-[13px] text-muted">
        <Checkbox name="disabled" value="on" defaultChecked={defaultDisabled} />
        Disable now
      </label>
      {showSubmit && (
        <div className="flex flex-wrap items-center gap-2.5">
          <Button disabled={busy} type="submit" variant="default">
            Save settings
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
