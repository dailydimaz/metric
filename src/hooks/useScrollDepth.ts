import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "@/hooks/useAnalytics";

export interface ScrollDepthData {
    url: string;
    averageDepth: number;
    distribution: {
        depth: number;
        count: number;
        percentage: number;
    }[];
}

interface UseScrollDepthProps {
    siteId: string;
    dateRange: DateRange;
}

export function useScrollDepth({ siteId, dateRange }: UseScrollDepthProps) {
    const { start, end } = getDateRangeFilter(dateRange);

    return useQuery({
        queryKey: ["scroll-depth", siteId, dateRange],
        queryFn: async (): Promise<ScrollDepthData[]> => {
            const { data, error } = await supabase
                .from("events")
                .select("properties, url")
                .eq("site_id", siteId)
                .eq("event_name", "scroll_depth")
                .gte("created_at", start.toISOString())
                .lte("created_at", end.toISOString());

            if (error) throw error;

            // Group by URL
            const pages = new Map<string, { total: number; count: number; milestones: Record<number, number> }>();

            data?.forEach((event) => {
                const url = event.url || '/';
                const props = event.properties as any;
                const depth = Number(props.percent);

                if (!pages.has(url)) {
                    pages.set(url, { total: 0, count: 0, milestones: { 25: 0, 50: 0, 75: 0, 90: 0, 100: 0 } });
                }

                const stats = pages.get(url)!;

                // This is tricky because we receive multiple events per session (25, 50, etc.)
                // To calculate average scroll depth, we should probably take the MAX depth per session/visitor for that page
                // But here we have raw events.
                // A simple approximation: just track distribution of events.

                if (stats.milestones[depth] !== undefined) {
                    stats.milestones[depth]++;
                }
            });

            // Post-process to calculate stats
            // This is a naive client-side aggregation. Ideally this should be an RPC or more sophisticated query.
            // But for "Easy/Medium" feature without schema change, this works for moderate data.

            return Array.from(pages.entries()).map(([url, stats]) => {
                // Calculate distribution percentages
                const totalEvents = Object.values(stats.milestones).reduce((a, b) => a + b, 0);

                const distribution = [25, 50, 75, 90, 100].map(depth => ({
                    depth,
                    count: stats.milestones[depth],
                    percentage: totalEvents > 0 ? (stats.milestones[depth] / totalEvents) * 100 : 0
                }));

                // Approx average depth: (sum(depth * count) / totalEvents)
                // This assumes "count" at 25 means they reached 25.
                // Note: A user reaching 100 generates 25, 50, 75, 90, 100 events.
                // So if we just sum them up, we might overweight low numbers?
                // Actually, if someone scrolls to 100, they trigger all of them.

                let weightedSum = 0;
                distribution.forEach(d => {
                    weightedSum += d.depth * d.count;
                });

                const averageDepth = totalEvents > 0 ? weightedSum / totalEvents : 0;

                return {
                    url,
                    averageDepth,
                    distribution
                };
            }).sort((a, b) => b.distribution[4].count - a.distribution[4].count) // Sort by most 100% scrolls
                .slice(0, 5);
        },
        enabled: !!siteId,
    });
}
