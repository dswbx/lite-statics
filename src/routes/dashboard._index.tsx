import { DashboardHome } from "../components/dashboard/DashboardHome";
import { useAuth } from "../context/AuthContext";

export default function DashboardHomePage() {
  const { sites } = useAuth();
  return <DashboardHome sites={sites} />;
}
