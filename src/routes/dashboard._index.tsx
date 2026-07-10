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
      <section className="grid min-h-[340px] place-items-center content-center gap-3 border-2 border-ink bg-surface p-7 text-center shadow-brutal">
        <h2>Loading sites...</h2>
      </section>
    );
  }

  return <DashboardHome sites={sites} />;
}
