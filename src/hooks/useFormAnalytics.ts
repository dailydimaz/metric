import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "@/hooks/useAnalytics";

export interface FormStats {
    formId: string;
    views: number; // starts
    submissions: number;
    conversionRate: number;
}

interface UseFormAnalyticsProps {
    siteId: string;
    dateRange: DateRange;
}

export function useFormAnalytics({ siteId, dateRange }: UseFormAnalyticsProps) {
    const { start, end } = getDateRangeFilter(dateRange);

    return useQuery({
        queryKey: ["form-analytics", siteId, dateRange],
        queryFn: async (): Promise<FormStats[]> => {
            const { data, error } = await supabase
                .from("events")
                .select("event_name, properties")
                .eq("site_id", siteId)
                .in("event_name", ["form_start", "form_submit"])
                .gte("created_at", start.toISOString())
                .lte("created_at", end.toISOString());

            if (error) throw error;

            // Aggregation
            const forms = new Map<string, { starts: number; submissions: number }>();

            data?.forEach(event => {
                const props = event.properties as any;
                const formId = props.form_id || 'unknown-form';

                if (!forms.has(formId)) {
                    forms.set(formId, { starts: 0, submissions: 0 });
                }

                const stats = forms.get(formId)!;
                if (event.event_name === 'form_start') {
                    stats.starts++;
                } else if (event.event_name === 'form_submit') {
                    stats.submissions++;
                }
            });

            return Array.from(forms.entries()).map(([formId, stats]) => ({
                formId,
                views: stats.starts,
                submissions: stats.submissions,
                conversionRate: stats.starts > 0 ? (stats.submissions / stats.starts) * 100 : 0
            })).sort((a, b) => b.submissions - a.submissions);
        },
        enabled: !!siteId,
    });
}
