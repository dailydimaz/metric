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
import Retention from "./pages/Retention";
import Settings from "./pages/Settings";
import Roadmap from "./pages/Roadmap";
import InviteAccept from "./pages/InviteAccept";

import NotFound from "./pages/NotFound";
import CompareGA from "./pages/CompareGA";
import LiveDemo from "./pages/LiveDemo";
import SelfHosting from "./pages/SelfHosting";
import Privacy from "./pages/Privacy";
import Lightweight from "./pages/Lightweight";




const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/compare/google-analytics" element={<CompareGA />} />
          <Route path="/live" element={<LiveDemo />} />
          <Route path="/resources/self-hosting" element={<SelfHosting />} />
          <Route path="/resources/privacy" element={<Privacy />} />
          <Route path="/resources/lightweight" element={<Lightweight />} />



          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/sites/:siteId" element={<SiteDetail />} />
          <Route path="/dashboard/sites/:siteId/funnels" element={<Funnels />} />
          <Route path="/dashboard/sites/:siteId/funnels/:funnelId" element={<FunnelDetail />} />
          <Route path="/dashboard/sites/:siteId/retention" element={<Retention />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;