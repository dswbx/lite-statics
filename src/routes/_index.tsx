import { Globe, Lock, Moon, ShieldCheck, Sun, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Explainer } from "@/components/ui/explainer";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function LandingPage() {
  const { sessionEmail } = useAuth();
  const { resolvedTheme, toggle } = useTheme();
  const [, navigate] = useLocation();
  const signedIn = Boolean(sessionEmail);

  return (
    <div className="shell-bg">
      <div className="max-w-[1180px] mx-auto">
        <header className="flex items-center justify-between px-10 py-5 border-b border-line max-stack:px-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-ink text-[15px] text-on-ink font-mono">
              S
            </span>
            <span className="font-mono text-[19px] font-semibold tracking-[-0.02em]">
              Statics
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-10"
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggle}
            >
              {resolvedTheme === "dark" ? (
                <Sun size={18} strokeWidth={2} />
              ) : (
                <Moon size={18} strokeWidth={2} />
              )}
            </Button>
            <Button variant="line" onClick={() => navigate("/auth?mode=signin")}>
              Sign in
            </Button>
            <Button variant="default" onClick={() => navigate("/auth?mode=signup")}>
              Sign up
            </Button>
          </div>
        </header>

        <section className="px-16 pt-20 pb-15 max-stack:px-5 max-stack:pt-12">
          <Eyebrow className="text-[13px] tracking-[0.12em] text-accent mb-6">
            static hosting for small sites
          </Eyebrow>
          <h1 className="font-mono text-[66px] max-stack:text-[38px] leading-[1.02] font-semibold tracking-[-0.045em] max-w-[900px]">
            Upload HTML. <br /> Share a public URL.
          </h1>
          <p className="text-[18px] leading-[1.6] text-muted max-w-[600px] mt-6">
            Host one-page HTML files or ZIP static sites on the edge.
            Deployments, passwords, expiry rules and analytics stay attached
            to your account.
          </p>
          <div className="mt-8 flex gap-3 max-stack:flex-col">
            <Button
              variant="default"
              onClick={() => navigate(signedIn ? "/dashboard" : "/auth?mode=signup")}
            >
              <ShieldCheck size={18} strokeWidth={2} />
              {signedIn ? "Open dashboard" : "Sign up to upload"}
            </Button>
            {!signedIn && (
              <Button variant="outline" onClick={() => navigate("/auth?mode=signin")}>
                Sign in
              </Button>
            )}
          </div>

          <div className="mt-16 pt-12 border-t border-line grid grid-cols-3 gap-4 max-stack:grid-cols-1">
            <Explainer icon={Upload} title="Upload after sign up">
              Start from an HTML file or a ZIP with index.html. No anonymous
              drop zone.
            </Explainer>
            <Explainer icon={Globe} title="Publish to /s/slug">
              Each site gets a stable public endpoint that serves your
              uploaded assets.
            </Explainer>
            <Explainer icon={Lock} title="Control access">
              Switch between public and password access, set expiry, and
              review simple analytics.
            </Explainer>
          </div>
        </section>
      </div>
    </div>
  );
}
