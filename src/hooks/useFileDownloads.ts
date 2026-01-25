import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "@/hooks/useAnalytics";

export interface FileDownload {
    filename: string;
    extension: string;
    href: string;
    count: number;
}

interface UseFileDownloadsProps {
    siteId: string;
    dateRange: DateRange;
}

export function useFileDownloads({ siteId, dateRange }: UseFileDownloadsProps) {
    const { start, end } = getDateRangeFilter(dateRange);

    return useQuery({
        queryKey: ["file-downloads", siteId, dateRange],
        queryFn: async (): Promise<FileDownload[]> => {
            const { data, error } = await supabase
                .from("events")
                .select("properties, created_at")
                .eq("site_id", siteId)
                .eq("event_name", "file_download")
                .gte("created_at", start.toISOString())
                .lte("created_at", end.toISOString());

            if (error) throw error;

            // Group by filename
            const downloads = new Map<string, FileDownload>();

            data?.forEach((event) => {
                const props = event.properties as any;
                const key = props.filename || 'unknown';

                if (downloads.has(key)) {
                    downloads.get(key)!.count += 1;
                } else {
                    downloads.set(key, {
                        filename: key,
                        extension: props.extension || 'unknown',
                        href: props.href || '#',
                        count: 1
                    });
                }
            });

            return Array.from(downloads.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
        },
        enabled: !!siteId,
    });
}
