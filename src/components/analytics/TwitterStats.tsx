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
import { Button } from "@/components/ui/button";

interface TwitterStatsProps {
    siteId: string;
    dateRange: DateRange;
}

export function TwitterStats({ siteId, dateRange }: TwitterStatsProps) {
    // Filter for X/Twitter referrers
    const filters = { referrerPattern: "t.co|twitter.com|x.com" };

    const { data: stats, isLoading: statsLoading } = useAnalyticsStats({
        siteId,
        dateRange,
        filters
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
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-muted rounded-xl">
                        <Twitter className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">X (Twitter) Analytics</h2>
                        <p className="text-sm text-muted-foreground">Traffic from X, Twitter, and t.co</p>
                    </div>
                </div>
                <Button variant="outline" asChild>
                    <a
                        href={`https://twitter.com/search?q=${encodeURIComponent('min-faves:0 filter:links')}&src=typed_query&f=live`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2"
                    >
                        Search Mentions
                        <ArrowRight className="h-4 w-4" />
                    </a>
                </Button>
            </div>

            <StatsCards stats={stats} isLoading={statsLoading} />

            <VisitorChart data={timeSeries} isLoading={timeSeriesLoading} />

            <div className="grid gap-6 md:grid-cols-2">
                <TopPages pages={topPages} isLoading={pagesLoading} />

                {/* Helper Card */}
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">Growth Tips</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Engage with users who share your links.</li>
                        <li>Use <strong className="text-foreground">#hashtags</strong> relevant to your niche.</li>
                        <li>Post content during peak hours (check the time chart).</li>
                        <li>Replying to viral tweets can drive traffic.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
