import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  GoalSetup,
  BreakdownPanel,
  BreakdownDimension,
} from "@/components/analytics";
import { DashboardCustomizer } from "@/components/dashboard/DashboardCustomizer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  useAnalyticsStats,
  useAnalyticsTimeSeries,
  useTopPages,
  useTopReferrers,
  useDeviceStats,
  useGeoStats,
  useCityStats,
  useLanguageStats,
  useUTMStats,
  DateRange,
  AnalyticsFilter
} from "@/hooks/useAnalytics";

// New Components
import { SiteHeader } from "@/components/site-detail/SiteHeader";
import { SiteSettingsPanel } from "@/components/site-detail/SiteSettingsPanel";
import { SiteAnalytics } from "@/components/site-detail/SiteAnalytics";

export default function SiteDetail() {
  const { siteId } = useParams<{ siteId: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { sites, isLoading: sitesLoading, deleteSite, updateSite } = useSites();
  const navigate = useNavigate();

  // State initialization from URL params
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const rangeParam = searchParams.get("range");
    if (rangeParam && ["today", "7d", "30d", "90d"].includes(rangeParam)) {
      return rangeParam as DateRange;
    }
    return "7d";
  });

  const [filters, setFilters] = useState<AnalyticsFilter>(() => {
    const newFilters: AnalyticsFilter = {};
    const country = searchParams.get("country");
    const browser = searchParams.get("browser");
    const os = searchParams.get("os");
    const device = searchParams.get("device");
    const url = searchParams.get("url");

    if (country) newFilters.country = country;
    if (browser) newFilters.browser = browser;
    if (os) newFilters.os = os;
    if (device) newFilters.device = device;
    if (url) newFilters.url = url;

    return newFilters;
  });

  const [showComparison, setShowComparison] = useState(true);

  // Widget visibility - load from localStorage first, then URL params
  const [visibleWidgets, setVisibleWidgets] = useState<Set<string> | null>(() => {
    if (siteId) {
      try {
        const saved = localStorage.getItem(`mmmetric_dashboard_${siteId}`);
        if (saved) {
          const widgets = JSON.parse(saved);
          return new Set(widgets);
        }
      } catch (e) {
        console.warn("Failed to load dashboard config:", e);
      }
    }
    const widgetsParam = searchParams.get("widgets");
    return widgetsParam ? new Set(widgetsParam.split(",")) : null;
  });

  const handleApplyWidgets = (widgets: string[] | null) => {
    if (widgets === null) {
      setVisibleWidgets(null);
    } else {
      setVisibleWidgets(new Set(widgets));
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [breakdown, setBreakdown] = useState<{ dimension: BreakdownDimension; value: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const site = sites.find((s) => s.id === siteId);

  // Analytics hooks
  const { data: stats, isLoading: statsLoading } = useAnalyticsStats({
    siteId: siteId || "",
    dateRange,
    filters
  });
  const { data: timeSeries, isLoading: timeSeriesLoading } = useAnalyticsTimeSeries({
    siteId: siteId || "",
    dateRange,
    filters
  });
  const { data: topPages, isLoading: pagesLoading } = useTopPages({
    siteId: siteId || "",
    dateRange,
    filters
  });
  const { data: topReferrers, isLoading: referrersLoading } = useTopReferrers({
    siteId: siteId || "",
    dateRange,
    filters
  });
  const { data: deviceStats, isLoading: devicesLoading } = useDeviceStats({
    siteId: siteId || "",
    dateRange,
    filters
  });
  const { data: geoStats, isLoading: geoLoading } = useGeoStats({
    siteId: siteId || "",
    dateRange,
    filters
  });
  const { data: cityStats, isLoading: citiesLoading } = useCityStats({
    siteId: siteId || "",
    dateRange,
    filters
  });
  const { data: languageStats, isLoading: languagesLoading } = useLanguageStats({
    siteId: siteId || "",
    dateRange,
    filters
  });
  const { data: utmStats, isLoading: utmLoading } = useUTMStats({
    siteId: siteId || "",
    dateRange,
    filters
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (site) {
      setEditName(site.name);
      setEditDomain(site.domain || "");
    }
  }, [site]);

  const confirmDelete = async () => {
    if (!site) return;
    await deleteSite.mutateAsync(site.id);
    navigate("/dashboard");
  };

  const handleSave = async () => {
    if (!site) return;
    await updateSite.mutateAsync({
      id: site.id,
      name: editName,
      domain: editDomain || undefined,
    });
    setIsEditing(false);
  };

  // Show loading while auth is loading, or while we have a user but sites are still loading
  // Also treat sitesLoading as true when the query hasn't run yet (no user yet)
  const isLoadingSites = sitesLoading || (!!user && sites.length === 0 && !site);

  if (authLoading || (!user && !authLoading)) {
    // Still determining auth state or not logged in
    if (!authLoading && !user) {
      return null; // useEffect will redirect to /auth
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sitesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!site) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-semibold">Site not found</h2>
          <p className="mt-2 text-muted-foreground">This site doesn't exist or you don't have access to it.</p>
          <Button className="mt-6" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SiteHeader
          site={site}
          isEditing={isEditing}
          editName={editName}
          editDomain={editDomain}
          showComparison={showComparison}
          filters={filters}
          dateRange={dateRange}
          isUpdating={updateSite.isPending}
          onNavigateBack={() => navigate("/dashboard")}
          onSetIsEditing={setIsEditing}
          onSetEditName={setEditName}
          onSetEditDomain={setEditDomain}
          onSave={handleSave}
          onToggleComparison={setShowComparison}
          onSetFilters={setFilters}
          onSetDateRange={setDateRange}
          onToggleSettings={() => setShowSettings(!showSettings)}
          onToggleCustomizer={() => setShowCustomizer(true)}
        />

        {showSettings && (
          <SiteSettingsPanel
            site={site}
            onEdit={() => setIsEditing(true)}
            onDelete={() => setDeleteDialogOpen(true)}
            deletePending={deleteSite.isPending}
          />
        )}

        <SiteAnalytics
          site={site}
          dateRange={dateRange}
          filters={filters}
          stats={stats}
          statsLoading={statsLoading}
          timeSeries={timeSeries}
          timeSeriesLoading={timeSeriesLoading}
          topPages={topPages}
          pagesLoading={pagesLoading}
          topReferrers={topReferrers}
          referrersLoading={referrersLoading}
          deviceStats={deviceStats}
          devicesLoading={devicesLoading}
          geoStats={geoStats}
          cityStats={cityStats}
          geoLoading={geoLoading}
          citiesLoading={citiesLoading}
          languageStats={languageStats}
          languagesLoading={languagesLoading}
          utmStats={utmStats}
          utmLoading={utmLoading}
          showComparison={showComparison}
          visibleWidgets={visibleWidgets}
          onBreakdown={(dim, val) => setBreakdown({ dimension: dim, value: val })}
          onCreateGoal={() => setShowGoalSetup(true)}
        />
      </div>

      {showGoalSetup && (
        <GoalSetup
          siteId={site.id}
          onClose={() => setShowGoalSetup(false)}
        />
      )}

      <DashboardCustomizer
        open={showCustomizer}
        onOpenChange={setShowCustomizer}
        currentWidgets={visibleWidgets}
        siteId={siteId}
        onApply={handleApplyWidgets}
      />

      {breakdown && site && (
        <BreakdownPanel
          key={breakdown.dimension}
          siteId={site.id}
          dateRange={dateRange}
          dimension={breakdown.dimension}
          value={breakdown.value}
          baseFilters={filters}
          onClose={() => setBreakdown(null)}
          onDrillDown={(dim, val) => setBreakdown({ dimension: dim, value: val })}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete site?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">"{site.name}"</span>?
              This action cannot be undone. All data associated with this site will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Site
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
