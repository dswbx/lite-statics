import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import type { Notice } from "../../shared/notice";
import { Button } from "../ui/Button";
import { Eyebrow } from "../ui/Eyebrow";
import { Notice as NoticeBanner } from "../ui/Notice";
import { Panel } from "../ui/Panel";

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
      <Link href="/" className="inline-flex min-h-[42px] items-center justify-center gap-2 bg-transparent px-0 font-serif text-[1.35rem] font-black text-ink no-underline">
        Statics
      </Link>
      <Panel as="form" onSubmit={onSubmit} className="w-full max-w-[520px] p-[26px] [&_h1]:text-[clamp(2rem,5vw,3.7rem)]">
        <Eyebrow>{mode === "signup" ? "Create account" : "Welcome back"}</Eyebrow>
        <h1>{mode === "signup" ? "Sign up before uploading." : "Sign in to manage sites."}</h1>
        <div className="mb-[18px] grid grid-cols-2 gap-2">
          <label className="mb-0 flex items-center gap-2 border-2 border-ink bg-cream p-2.5">
            <input
              className="min-h-0 w-auto"
              type="radio"
              name="mode"
              checked={mode === "signup"}
              onChange={() => setMode("signup")}
            />{" "}
            Sign up
          </label>
          <label className="mb-0 flex items-center gap-2 border-2 border-ink bg-cream p-2.5">
            <input
              className="min-h-0 w-auto"
              type="radio"
              name="mode"
              checked={mode === "signin"}
              onChange={() => setMode("signin")}
            />{" "}
            Sign in
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
        <Button disabled={busy} type="submit">
          <ShieldCheck size={18} /> {mode === "signup" ? "Create account" : "Sign in"}
        </Button>
        {notice && <NoticeBanner inline tone={notice.tone}>{notice.text}</NoticeBanner>}
      </Panel>
    </>
  );
}
