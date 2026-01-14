import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Link {
  id: string;
  site_id: string;
  user_id: string;
  slug: string;
  original_url: string;
  description: string | null;
  created_at: string;
}

// Generate a random slug
export function generateSlug(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get the short URL for a slug
export function getShortUrl(slug: string): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "lckjlefupqlblfcwhbom";
  return `https://${projectId}.supabase.co/functions/v1/redirect?s=${slug}`;
}

export function useLinks(siteId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: links, isLoading, error } = useQuery({
    queryKey: ["links", siteId],
    queryFn: async (): Promise<Link[]> => {
      if (!siteId) return [];

      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Link[];
    },
    enabled: !!siteId && !!user,
  });

  const createLink = useMutation({
    mutationFn: async ({
      siteId,
      originalUrl,
      slug,
      description,
    }: {
      siteId: string;
      originalUrl: string;
      slug?: string;
      description?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const finalSlug = slug || generateSlug();

      const { data, error } = await supabase
        .from("links")
        .insert({
          site_id: siteId,
          user_id: user.id,
          slug: finalSlug,
          original_url: originalUrl,
          description: description || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("This slug is already taken. Please choose another.");
        }
        throw error;
      }

      return data as Link;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["links", data.site_id] });
      queryClient.invalidateQueries({ queryKey: ["user-links"] });
      toast.success("Short link created!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create link");
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("links").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", siteId] });
      queryClient.invalidateQueries({ queryKey: ["user-links"] });
      toast.success("Link deleted");
    },
    onError: () => {
      toast.error("Failed to delete link");
    },
  });

  return {
    links,
    isLoading,
    error,
    createLink,
    deleteLink,
  };
}

// Hook to get all links for the current user (across all sites)
export function useUserLinks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-links", user?.id],
    queryFn: async (): Promise<Link[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Link[];
    },
    enabled: !!user,
  });
}

// Hook to get click count for a link
export function useLinkClicks(linkId: string | null, siteId: string | null) {
  return useQuery({
    queryKey: ["link-clicks", linkId],
    queryFn: async (): Promise<number> => {
      if (!linkId || !siteId) return 0;

      const { count, error } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("site_id", siteId)
        .eq("event_name", "link_click")
        .contains("properties", { link_id: linkId });

      if (error) throw error;
      return count || 0;
    },
    enabled: !!linkId && !!siteId,
  });
}
