import type { ReactNode } from "react";
import { Route, Router, Switch } from "wouter";
import { AuthProvider } from "./context/AuthContext";
import { NoticeProvider } from "./context/NoticeContext";
import { ThemeProvider } from "./context/ThemeContext";
import LandingPage from "./routes/_index";
import AuthPage from "./routes/auth";
import DashboardLayout from "./routes/dashboard";
import DashboardHomePage from "./routes/dashboard._index";
import NewSitePage from "./routes/dashboard.sites.new";
import SiteDetailPage from "./routes/dashboard.sites.$siteId";

function withDashboard(Page: () => ReactNode) {
  return function DashboardRoute() {
    return (
      <DashboardLayout>
        <Page />
      </DashboardLayout>
    );
  };
}

export function AppRoutes() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NoticeProvider>
          <Router>
            <Switch>
              <Route path="/" component={LandingPage} />
              <Route path="/auth" component={AuthPage} />
              <Route path="/dashboard" component={withDashboard(DashboardHomePage)} />
              <Route path="/dashboard/sites/new" component={withDashboard(NewSitePage)} />
              <Route path="/dashboard/sites/:siteId" component={withDashboard(SiteDetailPage)} />
            </Switch>
          </Router>
        </NoticeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
