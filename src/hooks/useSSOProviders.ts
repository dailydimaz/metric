import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SSOProviderType = "saml" | "google_workspace" | "okta" | "azure_ad";

export interface SSOProvider {
  id: string;
  site_id: string;
  provider_type: SSOProviderType;
  domain: string;
  is_enabled: boolean;
  entry_point: string | null;
  issuer: string | null;
  cert: string | null;
  metadata_xml: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSSOProviderInput {
  site_id: string;
  provider_type: SSOProviderType;
  domain: string;
  entry_point?: string;
  issuer?: string;
  cert?: string;
  metadata_xml?: string;
}

export interface UpdateSSOProviderInput {
  id: string;
  provider_type?: SSOProviderType;
  domain?: string;
  is_enabled?: boolean;
  entry_point?: string;
  issuer?: string;
  cert?: string;
  metadata_xml?: string;
}

export function useSSOProviders(siteId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const providersQuery = useQuery({
    queryKey: ["sso-providers", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sso_providers")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SSOProvider[];
    },
    enabled: !!siteId,
  });

  const createProvider = useMutation({
    mutationFn: async (input: CreateSSOProviderInput) => {
      const { data, error } = await supabase
        .from("sso_providers")
        .insert({
          site_id: input.site_id,
          provider_type: input.provider_type,
          domain: input.domain,
          entry_point: input.entry_point || null,
          issuer: input.issuer || null,
          cert: input.cert || null,
          metadata_xml: input.metadata_xml || null,
          is_enabled: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SSOProvider;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sso-providers", siteId] });
      toast({
        title: "SSO Provider created",
        description: "Your SSO provider has been configured.",
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

  const updateProvider = useMutation({
    mutationFn: async (input: UpdateSSOProviderInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("sso_providers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as SSOProvider;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sso-providers", siteId] });
      toast({
        title: "SSO Provider updated",
        description: "Your SSO configuration has been updated.",
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

  const deleteProvider = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sso_providers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sso-providers", siteId] });
      toast({
        title: "SSO Provider deleted",
        description: "The SSO provider has been removed.",
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

  const toggleProvider = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { data, error } = await supabase
        .from("sso_providers")
        .update({ is_enabled })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as SSOProvider;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sso-providers", siteId] });
      toast({
        title: data.is_enabled ? "SSO Enabled" : "SSO Disabled",
        description: data.is_enabled 
          ? "Users can now sign in with SSO." 
          : "SSO sign-in has been disabled.",
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

  // Generate SP metadata URL
  const getSpMetadataUrl = (providerId: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/sso-saml/metadata/${providerId}`;
  };

  // Generate ACS URL (Assertion Consumer Service)
  const getAcsUrl = (providerId: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/sso-saml/acs/${providerId}`;
  };

  // Generate SSO initiation URL
  const getSsoLoginUrl = (providerId: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/sso-saml/login/${providerId}`;
  };

  return {
    providers: providersQuery.data ?? [],
    isLoading: providersQuery.isLoading,
    error: providersQuery.error,
    createProvider,
    updateProvider,
    deleteProvider,
    toggleProvider,
    getSpMetadataUrl,
    getAcsUrl,
    getSsoLoginUrl,
  };
}
