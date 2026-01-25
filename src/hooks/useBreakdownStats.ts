import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnalyticsFilter, DateRange, getDateRangeFilter } from "./useAnalytics";

export type BreakdownDimension = "country" | "browser" | "os" | "device" | "url" | "referrer";

interface BreakdownItem {
  value: string;
  visitors: number;
  pageviews: number;
  percentage: number;
}

interface BreakdownStats {
  uniqueVisitors: number;
  totalPageviews: number;
  bounceRate: number;
  breakdown: BreakdownItem[];
}

interface UseBreakdownStatsParams {
  siteId: string;
  dateRange: DateRange;
  filters: AnalyticsFilter;
  breakdownBy: BreakdownDimension;
}

function filtersToJsonb(filters?: AnalyticsFilter): Record<string, string> | null {
  if (!filters || Object.keys(filters).length === 0) return null;
  
  const result: Record<string, string> = {};
  if (filters.country) result.country = filters.country;
  if (filters.browser) result.browser = filters.browser;
  if (filters.os) result.os = filters.os;
  if (filters.device) result.device = filters.device;
  if (filters.url) result.url = filters.url;
  if (filters.referrerPattern) result.referrer = filters.referrerPattern;
  
  return Object.keys(result).length > 0 ? result : null;
}

export function useBreakdownStats({
  siteId,
  dateRange,
  filters,
  breakdownBy,
}: UseBreakdownStatsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["breakdown-stats", siteId, dateRange, JSON.stringify(filters), breakdownBy],
    queryFn: async (): Promise<BreakdownStats> => {
      // Get summary stats with filters applied
      const { data: statsData, error: statsError } = await (supabase.rpc as any)(
        "get_site_stats",
        {
          _site_id: siteId,
          _start_date: start.toISOString(),
          _end_date: end.toISOString(),
          _prev_start_date: start.toISOString(),
          _prev_end_date: end.toISOString(),
          _filters: jsonbFilters || {},
        }
      );

      if (statsError) {
        console.error("Error fetching site stats for breakdown:", statsError);
        throw statsError;
      }

      const stats = statsData?.[0] || {};

      // Get breakdown data based on dimension
      let breakdownData: BreakdownItem[] = [];

      try {
        if (breakdownBy === "country") {
          const { data, error } = await (supabase.rpc as any)("get_geo_stats", {
            _site_id: siteId,
            _start_date: start.toISOString(),
            _end_date: end.toISOString(),
            _limit: 20,
            _filters: jsonbFilters || {},
          });
          if (error) {
            console.error("Error fetching geo breakdown:", error);
          } else if (data) {
            breakdownData = data.map((item: any) => ({
              value: item.country,
              visitors: item.visits || 0,
              pageviews: item.visits || 0,
              percentage: item.percentage || 0,
            }));
          }
        } else if (breakdownBy === "browser" || breakdownBy === "os" || breakdownBy === "device") {
          const { data, error } = await (supabase.rpc as any)("get_device_stats", {
            _site_id: siteId,
            _start_date: start.toISOString(),
            _end_date: end.toISOString(),
            _filters: jsonbFilters || {},
          });
          if (error) {
            console.error("Error fetching device breakdown:", error);
          } else if (data) {
            const key = breakdownBy === "browser" ? "browsers" : 
                        breakdownBy === "os" ? "operatingSystems" : "devices";
            const items = data[key] || [];
            breakdownData = items.map((item: any) => ({
              value: item.name || "(unknown)",
              visitors: item.value || 0,
              pageviews: item.value || 0,
              percentage: item.percentage || 0,
            }));
          }
        } else if (breakdownBy === "url") {
          const { data, error } = await (supabase.rpc as any)("get_top_pages", {
            _site_id: siteId,
            _start_date: start.toISOString(),
            _end_date: end.toISOString(),
            _limit: 20,
            _filters: jsonbFilters || {},
          });
          if (error) {
            console.error("Error fetching pages breakdown:", error);
          } else if (data) {
            const total = data.reduce((sum: number, p: any) => sum + (p.pageviews || 0), 0);
            breakdownData = data.map((item: any) => ({
              value: item.url || "(unknown)",
              visitors: item.unique_visitors || 0,
              pageviews: item.pageviews || 0,
              percentage: total > 0 ? ((item.pageviews || 0) / total) * 100 : 0,
            }));
          }
        } else if (breakdownBy === "referrer") {
          const { data, error } = await (supabase.rpc as any)("get_top_referrers", {
            _site_id: siteId,
            _start_date: start.toISOString(),
            _end_date: end.toISOString(),
            _limit: 20,
            _filters: jsonbFilters || {},
          });
          if (error) {
            console.error("Error fetching referrer breakdown:", error);
          } else if (data) {
            breakdownData = data.map((item: any) => ({
              value: item.referrer || "Direct / None",
              visitors: item.visits || 0,
              pageviews: item.visits || 0,
              percentage: item.percentage || 0,
            }));
          }
        }
      } catch (err) {
        console.error("Error in breakdown query:", err);
      }

      return {
        uniqueVisitors: stats.unique_visitors || 0,
        totalPageviews: stats.total_pageviews || 0,
        bounceRate: stats.bounce_rate || 0,
        breakdown: breakdownData,
      };
    },
    enabled: !!siteId,
    retry: 2,
    staleTime: 30000,
  });
}