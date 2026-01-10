import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "./useAnalytics";

interface CustomEventsParams {
  siteId: string;
  dateRange: DateRange;
}

export interface CustomEvent {
  id: string;
  event_name: string;
  url: string | null;
  properties: Record<string, unknown> | null;
  created_at: string;
  country: string | null;
  browser: string | null;
}

export interface EventGroup {
  name: string;
  count: number;
  lastOccurrence: string;
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

export function useCustomEvents({ siteId, dateRange }: CustomEventsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["custom-events", siteId, dateRange],
    queryFn: async (): Promise<CustomEvent[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("id, event_name, url, properties, created_at, country, browser")
        .eq("site_id", siteId)
        .neq("event_name", "pageview")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map(event => ({
        ...event,
        properties: event.properties as Record<string, unknown> | null,
      }));
    },
    enabled: !!siteId,
  });
}

export function useEventGroups({ siteId, dateRange }: CustomEventsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["event-groups", siteId, dateRange],
    queryFn: async (): Promise<EventGroup[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("event_name, created_at")
        .eq("site_id", siteId)
        .neq("event_name", "pageview")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by event name
      const groups = new Map<string, { count: number; lastOccurrence: string }>();

      data?.forEach(event => {
        const existing = groups.get(event.event_name);
        if (existing) {
          existing.count++;
        } else {
          groups.set(event.event_name, {
            count: 1,
            lastOccurrence: event.created_at,
          });
        }
      });

      return Array.from(groups.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          lastOccurrence: data.lastOccurrence,
        }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!siteId,
  });
}

export interface PropertyStats {
  value: string;
  count: number;
  percentage: number;
}

export function useEventProperties({ siteId, eventName, dateRange }: CustomEventsParams & { eventName: string | null }) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["event-properties", siteId, eventName, dateRange],
    queryFn: async (): Promise<Record<string, PropertyStats[]> | null> => {
      if (!eventName) return null;

      const { data, error } = await supabase
        .from("events")
        .select("properties")
        .eq("site_id", siteId)
        .eq("event_name", eventName)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .not("properties", "is", null)
        .limit(1000); // Limit analysis to 1000 recent events for performance

      if (error) throw error;

      if (!data || data.length === 0) return {};

      // Aggregate properties
      const propertyCounts: Record<string, Record<string, number>> = {};

      data.forEach(row => {
        const props = row.properties as Record<string, unknown>;
        if (!props) return;

        Object.entries(props).forEach(([key, value]) => {
          if (value === null || value === undefined) return;

          const stringValue = String(value);

          if (!propertyCounts[key]) {
            propertyCounts[key] = {};
          }

          propertyCounts[key][stringValue] = (propertyCounts[key][stringValue] || 0) + 1;
        });
      });

      // Convert to stats array
      const stats: Record<string, PropertyStats[]> = {};

      Object.entries(propertyCounts).forEach(([key, counts]) => {
        const totalForProp = Object.values(counts).reduce((a, b) => a + b, 0);

        stats[key] = Object.entries(counts)
          .map(([value, count]) => ({
            value,
            count,
            // Calculate percentage based on total occurrences of this property
            percentage: Math.round((count / totalForProp) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10 values only
      });

      return stats;
    },
    enabled: !!siteId && !!eventName,
  });
}
