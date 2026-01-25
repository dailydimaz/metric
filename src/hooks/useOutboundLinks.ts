import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "@/hooks/useAnalytics";
import { subDays, startOfDay, endOfDay } from "date-fns";

export interface OutboundLink {
    href: string;
    clicks: number;
    lastClicked: string;
    text?: string;
}

interface UseOutboundLinksProps {
    siteId: string;
    dateRange: DateRange;
}

function getDateRangeFilter(dateRange: DateRange): { start: Date; end: Date } {
    const end = endOfDay(new Date());
    let start: Date;

    switch (dateRange) {
        case "today":
            start = startOfDay(new Date());
            break;
        case "7d":
            start = startOfDay(subDays(new Date(), 7));
            break;
        case "30d":
            start = startOfDay(subDays(new Date(), 30));
            break;
        case "90d":
            start = startOfDay(subDays(new Date(), 90));
            break;
        default:
            start = startOfDay(subDays(new Date(), 7));
    }

    return { start, end };
}

export function useOutboundLinks({ siteId, dateRange }: UseOutboundLinksProps) {
    const { start, end } = getDateRangeFilter(dateRange);

    return useQuery({
        queryKey: ["outbound-links", siteId, dateRange],
        queryFn: async (): Promise<OutboundLink[]> => {
            const { data, error } = await supabase
                .from("events")
                .select("properties, created_at")
                .eq("site_id", siteId)
                .eq("event_name", "outbound")
                .gte("created_at", start.toISOString())
                .lte("created_at", end.toISOString())
                .order("created_at", { ascending: false })
                .limit(1000);

            if (error) throw error;

            // Aggregate by href
            const linkMap = new Map<string, { clicks: number; lastClicked: string; text?: string }>();

            for (const event of data || []) {
                const props = event.properties as { href?: string; text?: string } | null;
                const href = props?.href;
                if (!href) continue;

                const existing = linkMap.get(href);
                if (existing) {
                    existing.clicks += 1;
                    // Keep the most recent click time
                    if (new Date(event.created_at) > new Date(existing.lastClicked)) {
                        existing.lastClicked = event.created_at;
                    }
                } else {
                    linkMap.set(href, {
                        clicks: 1,
                        lastClicked: event.created_at,
                        text: props?.text,
                    });
                }
            }

            // Convert to array and sort by clicks
            return Array.from(linkMap.entries())
                .map(([href, stats]) => ({
                    href,
                    ...stats,
                }))
                .sort((a, b) => b.clicks - a.clicks)
                .slice(0, 10);
        },
        enabled: !!siteId,
    });
}
