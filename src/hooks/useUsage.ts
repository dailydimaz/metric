import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { isSelfHosted } from '@/lib/billing';
import { startOfMonth, format } from 'date-fns';

interface UsageData {
  events_count: number;
  sites_count: number;
  month: string;
}

export function useUsage() {
  const { user } = useAuth();
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  // If self-hosted, return minimal usage (no limits)
  if (isSelfHosted()) {
    return {
      usage: {
        events_count: 0,
        sites_count: 0,
        month: currentMonth,
      } as UsageData,
      isLoading: false,
      error: null,
    };
  }

  const usageQuery = useQuery({
    queryKey: ['usage', user?.id, currentMonth],
    queryFn: async (): Promise<UsageData | null> => {
      if (!user) return null;

      // Count sites owned by user
      const { count: sitesCount, error: sitesError } = await supabase
        .from('sites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (sitesError) throw sitesError;

      // Get all site IDs for user
      const { data: userSites, error: userSitesError } = await supabase
        .from('sites')
        .select('id')
        .eq('user_id', user.id);

      if (userSitesError) throw userSitesError;

      let eventsCount = 0;
      
      if (userSites && userSites.length > 0) {
        const siteIds = userSites.map(s => s.id);
        const monthStart = `${currentMonth}T00:00:00Z`;
        
        // Count events for all user sites this month
        const { count, error: eventsError } = await supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .in('site_id', siteIds)
          .gte('created_at', monthStart);

        if (eventsError) throw eventsError;
        eventsCount = count || 0;
      }

      return {
        events_count: eventsCount,
        sites_count: sitesCount || 0,
        month: currentMonth,
      };
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    usage: usageQuery.data || null,
    isLoading: usageQuery.isLoading,
    error: usageQuery.error,
  };
}
