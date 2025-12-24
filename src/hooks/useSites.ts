import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Site {
  id: string;
  name: string;
  domain: string | null;
  tracking_id: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export function useSites() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sitesQuery = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Site[];
    },
  });

  const createSite = useMutation({
    mutationFn: async ({ name, domain }: { name: string; domain?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("sites")
        .insert({
          name,
          domain: domain || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Site;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({
        title: "Site created",
        description: "Your new site has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSite = useMutation({
    mutationFn: async ({ id, name, domain, timezone }: { id: string; name?: string; domain?: string; timezone?: string }) => {
      const { data, error } = await supabase
        .from("sites")
        .update({ name, domain, timezone })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Site;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({
        title: "Site updated",
        description: "Your site has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sites")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({
        title: "Site deleted",
        description: "Your site has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sites: sitesQuery.data ?? [],
    isLoading: sitesQuery.isLoading,
    error: sitesQuery.error,
    createSite,
    updateSite,
    deleteSite,
  };
}