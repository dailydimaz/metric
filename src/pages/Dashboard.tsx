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
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { sites, isLoading: sitesLoading } = useSites();
  const { plan, isSelfHosted } = useSubscription();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  const sitesCount = sites.length;
  const sitesLimit = plan.sitesLimit;
  const canCreateSite = isSelfHosted || sitesLimit < 0 || !isOverLimit(sitesCount, sitesLimit);

  // Get first site for insights quick-link
  const firstSite = sites[0];
  const { insights, isLoading: insightsLoading } = useInsights(firstSite?.id || null);
  const hasInsights = insights && insights.length > 0;

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Usage Alert */}
        <motion.div variants={item}>
          <UsageAlert />
        </motion.div>

        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <p>Manage your sites and view analytics</p>
              <span className="text-border">•</span>
              <span className="text-xs bg-primary/5 text-primary px-2.5 py-0.5 rounded-full font-medium border border-primary/10">
                Last 30 Days
              </span>
            </div>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canCreateSite}
            className="shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 gap-2"
            size="lg"
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
        </motion.div>

        {/* Sites Grid */}
        <motion.div variants={item}>
          {sites.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-20 px-6 animate-fade-in-up">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 text-primary mb-6 shadow-sm ring-1 ring-primary/10">
                <BarChart3 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No sites yet</h2>
              <p className="text-muted-foreground text-center max-w-sm mb-8 text-lg">
                Create your first site to start tracking analytics and insights.
              </p>
              <Button
                size="lg"
                className="shadow-lg shadow-primary/20"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-5 w-5" />
                Create your first site
              </Button>
            </div>
          )}
        </motion.div>

        {/* Insights Quick Link Card */}
        {firstSite && (
          <motion.div variants={item} className="mt-8 rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/20 p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                  <Lightbulb className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-1">Insights</h3>
                  <p className="text-muted-foreground">
                    {hasInsights
                      ? `You have ${insights.length} saved report${insights.length === 1 ? "" : "s"} ready to view.`
                      : "Create custom reports with saved filters and date ranges."}
                  </p>
                </div>
              </div>
              <Link to={`/dashboard/sites/${firstSite.id}/insights`}>
                <Button variant={hasInsights ? "outline" : "default"} className="gap-2 h-11 px-6 text-base shadow-sm">
                  {hasInsights ? "View Insights" : "Create First Report"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>

      <CreateSiteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </DashboardLayout>
  );
}
