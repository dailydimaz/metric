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

// Convert filters to JSONB format for RPC calls
function filtersToJsonb(filters?: AnalyticsFilter): Record<string, string> | null {
  if (!filters || Object.keys(filters).length === 0) return null;
  
  const result: Record<string, string> = {};
  if (filters.country) result.country = filters.country;
  if (filters.browser) result.browser = filters.browser;
  if (filters.os) result.os = filters.os;
  if (filters.device) result.device = filters.device;
  if (filters.url) result.url = filters.url;
  if (filters.referrerPattern) result.referrerPattern = filters.referrerPattern;
  
  return Object.keys(result).length > 0 ? result : null;
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

// Fetch overall stats using RPC with filter support
export function useAnalyticsStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end, prevStart, prevEnd } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-stats", siteId, dateRange, filters],
    queryFn: async (): Promise<StatsData> => {
      const { data, error } = await (supabase.rpc as any)('get_site_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _prev_start_date: prevStart.toISOString(),
        _prev_end_date: prevEnd.toISOString(),
        _filters: jsonbFilters || {},
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

// Fetch time series data using RPC with filter support
export function useAnalyticsTimeSeries({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end, prevStart, prevEnd } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-timeseries", siteId, dateRange, filters],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      const { data, error } = await (supabase.rpc as any)('get_timeseries_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _prev_start_date: prevStart.toISOString(),
        _prev_end_date: prevEnd.toISOString(),
        _filters: jsonbFilters || {},
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

// Fetch top pages using RPC with filter support
export function useTopPages({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-pages", siteId, dateRange, filters],
    queryFn: async (): Promise<TopPage[]> => {
      const { data, error } = await (supabase.rpc as any)('get_top_pages', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        _filters: jsonbFilters || {},
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

// Fetch top referrers using RPC with filter support
export function useTopReferrers({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-referrers", siteId, dateRange, filters],
    queryFn: async (): Promise<TopReferrer[]> => {
      const { data, error } = await (supabase.rpc as any)('get_top_referrers', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        _filters: jsonbFilters || {},
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

// Fetch device stats using RPC with filter support
export function useDeviceStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-devices", siteId, dateRange, filters],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_device_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _filters: jsonbFilters || {},
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

// Fetch geo stats using RPC with filter support
export function useGeoStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-geo", siteId, dateRange, filters],
    queryFn: async (): Promise<GeoStat[]> => {
      const { data, error } = await (supabase.rpc as any)('get_geo_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        _filters: jsonbFilters || {},
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

// Fetch city stats using RPC with filter support
export function useCityStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-cities", siteId, dateRange, filters],
    queryFn: async (): Promise<CityStat[]> => {
      const { data, error } = await (supabase.rpc as any)('get_city_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        _filters: jsonbFilters || {},
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

// Fetch language stats using RPC with filter support
export function useLanguageStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-languages", siteId, dateRange, filters],
    queryFn: async (): Promise<LanguageStat[]> => {
      const { data, error } = await (supabase.rpc as any)('get_language_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        _filters: jsonbFilters || {},
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

// Fetch UTM campaign stats using RPC with filter support
export function useUTMStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-utm", siteId, dateRange, filters],
    queryFn: async (): Promise<UTMStats> => {
      const { data, error } = await (supabase.rpc as any)('get_utm_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        _filters: jsonbFilters || {},
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

export interface RetentionCohort {
  cohort_date: string;
  cohort_size: number;
  retention: {
    day: number;
    retained: number;
    rate: number;
  }[];
}

export interface RetentionData {
  cohorts: RetentionCohort[];
  summary: {
    day: number;
    average_rate: number;
  }[];
}

// Fetch retention cohorts using RPC
export function useRetentionCohorts({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["retention-cohorts", siteId, dateRange],
    queryFn: async (): Promise<RetentionData> => {
      const { data, error } = await supabase.rpc('get_retention_cohorts', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });

      if (error) throw error;

      return data as unknown as RetentionData;
    },
    enabled: !!siteId,
  });
}
