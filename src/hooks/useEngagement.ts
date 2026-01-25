import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "@/hooks/useAnalytics";

export interface EngagementData {
    url: string;
    avgDuration: number;
    totalDuration: number;
    visits: number;
}

interface UseEngagementProps {
    siteId: string;
    dateRange: DateRange;
}

export function useEngagement({ siteId, dateRange }: UseEngagementProps) {
    const { start, end } = getDateRangeFilter(dateRange);

    return useQuery({
        queryKey: ["engagement", siteId, dateRange],
        queryFn: async (): Promise<EngagementData[]> => {
            const { data, error } = await supabase
                .from("events")
                .select("properties, url")
                .eq("site_id", siteId)
                .eq("event_name", "engagement")
                .gte("created_at", start.toISOString())
                .lte("created_at", end.toISOString());

            if (error) throw error;

            // Group by URL
            const pages = new Map<string, { totalDuration: number; visits: number }>();

            data?.forEach((event) => {
                const url = event.url || '/';
                const props = event.properties as any;
                const duration = Number(props.duration_seconds) || 0;

                if (duration > 0) {
                    if (!pages.has(url)) {
                        pages.set(url, { totalDuration: 0, visits: 0 });
                    }
                    const stats = pages.get(url)!;
                    stats.totalDuration += duration;
                    stats.visits += 1;
                }
            });

            return Array.from(pages.entries())
                .map(([url, stats]) => ({
                    url,
                    avgDuration: stats.visits > 0 ? stats.totalDuration / stats.visits : 0,
                    totalDuration: stats.totalDuration,
                    visits: stats.visits
                }))
                .sort((a, b) => b.avgDuration - a.avgDuration)
                .slice(0, 5);
        },
        enabled: !!siteId,
    });
}
