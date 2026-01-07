import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange, AnalyticsFilter, StatsData, TimeSeriesData, TopPage, TopReferrer } from "./useAnalytics";

interface FilteredAnalyticsParams {
  siteId: string;
  dateRange: DateRange;
  filters?: AnalyticsFilter;
}

function getDateRangeFilter(dateRange: DateRange): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
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

  const periodLength = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const prevStart = subDays(start, periodLength);
  const prevEnd = subDays(end, periodLength);

  return { start, end, prevStart, prevEnd };
}

// Filter events client-side when filters are applied
function applyFilters(events: any[], filters?: AnalyticsFilter): any[] {
  if (!filters || Object.keys(filters).length === 0) return events;

  return events.filter((event) => {
    if (filters.country && event.country !== filters.country) return false;
    if (filters.browser && event.browser !== filters.browser) return false;
    if (filters.os && event.os !== filters.os) return false;
    if (filters.device && event.device_type !== filters.device) return false;
    if (filters.url && !event.url?.includes(filters.url)) return false;
    if (filters.referrerPattern) {
      const patterns = filters.referrerPattern.split("|");
      const referrer = event.referrer || "";
      if (!patterns.some((p) => referrer.includes(p))) return false;
    }
    return true;
  });
}

// Filtered stats hook - fetches raw events and computes stats with filters
export function useFilteredStats({ siteId, dateRange, filters }: FilteredAnalyticsParams) {
  const { start, end, prevStart, prevEnd } = getDateRangeFilter(dateRange);
  const hasFilters = filters && Object.keys(filters).length > 0;

  return useQuery({
    queryKey: ["filtered-stats", siteId, dateRange, filters],
    queryFn: async (): Promise<StatsData> => {
      if (!hasFilters) {
        // Use RPC for unfiltered data (more efficient)
        const { data, error } = await supabase.rpc("get_site_stats", {
          _site_id: siteId,
          _start_date: start.toISOString(),
          _end_date: end.toISOString(),
          _prev_start_date: prevStart.toISOString(),
          _prev_end_date: prevEnd.toISOString(),
        });

        if (error) throw error;

        const result = data?.[0] as {
          total_pageviews?: number;
          unique_visitors?: number;
          bounce_rate?: number;
          pageviews_change?: number;
          visitors_change?: number;
        } | null;
        
        return {
          totalPageviews: Number(result?.total_pageviews) || 0,
          uniqueVisitors: Number(result?.unique_visitors) || 0,
          avgSessionDuration: 0,
          bounceRate: Number(result?.bounce_rate) || 0,
          pageviewsChange: Number(result?.pageviews_change) || 0,
          visitorsChange: Number(result?.visitors_change) || 0,
        };
      }

      // Fetch raw events for filtering
      const { data: currentEvents, error: currentError } = await supabase
        .from("events")
        .select("*")
        .eq("site_id", siteId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (currentError) throw currentError;

      const { data: prevEvents, error: prevError } = await supabase
        .from("events")
        .select("*")
        .eq("site_id", siteId)
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());

      if (prevError) throw prevError;

      const filteredCurrent = applyFilters(currentEvents || [], filters);
      const filteredPrev = applyFilters(prevEvents || [], filters);

      const currentPageviews = filteredCurrent.filter((e) => e.event_name === "pageview").length;
      const prevPageviews = filteredPrev.filter((e) => e.event_name === "pageview").length;

      const currentVisitors = new Set(filteredCurrent.map((e) => e.visitor_id)).size;
      const prevVisitors = new Set(filteredPrev.map((e) => e.visitor_id)).size;

      const pageviewsChange = prevPageviews > 0
        ? ((currentPageviews - prevPageviews) / prevPageviews) * 100
        : currentPageviews > 0 ? 100 : 0;

      const visitorsChange = prevVisitors > 0
        ? ((currentVisitors - prevVisitors) / prevVisitors) * 100
        : currentVisitors > 0 ? 100 : 0;

      // Calculate bounce rate (sessions with only 1 pageview)
      const sessionCounts: Record<string, number> = {};
      filteredCurrent.forEach((e) => {
        if (e.session_id && e.event_name === "pageview") {
          sessionCounts[e.session_id] = (sessionCounts[e.session_id] || 0) + 1;
        }
      });
      const totalSessions = Object.keys(sessionCounts).length;
      const bouncedSessions = Object.values(sessionCounts).filter((c) => c === 1).length;
      const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

      return {
        totalPageviews: currentPageviews,
        uniqueVisitors: currentVisitors,
        avgSessionDuration: 0,
        bounceRate,
        pageviewsChange,
        visitorsChange,
      };
    },
    enabled: !!siteId,
  });
}

// Filtered time series hook
export function useFilteredTimeSeries({ siteId, dateRange, filters }: FilteredAnalyticsParams) {
  const { start, end, prevStart, prevEnd } = getDateRangeFilter(dateRange);
  const hasFilters = filters && Object.keys(filters).length > 0;

  return useQuery({
    queryKey: ["filtered-timeseries", siteId, dateRange, filters],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      if (!hasFilters) {
        const { data, error } = await supabase.rpc("get_timeseries_stats", {
          _site_id: siteId,
          _start_date: start.toISOString(),
          _end_date: end.toISOString(),
          _prev_start_date: prevStart.toISOString(),
          _prev_end_date: prevEnd.toISOString(),
        });

        if (error) throw error;

        return (data || []).map((row: any) => ({
          date: row.date,
          pageviews: Number(row.pageviews) || 0,
          visitors: Number(row.visitors) || 0,
          prevPageviews: Number(row.prev_pageviews) || 0,
          prevVisitors: Number(row.prev_visitors) || 0,
        }));
      }

      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("site_id", siteId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (error) throw error;

      const filtered = applyFilters(events || [], filters);

      // Group by date
      const dateMap: Record<string, { pageviews: number; visitors: Set<string> }> = {};
      filtered.forEach((event) => {
        const date = event.created_at.split("T")[0];
        if (!dateMap[date]) {
          dateMap[date] = { pageviews: 0, visitors: new Set() };
        }
        if (event.event_name === "pageview") {
          dateMap[date].pageviews++;
        }
        if (event.visitor_id) {
          dateMap[date].visitors.add(event.visitor_id);
        }
      });

      return Object.entries(dateMap)
        .map(([date, data]) => ({
          date,
          pageviews: data.pageviews,
          visitors: data.visitors.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!siteId,
  });
}

// Filtered top pages hook
export function useFilteredTopPages({ siteId, dateRange, filters }: FilteredAnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const hasFilters = filters && Object.keys(filters).length > 0;

  return useQuery({
    queryKey: ["filtered-pages", siteId, dateRange, filters],
    queryFn: async (): Promise<TopPage[]> => {
      if (!hasFilters) {
        const { data, error } = await supabase.rpc("get_top_pages", {
          _site_id: siteId,
          _start_date: start.toISOString(),
          _end_date: end.toISOString(),
          _limit: 10,
        });

        if (error) throw error;

        return (data || []).map((row: any) => ({
          url: row.url,
          pageviews: Number(row.pageviews) || 0,
          uniqueVisitors: Number(row.unique_visitors) || 0,
        }));
      }

      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("site_id", siteId)
        .eq("event_name", "pageview")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (error) throw error;

      const filtered = applyFilters(events || [], filters);

      // Group by URL
      const urlMap: Record<string, { pageviews: number; visitors: Set<string> }> = {};
      filtered.forEach((event) => {
        const url = event.url || "/";
        if (!urlMap[url]) {
          urlMap[url] = { pageviews: 0, visitors: new Set() };
        }
        urlMap[url].pageviews++;
        if (event.visitor_id) {
          urlMap[url].visitors.add(event.visitor_id);
        }
      });

      return Object.entries(urlMap)
        .map(([url, data]) => ({
          url,
          pageviews: data.pageviews,
          uniqueVisitors: data.visitors.size,
        }))
        .sort((a, b) => b.pageviews - a.pageviews)
        .slice(0, 10);
    },
    enabled: !!siteId,
  });
}

// Filtered top referrers hook - useful for X/Twitter analytics
export function useFilteredTopReferrers({ siteId, dateRange, filters }: FilteredAnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const hasFilters = filters && Object.keys(filters).length > 0;

  return useQuery({
    queryKey: ["filtered-referrers", siteId, dateRange, filters],
    queryFn: async (): Promise<TopReferrer[]> => {
      if (!hasFilters) {
        const { data, error } = await supabase.rpc("get_top_referrers", {
          _site_id: siteId,
          _start_date: start.toISOString(),
          _end_date: end.toISOString(),
          _limit: 10,
        });

        if (error) throw error;

        return (data || []).map((row: any) => ({
          referrer: row.referrer,
          visits: Number(row.visits) || 0,
          percentage: Number(row.percentage) || 0,
        }));
      }

      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("site_id", siteId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .not("referrer", "is", null);

      if (error) throw error;

      const filtered = applyFilters(events || [], filters);

      // Group by referrer
      const referrerMap: Record<string, number> = {};
      filtered.forEach((event) => {
        const ref = event.referrer || "Direct";
        referrerMap[ref] = (referrerMap[ref] || 0) + 1;
      });

      const total = Object.values(referrerMap).reduce((a, b) => a + b, 0);

      return Object.entries(referrerMap)
        .map(([referrer, visits]) => ({
          referrer,
          visits,
          percentage: total > 0 ? (visits / total) * 100 : 0,
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);
    },
    enabled: !!siteId,
  });
}
