import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "@/hooks/useAnalytics";

export interface EntryExitPage {
    url: string;
    entryCount: number;
    exitCount: number;
}

interface UseEntryExitPagesProps {
    siteId: string;
    dateRange: DateRange;
}

export function useEntryExitPages({ siteId, dateRange }: UseEntryExitPagesProps) {
    const { start, end } = getDateRangeFilter(dateRange);

    return useQuery({
        queryKey: ["entry-exit-pages", siteId, dateRange],
        queryFn: async (): Promise<EntryExitPage[]> => {
            // Note: This requires the get_entry_exit_pages RPC function to be applied to the database
            const { data, error } = await (supabase.rpc as any)('get_entry_exit_pages', {
                _site_id: siteId,
                _start_date: start.toISOString(),
                _end_date: end.toISOString(),
                _limit: 10
            });

            if (error) {
                console.error("Error fetching entry/exit pages:", error);
                // Fallback or empty if RPC doesn't exist yet
                return [];
            }

            return (data || []).map((row: any) => ({
                url: row.url,
                entryCount: Number(row.entry_count) || 0,
                exitCount: Number(row.exit_count) || 0
            }));
        },
        enabled: !!siteId,
    });
}
