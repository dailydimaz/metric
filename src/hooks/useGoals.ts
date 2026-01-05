import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "./useAnalytics";

export interface Goal {
  id: string;
  site_id: string;
  name: string;
  event_name: string;
  url_match: string | null;
  match_type: "exact" | "contains" | "starts_with" | "regex";
  created_at: string;
  updated_at: string;
}

export interface GoalStats {
  goal: Goal;
  conversions: number;
  conversionRate: number;
}

interface GoalsParams {
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

export function useGoals(siteId: string) {
  return useQuery({
    queryKey: ["goals", siteId],
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!siteId,
  });
}

export function useGoalStats({ siteId, dateRange }: GoalsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["goal-stats", siteId, dateRange],
    queryFn: async (): Promise<GoalStats[]> => {
      // Call the server-side RPC for efficient aggregation
      const { data, error } = await supabase.rpc("get_goal_stats", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Transform RPC response to match the existing GoalStats interface
      return data.map((row: {
        goal_id: string;
        goal_name: string;
        event_name: string;
        url_match: string | null;
        match_type: string;
        conversions: number;
        total_visitors: number;
        conversion_rate: number;
      }) => ({
        goal: {
          id: row.goal_id,
          site_id: siteId,
          name: row.goal_name,
          event_name: row.event_name,
          url_match: row.url_match,
          match_type: row.match_type as Goal["match_type"],
          created_at: "",
          updated_at: "",
        },
        conversions: Number(row.conversions),
        conversionRate: Number(row.conversion_rate),
      }));
    },
    enabled: !!siteId,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: Omit<Goal, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("goals")
        .insert(goal)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goals", variables.site_id] });
      queryClient.invalidateQueries({ queryKey: ["goal-stats", variables.site_id] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, siteId }: { id: string; siteId: string }) => {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, siteId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goals", variables.siteId] });
      queryClient.invalidateQueries({ queryKey: ["goal-stats", variables.siteId] });
    },
  });
}
