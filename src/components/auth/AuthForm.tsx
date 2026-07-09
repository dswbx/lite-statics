import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import type { Notice } from "../../shared/notice";

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
    <>
      <Link href="/" className="brandButton">
        Static Harbor
      </Link>
      <form onSubmit={onSubmit} className="authCard">
        <p className="eyebrow">{mode === "signup" ? "Create account" : "Welcome back"}</p>
        <h1>{mode === "signup" ? "Sign up before uploading." : "Sign in to manage sites."}</h1>
        <div className="segmented modeSwitch">
          <label>
            <input type="radio" name="mode" checked={mode === "signup"} onChange={() => setMode("signup")} /> Sign up
          </label>
          <label>
            <input type="radio" name="mode" checked={mode === "signin"} onChange={() => setMode("signin")} /> Sign in
          </label>
        </div>
        <label>
          Email
          <input name="email" type="email" placeholder="you@example.com" required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength={8} placeholder="At least 8 characters" required />
        </label>
        <button disabled={busy} type="submit">
          <ShieldCheck size={18} /> {mode === "signup" ? "Create account" : "Sign in"}
        </button>
        {notice && <p className={`notice inline ${notice.tone}`}>{notice.text}</p>}
      </form>
    </>
  );
}
