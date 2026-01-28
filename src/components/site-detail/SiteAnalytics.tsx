import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    StatsCards,
    VisitorChart,
    TopPages,
    TopReferrers,
    DeviceStats,
    GeoStats,
    LanguageStats,
    UTMStats,
    RealtimeStats,
    RealtimeActivityFeed,
    CustomEvents,
    GoalsCard,
    RetentionCard,
    FunnelList,
    OutboundLinksStats,
    FileDownloadsStats,
    ScrollDepthStats,
    EngagementStats,
    EntryExitStats,
    FormStats,
    TwitterStats,
    HeatmapView
} from "@/components/analytics";
import {
    AnalyticsFilter,
    DateRange,
    StatsData,
    TimeSeriesData,
    TopPage,
    TopReferrer,
    DeviceStat,
    GeoStat,
    CityStat,
    LanguageStat,
    UTMStats as UTMStatsType
} from "@/hooks/useAnalytics";
import { Site } from "@/hooks/useSites";

// Props definition
interface SiteAnalyticsProps {
    site: Site;
    dateRange: DateRange;
    filters: AnalyticsFilter;
    // Data props passed down to avoid re-fetching
    stats: StatsData | undefined;
    statsLoading: boolean;
    timeSeries: TimeSeriesData[] | undefined;
    timeSeriesLoading: boolean;
    topPages: TopPage[] | undefined;
    pagesLoading: boolean;
    topReferrers: TopReferrer[] | undefined;
    referrersLoading: boolean;
    deviceStats: {
        browsers: DeviceStat[];
        operatingSystems: DeviceStat[];
        devices: DeviceStat[];
    } | undefined;
    devicesLoading: boolean;
    geoStats: GeoStat[] | undefined;
    cityStats: CityStat[] | undefined;
    geoLoading: boolean;
    citiesLoading: boolean;
    languageStats: LanguageStat[] | undefined;
    languagesLoading: boolean;
    utmStats: UTMStatsType | undefined;
    utmLoading: boolean;

    // UX State
    showComparison: boolean;
    visibleWidgets: Set<string> | null;

    // Handlers
    onBreakdown: (dimension: any, value: string) => void;
    onCreateGoal: () => void;
}

export function SiteAnalytics({
    site,
    dateRange,
    stats,
    statsLoading,
    timeSeries,
    timeSeriesLoading,
    topPages,
    pagesLoading,
    topReferrers,
    referrersLoading,
    deviceStats,
    devicesLoading,
    geoStats,
    cityStats,
    geoLoading,
    citiesLoading,
    languageStats,
    languagesLoading,
    utmStats,
    utmLoading,
    showComparison,
    visibleWidgets,
    onBreakdown,
    onCreateGoal
}: SiteAnalyticsProps) {

    const shouldShow = (widgetKey: string) => {
        if (!visibleWidgets) return true;
        return visibleWidgets.has(widgetKey);
    };

    return (
        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="twitter">X / Twitter</TabsTrigger>
                <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 animate-fade-in-up">
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
                    {shouldShow('top_pages') && <TopPages pages={topPages} isLoading={pagesLoading} onBreakdown={(url) => onBreakdown('url', url)} />}
                    {shouldShow('top_referrers') && <TopReferrers referrers={topReferrers} isLoading={referrersLoading} onBreakdown={(ref) => onBreakdown('referrer', ref)} />}
                </div>

                {/* Funnels */}
                {shouldShow('funnels') && <FunnelList siteId={site.id} />}

                {/* Goals, Retention & Custom Events */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {shouldShow('goals') && (
                        <GoalsCard
                            siteId={site.id}
                            dateRange={dateRange}
                            onCreateGoal={onCreateGoal}
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
                        onBreakdown={(type, value) => onBreakdown(type, value)}
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
                            onBreakdown={(country) => onBreakdown('country', country)}
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
                {shouldShow('links') && <OutboundLinksStats siteId={site.id} dateRange={dateRange} />}

                {/* File Downloads */}
                {shouldShow('downloads') && <FileDownloadsStats siteId={site.id} dateRange={dateRange} />}

                {/* Scroll Depth */}
                {shouldShow('scroll_depth') && <ScrollDepthStats siteId={site.id} dateRange={dateRange} />}

                {/* Engagement */}
                {shouldShow('engagement') && <EngagementStats siteId={site.id} dateRange={dateRange} />}

                {/* Entry/Exit Pages */}
                {shouldShow('entry_exit') && <EntryExitStats siteId={site.id} dateRange={dateRange} />}

                {/* Form Analytics */}
                {shouldShow('forms') && <FormStats siteId={site.id} dateRange={dateRange} />}
            </TabsContent>

            <TabsContent value="twitter" className="animate-fade-in-up">
                <TwitterStats siteId={site.id} dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="heatmap" className="animate-fade-in-up">
                <HeatmapView siteId={site.id} />
            </TabsContent>
        </Tabs>
    );
}
