import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import SiteDetail from "./pages/SiteDetail";
import FunnelDetail from "./pages/FunnelDetail";
import Funnels from "./pages/Funnels";
import Journeys from "./pages/Journeys";
import Retention from "./pages/Retention";
import Settings from "./pages/Settings";
import Roadmap from "./pages/Roadmap";
import InviteAccept from "./pages/InviteAccept";
import PublicDashboard from "./pages/PublicDashboard";
import Cohorts from "./pages/Cohorts";
import Insights from "./pages/Insights";
import SharedInsight from "./pages/SharedInsight";
import Links from "./pages/Links";
import Attribution from "./pages/Attribution";
import Integrations from "./pages/Integrations";
import GAImportWizard from "./pages/GAImportWizard";
import GSCDashboard from "./pages/GSCDashboard";

import NotFound from "./pages/NotFound";
import CompareGA from "./pages/CompareGA";
import LiveDemo from "./pages/LiveDemo";
import SelfHosting from "./pages/SelfHosting";
import Privacy from "./pages/Privacy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Lightweight from "./pages/Lightweight";
import CampaignBuilder from "./pages/CampaignBuilder";
import Migrate from "./pages/Migrate";
import Changelog from "./pages/Changelog";
import { ThemeProvider } from "./components/ThemeProvider";
import { CommandMenu } from "./components/dashboard/CommandMenu";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CommandMenu />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/compare/google-analytics" element={<CompareGA />} />
            <Route path="/live" element={<LiveDemo />} />
            <Route path="/resources/self-hosting" element={<SelfHosting />} />
            <Route path="/resources/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/resources/lightweight" element={<Lightweight />} />
            <Route path="/migrate" element={<Migrate />} />
            <Route path="/changelog" element={<Changelog />} />
            {/* Public routes */}
            <Route path="/share/:token" element={<PublicDashboard />} />
            <Route path="/insight/:token" element={<SharedInsight />} />

            {/* Integrations */}
            <Route path="/dashboard/sites/:siteId/integrations" element={<Integrations />} />
            <Route path="/dashboard/sites/:siteId/integrations/ga-import" element={<GAImportWizard />} />
            <Route path="/dashboard/sites/:siteId/gsc" element={<GSCDashboard />} />

            <Route path="/invite/:token" element={<InviteAccept />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/sites/:siteId" element={<SiteDetail />} />
            <Route path="/dashboard/sites/:siteId/funnels" element={<Funnels />} />
            <Route path="/dashboard/sites/:siteId/funnels/:funnelId" element={<FunnelDetail />} />
            <Route path="/dashboard/sites/:siteId/retention" element={<Retention />} />
            <Route path="/dashboard/sites/:siteId/journeys" element={<Journeys />} />
            <Route path="/dashboard/sites/:siteId/cohorts" element={<Cohorts />} />
            <Route path="/dashboard/sites/:siteId/insights" element={<Insights />} />
            <Route path="/dashboard/sites/:siteId/links" element={<Links />} />
            <Route path="/dashboard/sites/:siteId/attribution" element={<Attribution />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/tools/campaign-builder" element={<CampaignBuilder />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;