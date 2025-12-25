import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FunnelStep {
  id: string;
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

      // First get the funnel
      const { data: funnel, error: funnelError } = await supabase
        .from("funnels")
        .select("*")
        .eq("id", funnelId)
        .maybeSingle();

      if (funnelError) throw funnelError;
      if (!funnel) return null;

      const steps = (funnel.steps as unknown) as FunnelStep[];
      const timeWindow = funnel.time_window_days || 7;

      // Calculate date range
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

      // Get all events for this site within the date range
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("visitor_id, event_name, url, created_at")
        .eq("site_id", funnel.site_id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (eventsError) throw eventsError;

      // Group events by visitor
      const visitorEvents = new Map<string, typeof events>();
      (events || []).forEach(event => {
        if (!event.visitor_id) return;
        if (!visitorEvents.has(event.visitor_id)) {
          visitorEvents.set(event.visitor_id, []);
        }
        visitorEvents.get(event.visitor_id)!.push(event);
      });

      // Calculate funnel analytics
      const stepAnalytics: FunnelStepAnalytics[] = steps.map((step, index) => {
        let visitors = 0;

        visitorEvents.forEach((visitorEventList) => {
          // Check if visitor completed all previous steps and this step
          let lastStepTime: Date | null = null;
          let completedPreviousSteps = true;

          for (let i = 0; i <= index; i++) {
            const currentStep = steps[i];
            const matchingEvent = visitorEventList.find(event => {
              // Check time window from last step
              if (lastStepTime) {
                const eventTime = new Date(event.created_at);
                const daysDiff = (eventTime.getTime() - lastStepTime.getTime()) / (1000 * 60 * 60 * 24);
                if (daysDiff > timeWindow) return false;
              }

              // Match event name
              if (event.event_name !== currentStep.event_name) return false;

              // Match URL if specified
              if (currentStep.url_match && event.url) {
                switch (currentStep.match_type) {
                  case "exact":
                    if (event.url !== currentStep.url_match) return false;
                    break;
                  case "contains":
                    if (!event.url.includes(currentStep.url_match)) return false;
                    break;
                  case "starts_with":
                    if (!event.url.startsWith(currentStep.url_match)) return false;
                    break;
                }
              }

              return true;
            });

            if (!matchingEvent) {
              completedPreviousSteps = false;
              break;
            }

            lastStepTime = new Date(matchingEvent.created_at);
          }

          if (completedPreviousSteps) {
            visitors++;
          }
        });

        const firstStepVisitors = index === 0 ? visitors : 0;
        const prevVisitors = index > 0 ? 0 : visitors; // Will be calculated after

        return {
          step_index: index,
          step_name: step.event_name + (step.url_match ? ` (${step.url_match})` : ""),
          visitors,
          conversion_rate: 0,
          drop_off_rate: 0,
        };
      });

      // Calculate conversion and drop-off rates
      const firstStepVisitors = stepAnalytics[0]?.visitors || 0;
      stepAnalytics.forEach((step, index) => {
        step.conversion_rate = firstStepVisitors > 0 
          ? Math.round((step.visitors / firstStepVisitors) * 100) 
          : 0;
        
        if (index > 0) {
          const prevVisitors = stepAnalytics[index - 1].visitors;
          step.drop_off_rate = prevVisitors > 0 
            ? Math.round(((prevVisitors - step.visitors) / prevVisitors) * 100)
            : 0;
        }
      });

      return {
        funnel: {
          ...funnel,
          steps: (funnel.steps as unknown) as FunnelStep[]
        } as Funnel,
        stepAnalytics,
        totalVisitors: firstStepVisitors,
        overallConversion: stepAnalytics.length > 0 
          ? stepAnalytics[stepAnalytics.length - 1].conversion_rate 
          : 0,
      };
    },
    enabled: !!funnelId,
  });
}
