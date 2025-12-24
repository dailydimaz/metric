import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SiteCard } from "@/components/dashboard/SiteCard";
import { CreateSiteDialog } from "@/components/dashboard/CreateSiteDialog";
import { Plus, BarChart3, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { sites, isLoading: sitesLoading } = useSites();
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
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-base-content/70">
              Manage your sites and view analytics
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add site
          </button>
        </div>

        {/* Sites Grid */}
        {sites.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200/30 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <BarChart3 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold">No sites yet</h2>
            <p className="mt-2 text-base-content/70 text-center max-w-sm">
              Create your first site to start tracking analytics
            </p>
            <button 
              className="btn btn-primary mt-6"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first site
            </button>
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
