import { Globe2, LockKeyhole, ShieldCheck, Upload } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Explainer } from "../components/ui/Explainer";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { sessionEmail } = useAuth();
  const [, navigate] = useLocation();
  const signedIn = Boolean(sessionEmail);

  return (
    <main className="landingShell">
      <section className="landingHero">
        <p className="eyebrow">Static hosting for small sites</p>
        <h1>Upload HTML. Share a public URL.</h1>
        <p className="lede">
          Static Harbor hosts one-page HTML files or ZIP static sites on Cloudflare. You need an account before uploading so your deployments,
          passwords, expiry rules, and analytics stay attached to you.
        </p>
        <div className="heroActions">
          <button type="button" onClick={() => navigate(signedIn ? "/dashboard" : "/auth")}>
            <ShieldCheck size={18} /> {signedIn ? "Open dashboard" : "Sign up to upload"}
          </button>
          {!signedIn && (
            <Link href="/auth" className="ghost">
              Sign in
            </Link>
          )}
        </div>
      </section>
      <section className="explainerGrid">
        <Explainer icon={<Upload />} title="Upload after sign up" text="Start from an HTML file or a ZIP with index.html. No anonymous drop zone." />
        <Explainer icon={<Globe2 />} title="Publish to /s/slug" text="Each site gets a stable public endpoint that serves your uploaded assets." />
        <Explainer icon={<LockKeyhole />} title="Control access" text="Switch between public and password access, set expiry, and review simple analytics." />
      </section>
    </main>
  );
}
