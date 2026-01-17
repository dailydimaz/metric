import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  ArrowLeft,
  Globe,
  Clock,
  Copy,
  Check,
  Trash2,
  Settings,
  Code,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  StatsCards,
  VisitorChart,
  TopPages,
  TopReferrers,
  DeviceStats,
  GeoStats,
  LanguageStats,
  UTMStats,
  DateRangePicker,
  RealtimeStats,
  RealtimeActivityFeed,
  CustomEvents,
  ExportButton,
  GoalsCard,
  GoalSetup,
  FunnelList,
  RetentionCard,
  FilterBar,
  TwitterStats,
  LinksStats,
  BreakdownPanel,
  BreakdownDimension,
} from "@/components/analytics";
import { DashboardCustomizer } from "@/components/dashboard/DashboardCustomizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

export default function SiteDetail() {
  const { siteId } = useParams<{ siteId: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { sites, isLoading: sitesLoading, deleteSite, updateSite } = useSites();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    // First check localStorage for saved preferences
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
    // Fall back to URL params
    const widgetsParam = searchParams.get("widgets");
    return widgetsParam ? new Set(widgetsParam.split(",")) : null;
  });

  const shouldShow = (widgetKey: string) => {
    if (!visibleWidgets) return true;
    return visibleWidgets.has(widgetKey);
  };

  const handleApplyWidgets = (widgets: string[] | null) => {
    if (widgets === null) {
      setVisibleWidgets(null);
    } else {
      setVisibleWidgets(new Set(widgets));
    }
  };

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [breakdown, setBreakdown] = useState<{ dimension: BreakdownDimension; value: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const site = sites.find((s) => s.id === siteId);

  // Analytics hooks - all hooks now support server-side filtering via RPCs
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

  const copyTrackingId = async () => {
    if (!site) return;
    await navigator.clipboard.writeText(site.tracking_id);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Tracking ID copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyScript = async () => {
    if (!site) return;
    // Always use mmmetric's hosted script URL
    const script = `<script defer src="https://mmmetric.lovable.app/track.js" data-site="${site.tracking_id}"></script>`;
    await navigator.clipboard.writeText(script);
    toast({
      title: "Copied!",
      description: "Add this script to your website's <head> tag to start tracking.",
    });
  };

  const confirmDelete = async () => {
    if (!site) return;
    await deleteSite.mutateAsync(site.id);
    navigate("/dashboard");
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
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

  const testConnection = async () => {
    if (!site) return;
    setTestStatus('testing');

    try {
      // Send a test event directly to the track edge function
      const response = await supabase.functions.invoke('track', {
        body: {
          site_id: site.tracking_id,
          event_name: 'test_connection',
          url: '/test',
          session_id: 'test_' + Date.now(),
          properties: { test: true }
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Wait a moment and check if the event was recorded
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: events, error: queryError } = await supabase
        .from('events')
        .select('id')
        .eq('site_id', site.id)
        .eq('event_name', 'test_connection')
        .order('created_at', { ascending: false })
        .limit(1);

      if (queryError) throw queryError;

      if (events && events.length > 0) {
        setTestStatus('success');
        toast({
          title: "Connection verified!",
          description: "Test event was successfully received and recorded.",
        });
      } else {
        throw new Error('Event not found in database');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setTestStatus('error');
      toast({
        title: "Connection failed",
        description: "Could not verify tracking. Check your configuration.",
        variant: "destructive",
      });
    }

    // Reset status after 5 seconds
    setTimeout(() => setTestStatus('idle'), 5000);
  };

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

  if (!site) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-semibold">Site not found</h2>
          <p className="mt-2 text-base-content/70">This site doesn't exist or you don't have access to it.</p>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 shrink-0"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    className="text-2xl font-bold w-full max-w-xs h-auto py-1 px-2"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                </div>
              ) : (
                <h1 className="text-2xl font-bold tracking-tight truncate">{site.name}</h1>
              )}
              <div className="text-base-content/70 flex items-center gap-2 mt-1">
                <Globe className="h-4 w-4 shrink-0" />
                {isEditing ? (
                  <Input
                    type="text"
                    className="h-7 text-sm py-1 px-2 w-[200px]"
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    placeholder="example.com"
                  />
                ) : (
                  <span className="truncate">{site.domain || "No domain set"}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0">
            <ExportButton siteId={site.id} siteName={site.name} dateRange={dateRange} />
            <div className="flex items-center space-x-2 px-2">
              <Switch id="comparison-mode" checked={showComparison} onCheckedChange={setShowComparison} />
              <Label htmlFor="comparison-mode" className="text-sm font-medium cursor-pointer text-base-content/70 hidden md:block">Compare</Label>
            </div>
            <FilterBar filters={filters} onFilterChange={setFilters} siteId={siteId} />
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateSite.isPending}
                >
                  {updateSite.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setShowCustomizer(true)}>
                  Customize
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Settings Panel (collapsible) */}
        {showSettings && (
          <div className="card bg-muted/30 border border-border animate-in fade-in slide-in-from-top-2">
            <div className="card-body p-6">
              <div className="flex items-center justify-between">
                <h3 className="card-title text-base font-semibold">Site Settings</h3>
                <div className="flex gap-2">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50"
                      onClick={handleDelete}
                      disabled={deleteSite.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>

              {/* Site Info Cards */}
              <div className="grid gap-4 md:grid-cols-3 mt-4">
                {/* Tracking ID */}
                <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Tracking ID</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 font-mono text-sm bg-muted/50 px-3 py-2 rounded-lg truncate text-foreground">
                      {site.tracking_id}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={copyTrackingId}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Timezone */}
                <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Timezone</h4>
                  <div className="flex items-center gap-2 mt-2 text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{site.timezone || "UTC"}</span>
                  </div>
                </div>

                {/* Created */}
                <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                  <span className="mt-2 block text-foreground">
                    {new Date(site.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Installation */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Installation</h4>
                </div>
                <p className="text-muted-foreground text-sm">
                  Add this script to your website's <code className="bg-muted px-1 rounded">&lt;head&gt;</code> tag:
                </p>
                <div className="mt-2 rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto border border-border text-foreground">
                  <pre><code>{`<script defer src="https://mmmetric.lovable.app/track.js" data-site="${site.tracking_id}"></script>`}</code></pre>
                </div>

                {/* Cross-Domain Tracking */}
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/30">
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Cross-Domain Tracking (optional)</h5>
                  <p className="text-xs text-muted-foreground/80 mb-2">
                    To track users across multiple domains, add the <code className="bg-muted px-1 rounded">data-cross-domain</code> attribute:
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto text-foreground">
                    data-cross-domain="otherdomain.com,anotherdomain.com"
                  </code>
                </div>

                <p className="text-muted-foreground/60 text-xs mt-2">
                  This lightweight script (~1KB) tracks page views, custom events, and UTM parameters while respecting user privacy.
                </p>
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    size="sm"
                    variant={testStatus === 'success' ? 'default' : testStatus === 'error' ? 'destructive' : 'outline'}
                    className={testStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={testConnection}
                    disabled={testStatus === 'testing'}
                  >
                    {testStatus === 'testing' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : testStatus === 'success' ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Connected!
                      </>
                    ) : testStatus === 'error' ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Failed
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  <Button size="sm" onClick={copyScript}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Script
                  </Button>
                </div>
              </div>

              {/* Tracking Pixel */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Tracking Pixel</h4>
                </div>
                <p className="text-muted-foreground text-sm">
                  Use this 1x1 image for tracking in emails or non-JS environments:
                </p>
                <div className="mt-2 rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto border border-border text-foreground">
                  <pre><code>{`<img src="${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pixel?site_id=${site.tracking_id}" alt="" />`}</code></pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="twitter">X / Twitter</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Real-time Section */}
            {shouldShow('realtime') && (
              <div className="grid gap-6 lg:grid-cols-2">
                <RealtimeStats siteId={site.id} />
                <RealtimeActivityFeed siteId={site.id} />
              </div>
            )}

            {/* Stats Overview */}
            {(shouldShow('visitors') || shouldShow('pageviews') || shouldShow('bounce_rate') || shouldShow('avg_duration')) && (
              <StatsCards
                stats={stats}
                isLoading={statsLoading}
                visibleMetrics={visibleWidgets ? Array.from(visibleWidgets) : undefined}
                showComparison={showComparison}
              />
            )}

            {/* Visitor Chart */}
            {shouldShow('visitor_chart') && (
              <VisitorChart data={timeSeries} isLoading={timeSeriesLoading} showComparison={showComparison} />
            )}

            {/* Two Column Layout */}
            <div className="grid gap-6 lg:grid-cols-2">
              {shouldShow('top_pages') && <TopPages pages={topPages} isLoading={pagesLoading} onBreakdown={(url) => setBreakdown({ dimension: 'url', value: url })} />}
              {shouldShow('top_referrers') && <TopReferrers referrers={topReferrers} isLoading={referrersLoading} onBreakdown={(ref) => setBreakdown({ dimension: 'referrer', value: ref })} />}
            </div>

            {/* Funnels */}
            {shouldShow('funnels') && <FunnelList siteId={site.id} />}

            {/* Goals, Retention & Custom Events */}
            <div className="grid gap-6 lg:grid-cols-3">
              {shouldShow('goals') && (
                <GoalsCard
                  siteId={site.id}
                  dateRange={dateRange}
                  onCreateGoal={() => setShowGoalSetup(true)}
                />
              )}
              {shouldShow('retention') && <RetentionCard siteId={site.id} dateRange={dateRange} />}
              {shouldShow('custom_events') && <CustomEvents siteId={site.id} dateRange={dateRange} />}
            </div>

            {/* Device Stats */}
            {shouldShow('device_stats') && (
              <DeviceStats
                browsers={deviceStats?.browsers}
                operatingSystems={deviceStats?.operatingSystems}
                devices={deviceStats?.devices}
                isLoading={devicesLoading}
                onBreakdown={(type, value) => setBreakdown({ dimension: type, value })}
              />
            )}

            {/* UTM Campaign Stats */}
            {shouldShow('utm_campaigns') && <UTMStats utmStats={utmStats} isLoading={utmLoading} />}

            {/* Geo & Language Stats */}
            <div className="grid gap-6 lg:grid-cols-2">
              {shouldShow('geo_stats') && (
                <GeoStats
                  countries={geoStats}
                  cities={cityStats}
                  isLoading={geoLoading || citiesLoading}
                  onBreakdown={(country) => setBreakdown({ dimension: 'country', value: country })}
                />
              )}
              {shouldShow('language_stats') && (
                <LanguageStats
                  languages={languageStats}
                  isLoading={languagesLoading}
                />
              )}
            </div>

            {/* Outbound Links */}
            {shouldShow('links') && <LinksStats siteId={site.id} dateRange={dateRange} />}
          </TabsContent>

          <TabsContent value="twitter">
            <TwitterStats siteId={site.id} dateRange={dateRange} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Goal Setup Modal */}
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

      {/* Breakdown Panel */}
      {breakdown && site && (
        <BreakdownPanel
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
