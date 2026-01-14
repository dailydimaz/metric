import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { useSubscription } from "@/hooks/useSubscription";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SiteCard } from "@/components/dashboard/SiteCard";
import { CreateSiteDialog } from "@/components/dashboard/CreateSiteDialog";
import { UsageAlert } from "@/components/billing";
import { Plus, BarChart3, Lock, Loader2, Lightbulb, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useInsights } from "@/hooks/useInsights";
import { isOverLimit } from "@/lib/billing";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { sites, isLoading: sitesLoading } = useSites();
  const { plan, isSelfHosted } = useSubscription();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || sitesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sitesCount = sites.length;
  const sitesLimit = plan.sitesLimit;
  const canCreateSite = isSelfHosted || sitesLimit < 0 || !isOverLimit(sitesCount, sitesLimit);

  // Get first site for insights quick-link
  const firstSite = sites[0];
  const { insights, isLoading: insightsLoading } = useInsights(firstSite?.id || null);
  const hasInsights = insights && insights.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Usage Alert */}
        <UsageAlert />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <p>Manage your sites and view analytics</p>
              <span>•</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Last 30 Days</span>
            </div>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canCreateSite}
            className="shadow-sm gap-2"
          >
            {canCreateSite ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add site
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Upgrade to add more
              </>
            )}
          </Button>
        </div>

        {/* Sites Grid */}
        {sites.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <BarChart3 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold">No sites yet</h2>
            <p className="mt-2 text-muted-foreground text-center max-w-sm">
              Create your first site to start tracking analytics
            </p>
            <Button
              className="mt-6"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first site
            </Button>
          </div>
        )}

        {/* Insights Quick Link Card */}
        {firstSite && (
          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    {hasInsights
                      ? `You have ${insights.length} saved report${insights.length === 1 ? "" : "s"}`
                      : "Create custom reports with saved filters and date ranges"}
                  </p>
                </div>
              </div>
              <Link to={`/dashboard/sites/${firstSite.id}/insights`}>
                <Button variant={hasInsights ? "outline" : "default"} className="gap-2">
                  {hasInsights ? "View Insights" : "Create First Report"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <CreateSiteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </DashboardLayout>
  );
}
