import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PublicDashboardConfig {
  id: string;
  site_id: string;
  share_token: string;
  is_enabled: boolean;
  title: string | null;
  show_visitors: boolean;
  show_pageviews: boolean;
  show_top_pages: boolean;
  show_referrers: boolean;
  show_devices: boolean;
  show_geo: boolean;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
}

export function usePublicDashboard(siteId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ['public-dashboard', siteId],
    queryFn: async () => {
      if (!siteId) return null;

      const { data, error } = await supabase
        .from('public_dashboards')
        .select('*')
        .eq('site_id', siteId)
        .maybeSingle();

      if (error) throw error;
      return data as PublicDashboardConfig | null;
    },
    enabled: !!siteId,
  });

  const createOrUpdate = useMutation({
    mutationFn: async (config: Partial<PublicDashboardConfig>) => {
      if (!siteId) throw new Error('No site selected');

      const existing = configQuery.data;

      if (existing) {
        const { error } = await supabase
          .from('public_dashboards')
          .update({
            ...config,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('public_dashboards')
          .insert({
            site_id: siteId,
            ...config,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-dashboard', siteId] });
      toast({
        title: 'Settings saved',
        description: 'Public dashboard settings updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const setPassword = useMutation({
    mutationFn: async (password: string | null) => {
      if (!siteId || !configQuery.data) throw new Error('No config found');

      // Hash password on the server using crypt
      let passwordHash: string | null = null;
      if (password) {
        // Use type assertion since the function is newly created
        const { data, error } = await (supabase.rpc as any)('hash_password', {
          _password: password,
        });
        if (error) throw error;
        passwordHash = data as string;
      }

      const { error } = await supabase
        .from('public_dashboards')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', configQuery.data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-dashboard', siteId] });
      toast({
        title: 'Password updated',
        description: 'Public dashboard password has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const regenerateToken = useMutation({
    mutationFn: async () => {
      if (!siteId || !configQuery.data) throw new Error('No config found');

      // Generate new token
      const newToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { error } = await supabase
        .from('public_dashboards')
        .update({
          share_token: newToken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', configQuery.data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-dashboard', siteId] });
      toast({
        title: 'Token regenerated',
        description: 'A new share URL has been generated. The old URL will no longer work.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    error: configQuery.error,
    createOrUpdate,
    setPassword,
    regenerateToken,
  };
}

// Hook for fetching public dashboard data (no auth required)
export function usePublicDashboardData(
  shareToken: string | undefined, 
  dateRange: { start: string; end: string },
  password?: string
) {
  return useQuery({
    queryKey: ['public-dashboard-data', shareToken, dateRange, password],
    queryFn: async () => {
      if (!shareToken) return null;

      const { data, error } = await supabase.rpc('get_public_dashboard_stats', {
        _share_token: shareToken,
        _start_date: dateRange.start,
        _end_date: dateRange.end,
        _password: password || null,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!shareToken,
  });
}
