import { Globe2, LockKeyhole, ShieldCheck, Upload } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Explainer } from "../components/ui/Explainer";
import { Shell } from "../components/ui/Shell";
import { Eyebrow } from "../components/ui/Eyebrow";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { sessionEmail } = useAuth();
  const [, navigate] = useLocation();
  const signedIn = Boolean(sessionEmail);

  return (
    <Shell variant="landing">
      <section className="grid min-h-[58vh] content-center border-b-2 border-ink py-[38px]">
        <Eyebrow>Static hosting for small sites</Eyebrow>
        <h1>Upload HTML. Share a public URL.</h1>
        <p className="max-w-[780px] text-[1.08rem] leading-relaxed text-lede">
          Statics hosts one-page HTML files or ZIP static sites on Cloudflare. You need an account before uploading so your deployments,
          passwords, expiry rules, and analytics stay attached to you.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigate(signedIn ? "/dashboard" : "/auth")}>
            <ShieldCheck size={18} /> {signedIn ? "Open dashboard" : "Sign up to upload"}
          </button>
          {!signedIn && (
            <Link href="/auth" className="inline-flex min-h-[42px] items-center justify-center gap-2 border-2 border-ink bg-transparent px-3.5 py-2.5 font-black text-ink no-underline">
              Sign in
            </Link>
          )}
        </div>
      </section>
      <section className="grid grid-cols-3 gap-[18px] pt-6 max-stack:grid-cols-1">
        <Explainer icon={<Upload />} title="Upload after sign up" text="Start from an HTML file or a ZIP with index.html. No anonymous drop zone." />
        <Explainer icon={<Globe2 />} title="Publish to /s/slug" text="Each site gets a stable public endpoint that serves your uploaded assets." />
        <Explainer icon={<LockKeyhole />} title="Control access" text="Switch between public and password access, set expiry, and review simple analytics." />
      </section>
    </Shell>
  );
}
