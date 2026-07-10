import { useEffect } from "react";
import { DashboardHome } from "../components/dashboard/DashboardHome";
import { useNotice } from "../context/NoticeContext";
import { useSites } from "../hooks/useSites";

export default function DashboardHomePage() {
  const { sites, loading, error } = useSites();
  const { setNotice } = useNotice();

  useEffect(() => {
    if (error) setNotice({ tone: "bad", text: "Could not load sites." });
  }, [error, setNotice]);

  if (loading) {
    return (
      <div className="px-8 py-7 max-stack:px-5 max-stack:py-5">
        <div className="grid min-h-[340px] place-items-center rounded-[14px] border border-line bg-surface p-7 text-center">
          <p className="font-mono text-[13px] text-muted">Loading sites…</p>
        </div>
      </div>
    );
  }

  return <DashboardHome sites={sites} />;
}
