import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FunnelStep {
  id: string;
  order?: number;
  name?: string;
  event_name: string;
  url_match?: string;
  match_type: "exact" | "contains" | "starts_with";
}

export interface Funnel {
  id: string;
  site_id: string;
  name: string;
  description?: string;
  steps: FunnelStep[];
  time_window_days: number;
  created_at: string;
  updated_at: string;
}

export interface FunnelStepAnalytics {
  step_index: number;
  step_name: string;
  visitors: number;
  conversion_rate: number;
  drop_off_rate: number;
}

const getDateRangeFilter = (dateRange: string) => {
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

export function useFunnels(siteId: string | undefined) {
  return useQuery({
    queryKey: ["funnels", siteId],
    queryFn: async () => {
      if (!siteId) return [];
      
      const { data, error } = await supabase
        .from("funnels")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Parse steps from JSON
      return (data || []).map(funnel => ({
        ...funnel,
        steps: (funnel.steps as unknown) as FunnelStep[]
      })) as Funnel[];
    },
    enabled: !!siteId,
  });
}

export function useFunnel(funnelId: string | undefined) {
  return useQuery({
    queryKey: ["funnel", funnelId],
    queryFn: async () => {
      if (!funnelId) return null;
      
      const { data, error } = await supabase
        .from("funnels")
        .select("*")
        .eq("id", funnelId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        steps: (data.steps as unknown) as FunnelStep[]
      } as Funnel;
    },
    enabled: !!funnelId,
  });
}

export function useCreateFunnel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (funnel: {
      site_id: string;
      name: string;
      description?: string;
      steps: FunnelStep[];
      time_window_days?: number;
    }) => {
      const { data, error } = await supabase
        .from("funnels")
        .insert([{
          site_id: funnel.site_id,
          name: funnel.name,
          description: funnel.description,
          steps: JSON.parse(JSON.stringify(funnel.steps)),
          time_window_days: funnel.time_window_days || 7,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["funnels", variables.site_id] });
      toast.success("Funnel created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create funnel: " + error.message);
    },
  });
}

export function useUpdateFunnel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Funnel> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.steps !== undefined) updateData.steps = JSON.parse(JSON.stringify(updates.steps));
      if (updates.time_window_days !== undefined) updateData.time_window_days = updates.time_window_days;

      const { data, error } = await supabase
        .from("funnels")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["funnels", data.site_id] });
      queryClient.invalidateQueries({ queryKey: ["funnel", data.id] });
      toast.success("Funnel updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update funnel: " + error.message);
    },
  });
}

export function useDeleteFunnel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, siteId }: { id: string; siteId: string }) => {
      const { error } = await supabase
        .from("funnels")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, siteId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["funnels", variables.siteId] });
      toast.success("Funnel deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete funnel: " + error.message);
    },
  });
}

export function useFunnelAnalytics(funnelId: string | undefined, dateRange: string = "30d") {
  return useQuery({
    queryKey: ["funnel-analytics", funnelId, dateRange],
    queryFn: async () => {
      if (!funnelId) return null;

      const { startDate, endDate } = getDateRangeFilter(dateRange);

      // First get the funnel details for the response
      const { data: funnel, error: funnelError } = await supabase
        .from("funnels")
        .select("*")
        .eq("id", funnelId)
        .maybeSingle();

      if (funnelError) throw funnelError;
      if (!funnel) return null;

      // Call the server-side RPC for efficient aggregation
      const { data: stepAnalytics, error: analyticsError } = await supabase.rpc("get_funnel_stats", {
        _funnel_id: funnelId,
        _start_date: startDate.toISOString(),
        _end_date: endDate.toISOString(),
      });

      if (analyticsError) throw analyticsError;

      const steps = (funnel.steps as unknown) as FunnelStep[];
      const analytics: FunnelStepAnalytics[] = (stepAnalytics || []).map((row: {
        step_index: number;
        step_name: string;
        visitors: number;
        conversion_rate: number;
        drop_off_rate: number;
      }) => ({
        step_index: Number(row.step_index),
        step_name: row.step_name || `Step ${row.step_index + 1}`,
        visitors: Number(row.visitors),
        conversion_rate: Number(row.conversion_rate),
        drop_off_rate: Number(row.drop_off_rate),
      }));

      const firstStepVisitors = analytics[0]?.visitors || 0;
      const lastStepConversion = analytics.length > 0 
        ? analytics[analytics.length - 1].conversion_rate 
        : 0;

      return {
        funnel: {
          ...funnel,
          steps,
        } as Funnel,
        stepAnalytics: analytics,
        totalVisitors: firstStepVisitors,
        overallConversion: lastStepConversion,
      };
    },
    enabled: !!funnelId,
  });
}
