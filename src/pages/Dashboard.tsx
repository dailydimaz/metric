import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { useSubscription } from "@/hooks/useSubscription";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SiteCard } from "@/components/dashboard/SiteCard";
import { CreateSiteDialog } from "@/components/dashboard/CreateSiteDialog";
import { UsageAlert } from "@/components/billing";
import { Plus, BarChart3, Lock, Loader2 } from "lucide-react";
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Usage Alert */}
        <UsageAlert />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your sites and view analytics
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canCreateSite}
            className="shadow-sm"
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
      </div>

      <CreateSiteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </DashboardLayout>
  );
}
