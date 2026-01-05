import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "@/hooks/useAnalytics";
import { useSubscription } from "@/hooks/useSubscription";

export interface CohortData {
  cohort_date: string;
  cohort_size: number;
  retention: {
    day: number;
    retained: number;
    rate: number;
  }[];
}

export interface RetentionSummary {
  day: number;
  average_rate: number;
}

export interface RetentionTrendData {
  day: number;
  retained: number;
  rate: number;
}

const getDateRangeFilter = (dateRange: DateRange) => {
  const now = new Date();
  let startDate: Date;

  switch (dateRange) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate: now };
};

export function useRetentionCohorts(siteId: string | undefined, dateRange: DateRange = "30d") {
  const { plan } = useSubscription();

  return useQuery({
    queryKey: ["retention-cohorts", siteId, dateRange, plan.retentionDays],
    queryFn: async (): Promise<{ cohorts: CohortData[]; summary: RetentionSummary[] } | null> => {
      if (!siteId) return null;

      const { startDate: requestedStartDate, endDate } = getDateRangeFilter(dateRange);
      let startDate = requestedStartDate;

      // Enforce retention limit based on plan
      if (plan.retentionDays > 0) {
        const minStartDate = new Date(Date.now() - plan.retentionDays * 24 * 60 * 60 * 1000);
        if (startDate < minStartDate) {
          startDate = minStartDate;
        }
      }

      // Call the server-side RPC for efficient aggregation
      const { data, error } = await supabase.rpc("get_retention_cohorts", {
        _site_id: siteId,
        _start_date: startDate.toISOString(),
        _end_date: endDate.toISOString(),
      });

      if (error) throw error;

      if (!data) {
        return { cohorts: [], summary: [] };
      }

      // Parse the JSONB response - need to cast through unknown first
      const result = data as unknown as { cohorts: CohortData[]; summary: { day: number; average_rate: number }[] };
      
      return {
        cohorts: result.cohorts || [],
        summary: (result.summary || []).map(s => ({
          day: s.day,
          average_rate: Number(s.average_rate) || 0,
        })),
      };
    },
    enabled: !!siteId,
  });
}

export function useRetentionTrend(siteId: string | undefined, dateRange: DateRange = "30d") {
  const { plan } = useSubscription();

  return useQuery({
    queryKey: ["retention-trend", siteId, dateRange, plan.retentionDays],
    queryFn: async (): Promise<RetentionTrendData[] | null> => {
      if (!siteId) return null;

      const { startDate: requestedStartDate, endDate } = getDateRangeFilter(dateRange);
      let startDate = requestedStartDate;

      // Enforce retention limit based on plan
      if (plan.retentionDays > 0) {
        const minStartDate = new Date(Date.now() - plan.retentionDays * 24 * 60 * 60 * 1000);
        if (startDate < minStartDate) {
          startDate = minStartDate;
        }
      }

      // Call the server-side RPC for efficient aggregation
      const { data, error } = await supabase.rpc("get_retention_trend", {
        _site_id: siteId,
        _start_date: startDate.toISOString(),
        _end_date: endDate.toISOString(),
      });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Transform the response to ensure proper types
      return data.map((row: { day: number; retained: number; rate: number }) => ({
        day: Number(row.day),
        retained: Number(row.retained),
        rate: Number(row.rate),
      }));
    },
    enabled: !!siteId,
  });
}
