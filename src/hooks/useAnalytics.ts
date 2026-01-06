import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

export type DateRange = "today" | "7d" | "30d" | "90d";

export interface AnalyticsFilter {
  country?: string;
  browser?: string;
  url?: string;
  os?: string;
  device?: string;
  referrerPattern?: string;
}

interface AnalyticsParams {
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

export interface StatsData {
  totalPageviews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageviewsChange: number;
  visitorsChange: number;
}

export interface TimeSeriesData {
  date: string;
  pageviews: number;
  visitors: number;
  prevPageviews?: number;
  prevVisitors?: number;
}

export interface TopPage {
  url: string;
  pageviews: number;
  uniqueVisitors: number;
}

export interface TopReferrer {
  referrer: string;
  visits: number;
  percentage: number;
}

export interface DeviceStat {
  name: string;
  value: number;
  percentage: number;
}

export interface GeoStat {
  country: string;
  visits: number;
  percentage: number;
}

export interface CityStat {
  city: string;
  country: string;
  visits: number;
  percentage: number;
}

export interface LanguageStat {
  language: string;
  visits: number;
  percentage: number;
}

export interface UTMStat {
  value: string;
  visits: number;
  percentage: number;
}

export interface UTMStats {
  sources: UTMStat[];
  mediums: UTMStat[];
  campaigns: UTMStat[];
}

// Fetch overall stats using RPC
export function useAnalyticsStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end, prevStart, prevEnd } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-stats", siteId, dateRange],
    queryFn: async (): Promise<StatsData> => {
      const { data, error } = await supabase.rpc('get_site_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _prev_start_date: prevStart.toISOString(),
        _prev_end_date: prevEnd.toISOString(),
      });

      if (error) throw error;

      const result = data?.[0] || {
        total_pageviews: 0,
        unique_visitors: 0,
        bounce_rate: 0,
        pageviews_change: 0,
        visitors_change: 0,
      };

      return {
        totalPageviews: Number(result.total_pageviews) || 0,
        uniqueVisitors: Number(result.unique_visitors) || 0,
        avgSessionDuration: 0,
        bounceRate: Number(result.bounce_rate) || 0,
        pageviewsChange: Number(result.pageviews_change) || 0,
        visitorsChange: Number(result.visitors_change) || 0,
      };
    },
    enabled: !!siteId,
  });
}

// Fetch time series data using RPC
export function useAnalyticsTimeSeries({ siteId, dateRange }: AnalyticsParams) {
  const { start, end, prevStart, prevEnd } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-timeseries", siteId, dateRange],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      const { data, error } = await supabase.rpc('get_timeseries_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _prev_start_date: prevStart.toISOString(),
        _prev_end_date: prevEnd.toISOString(),
      });

      if (error) throw error;

      return (data || []).map((row: {
        date: string;
        pageviews: number;
        visitors: number;
        prev_pageviews: number;
        prev_visitors: number;
      }) => ({
        date: row.date,
        pageviews: Number(row.pageviews) || 0,
        visitors: Number(row.visitors) || 0,
        prevPageviews: Number(row.prev_pageviews) || 0,
        prevVisitors: Number(row.prev_visitors) || 0,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch top pages using RPC
export function useTopPages({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-pages", siteId, dateRange],
    queryFn: async (): Promise<TopPage[]> => {
      const { data, error } = await supabase.rpc('get_top_pages', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
      });

      if (error) throw error;

      return (data || []).map((row: {
        url: string;
        pageviews: number;
        unique_visitors: number;
      }) => ({
        url: row.url,
        pageviews: Number(row.pageviews) || 0,
        uniqueVisitors: Number(row.unique_visitors) || 0,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch top referrers using RPC
export function useTopReferrers({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-referrers", siteId, dateRange],
    queryFn: async (): Promise<TopReferrer[]> => {
      const { data, error } = await supabase.rpc('get_top_referrers', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
      });

      if (error) throw error;

      return (data || []).map((row: {
        referrer: string;
        visits: number;
        percentage: number;
      }) => ({
        referrer: row.referrer,
        visits: Number(row.visits) || 0,
        percentage: Number(row.percentage) || 0,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch device stats using RPC
export function useDeviceStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-devices", siteId, dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_device_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });

      if (error) throw error;

      const result = data as unknown as {
        browsers: DeviceStat[];
        operatingSystems: DeviceStat[];
        devices: DeviceStat[];
      } | null;

      return {
        browsers: result?.browsers || [],
        operatingSystems: result?.operatingSystems || [],
        devices: result?.devices || [],
      };
    },
    enabled: !!siteId,
  });
}

// Fetch geo stats using RPC
export function useGeoStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-geo", siteId, dateRange],
    queryFn: async (): Promise<GeoStat[]> => {
      const { data, error } = await supabase.rpc('get_geo_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
      });

      if (error) throw error;

      return (data || []).map((row: {
        country: string;
        visits: number;
        percentage: number;
      }) => ({
        country: row.country,
        visits: Number(row.visits) || 0,
        percentage: Number(row.percentage) || 0,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch city stats using RPC
export function useCityStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-cities", siteId, dateRange],
    queryFn: async (): Promise<CityStat[]> => {
      const { data, error } = await supabase.rpc('get_city_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
      });

      if (error) throw error;

      return (data || []).map((row: {
        city: string;
        country: string;
        visits: number;
        percentage: number;
      }) => ({
        city: row.city,
        country: row.country,
        visits: Number(row.visits) || 0,
        percentage: Number(row.percentage) || 0,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch language stats using RPC
export function useLanguageStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-languages", siteId, dateRange],
    queryFn: async (): Promise<LanguageStat[]> => {
      const { data, error } = await supabase.rpc('get_language_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
      });

      if (error) throw error;

      return (data || []).map((row: {
        language: string;
        visits: number;
        percentage: number;
      }) => ({
        language: row.language,
        visits: Number(row.visits) || 0,
        percentage: Number(row.percentage) || 0,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch UTM campaign stats using RPC
export function useUTMStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-utm", siteId, dateRange],
    queryFn: async (): Promise<UTMStats> => {
      const { data, error } = await supabase.rpc('get_utm_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
      });

      if (error) throw error;

      const result = data as unknown as {
        sources: UTMStat[];
        mediums: UTMStat[];
        campaigns: UTMStat[];
      } | null;

      return {
        sources: result?.sources || [],
        mediums: result?.mediums || [],
        campaigns: result?.campaigns || [],
      };
    },
    enabled: !!siteId,
  });
}
