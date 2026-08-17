import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { Notice } from "../../shared/notice";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsIndicator, TabsList, TabsTab } from "@/components/ui/tabs";

export type AuthMode = "signin" | "signup" | "forgot";

export function AuthForm({
  mode,
  setMode,
  busy,
  notice,
  pendingEmail,
  googleEnabled,
  onSubmit,
  onVerifyCode,
  onGoogleSignIn,
}: {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  busy: boolean;
  notice: Notice;
  pendingEmail: string | null;
  googleEnabled: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onVerifyCode: (code: string) => void | Promise<void>;
  onGoogleSignIn: () => void | Promise<void>;
}) {
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!pendingEmail) setCode("");
  }, [pendingEmail]);

  if (pendingEmail) {
    const forgot = mode === "forgot";
    return (
      <form
        key="pending-verify"
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = code.trim();
          if (trimmed) void onVerifyCode(trimmed);
        }}
      >
        <Eyebrow className="mb-3">check your email</Eyebrow>
        <h1 className="font-mono text-[38px] font-semibold tracking-[-0.035em] mb-4">
          {forgot ? "Reset your password" : "Confirm your email"}
        </h1>
        <p className="text-muted text-[15px] leading-relaxed mb-6">
          {forgot
            ? `We sent a reset code to ${pendingEmail}. Enter it below, or open the link in the email.`
            : `We sent a confirmation code to ${pendingEmail}. Enter it below, or open the link in the email.`}
        </p>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="auth-code">Confirmation code</Label>
            <Input
              id="auth-code"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              pattern="[0-9]{6,8}"
              placeholder="123456"
              mono
              value={code}
              onChange={(event) => setCode(event.currentTarget.value)}
              required
            />
          </div>
        </div>
        <Button disabled={busy} type="submit" className="w-full mt-7">
          <ShieldCheck size={18} strokeWidth={2} />
          {forgot ? "Continue" : "Confirm email"}
        </Button>
        <div className="mt-4">
          <button
            type="button"
            className="text-[14px] text-muted hover:underline"
            onClick={() => setMode("signin")}
          >
            Back to sign in
          </button>
        </div>
        {notice && (
          <Alert tone={notice.tone === "bad" ? "danger" : "info"} className="mt-4">
            {notice.text}
          </Alert>
        )}
      </form>
    );
  }

  return (
    <form key="auth-main" onSubmit={onSubmit}>
      <Eyebrow className="mb-3">
        {mode === "signup"
          ? "create account"
          : mode === "forgot"
            ? "reset password"
            : "welcome back"}
      </Eyebrow>
      <h1 className="font-mono text-[38px] font-semibold tracking-[-0.035em] mb-7">
        {mode === "signup"
          ? "Sign up before uploading."
          : mode === "forgot"
            ? "Forgot your password?"
            : "Sign in to your account."}
      </h1>

      {mode !== "forgot" && (
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
      )}

      {mode !== "forgot" && googleEnabled && (
        <>
          <Button
            type="button"
            variant="line"
            disabled={busy}
            className="w-full"
            onClick={() => void onGoogleSignIn()}
          >
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[12px] uppercase tracking-wide text-muted">or</span>
            <div className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

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
        {mode !== "forgot" && (
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
        )}
      </div>

      {mode === "signin" && (
        <div className="mt-3">
          <button
            type="button"
            className="text-[14px] text-accent hover:underline"
            onClick={() => setMode("forgot")}
          >
            Forgot your password?
          </button>
        </div>
      )}

      <Button disabled={busy} type="submit" className="w-full mt-7">
        <ShieldCheck size={18} strokeWidth={2} />
        {mode === "signup"
          ? "Create account"
          : mode === "forgot"
            ? "Send reset link"
            : "Sign in"}
      </Button>

      {mode === "forgot" && (
        <div className="mt-4">
          <button
            type="button"
            className="text-[14px] text-muted hover:underline"
            onClick={() => setMode("signin")}
          >
            Back to sign in
          </button>
        </div>
      )}

      {notice && (
        <Alert tone={notice.tone === "bad" ? "danger" : "info"} className="mt-4">
          {notice.text}
        </Alert>
      )}
    </form>
  );
}
