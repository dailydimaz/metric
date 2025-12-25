import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FunnelBuilder } from "@/components/analytics/FunnelBuilder";
import { useFunnels, useFunnelAnalytics, Funnel } from "@/hooks/useFunnels";
import { useSites } from "@/hooks/useSites";
import { 
  ArrowLeft, 
  GitBranch, 
  Plus, 
  ChevronRight, 
  TrendingDown,
  Users,
  Target
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

// Quick stats component for each funnel
function FunnelQuickStats({ funnelId }: { funnelId: string }) {
  const { data, isLoading } = useFunnelAnalytics(funnelId, "30d");

  if (isLoading) {
    return (
      <div className="flex gap-4">
        <div className="skeleton h-8 w-16" />
        <div className="skeleton h-8 w-16" />
      </div>
    );
  }

  if (!data) {
    return <span className="text-sm text-muted-foreground">No data</span>;
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{data.totalVisitors}</span>
      </div>
      <div className="flex items-center gap-1">
        <Target className="h-4 w-4 text-green-500" />
        <span className="text-green-600 font-medium">{data.overallConversion}%</span>
      </div>
    </div>
  );
}

export default function Funnels() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const siteIdParam = searchParams.get("siteId");
  
  const { sites } = useSites();
  const [showBuilder, setShowBuilder] = useState(false);

  // Get the first available site if no siteId provided
  const siteId = siteIdParam || sites[0]?.id;
  const site = sites.find(s => s.id === siteId);

  const { data: funnels, isLoading } = useFunnels(siteId);

  if (!siteId || !site) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No site selected</h2>
          <p className="text-muted-foreground mb-4">
            Please select a site to view funnels.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/dashboard/sites/${siteId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Funnels</h1>
              <p className="text-muted-foreground">{site.name}</p>
            </div>
          </div>

          <Button onClick={() => setShowBuilder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Funnel
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Funnels</p>
                  <p className="text-2xl font-bold">{funnels?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Tracking</p>
                  <p className="text-2xl font-bold">{funnels?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Steps</p>
                  <p className="text-2xl font-bold">
                    {funnels && funnels.length > 0
                      ? Math.round(funnels.reduce((acc, f) => acc + f.steps.length, 0) / funnels.length)
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnels List */}
        <Card>
          <CardHeader>
            <CardTitle>All Funnels</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 w-full" />
                ))}
              </div>
            ) : !funnels || funnels.length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">No funnels created yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first funnel to track user conversion paths
                </p>
                <Button onClick={() => setShowBuilder(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Funnel
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {funnels.map((funnel) => (
                  <Link
                    key={funnel.id}
                    to={`/dashboard/funnels/${funnel.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                          <GitBranch className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {funnel.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {funnel.steps.length} steps • {funnel.time_window_days}d window
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <FunnelQuickStats funnelId={funnel.id} />
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {format(new Date(funnel.created_at), "MMM d, yyyy")}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Funnel Analysis Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Define 2-10 steps to track user progression through your conversion path</li>
              <li>• Use the time window to define how long users have to complete the funnel</li>
              <li>• Monitor drop-off rates to identify where users are leaving</li>
              <li>• Compare conversion rates across different date ranges to track improvements</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <FunnelBuilder
        siteId={siteId}
        open={showBuilder}
        onOpenChange={setShowBuilder}
      />
    </DashboardLayout>
  );
}
