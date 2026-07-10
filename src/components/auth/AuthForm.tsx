import { ShieldCheck } from "lucide-react";
import type { Notice } from "../../shared/notice";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsIndicator, TabsList, TabsTab } from "@/components/ui/tabs";

export type AuthMode = "signin" | "signup";

export function AuthForm({
  mode,
  setMode,
  busy,
  notice,
  onSubmit,
}: {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  busy: boolean;
  notice: Notice;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <Eyebrow className="mb-3">
        {mode === "signup" ? "create account" : "welcome back"}
      </Eyebrow>
      <h1 className="font-mono text-[38px] font-semibold tracking-[-0.035em] mb-7">
        {mode === "signup"
          ? "Sign up before uploading."
          : "Sign in to your account."}
      </h1>

      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as AuthMode)}
        className="mb-6"
      >
        <TabsList className="rounded-[10px] bg-surface2 p-1">
          <TabsIndicator />
          <TabsTab value="signup">Sign up</TabsTab>
          <TabsTab value="signin">Sign in</TabsTab>
        </TabsList>
      </Tabs>

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="auth-password">Password</Label>
          <Input
            id="auth-password"
            name="password"
            type="password"
            mono
            minLength={8}
            placeholder="at least 8 characters"
            required
          />
        </div>
      </div>

      <Button disabled={busy} type="submit" className="w-full mt-7">
        <ShieldCheck size={18} strokeWidth={2} />
        {mode === "signup" ? "Create account" : "Sign in"}
      </Button>

      {notice && (
        <Alert tone={notice.tone === "bad" ? "danger" : "info"} className="mt-4">
          {notice.text}
        </Alert>
      )}
    </form>
  );
}
