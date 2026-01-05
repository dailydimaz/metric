import { ArrowRight, Twitter } from "lucide-react";
import { StatsCards } from "./StatsCards";
import { VisitorChart } from "./VisitorChart";
import { TopPages } from "./TopPages";
import {
    useAnalyticsStats,
    useAnalyticsTimeSeries,
    useTopPages,
    DateRange
} from "@/hooks/useAnalytics";

interface TwitterStatsProps {
    siteId: string;
    dateRange: DateRange;
}

export function TwitterStats({ siteId, dateRange }: TwitterStatsProps) {
    const filters = { referrerPattern: "t.co|twitter.com|x.com" };

    const { data: stats, isLoading: statsLoading } = useAnalyticsStats({
        siteId,
        dateRange,
        filters // Filters for X referrers
    });

    const { data: timeSeries, isLoading: timeSeriesLoading } = useAnalyticsTimeSeries({
        siteId,
        dateRange,
        filters
    });

    const { data: topPages, isLoading: pagesLoading } = useTopPages({
        siteId,
        dateRange,
        filters
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-black/5 dark:bg-white/10 rounded-xl">
                        <Twitter className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">X (Twitter) Analytics</h2>
                        <p className="text-sm text-muted-foreground">Traffic from X, Twitter, and t.co</p>
                    </div>
                </div>
                <a
                    href={`https://twitter.com/search?q=${encodeURIComponent('min-faves:0 filter:links')}&src=typed_query&f=live`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline gap-2"
                >
                    Search Mentions
                    <ArrowRight className="h-4 w-4" />
                </a>
            </div>

            <StatsCards stats={stats} isLoading={statsLoading} />

            <VisitorChart data={timeSeries} isLoading={timeSeriesLoading} />

            <div className="grid gap-6 md:grid-cols-2">
                <TopPages pages={topPages} isLoading={pagesLoading} />

                {/* Helper Card */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body">
                        <h3 className="card-title text-base">Growth Tips</h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-base-content/70 mt-2">
                            <li>Engage with users who share your links.</li>
                            <li>Use <strong>#hashtags</strong> relevant to your niche.</li>
                            <li>Post content during peak hours (check the time chart).</li>
                            <li>Replying to viral tweets can drive traffic.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
