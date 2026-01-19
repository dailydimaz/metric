import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange, getDateRangeFilter } from './useAnalytics';

export interface AttributionChannel {
  channel: string;
  medium: string;
  conversions: number;
  campaigns: number;
}

export interface CampaignStats {
  campaign: string;
  source: string | null;
  medium: string | null;
  conversions: number;
}

export interface ConversionPath {
  path: string;
  conversions: number;
  avg_touchpoints: number;
}

export interface AttributionData {
  summary: {
    total_conversions: number;
    converting_visitors: number;
  };
  firstTouch: AttributionChannel[];
  lastTouch: AttributionChannel[];
  campaigns: CampaignStats[];
  paths: ConversionPath[];
}

export function useAttribution(
  siteId: string | undefined,
  dateRange: DateRange,
  goalEvent: string = 'conversion'
) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ['attribution', siteId, dateRange, goalEvent],
    queryFn: async () => {
      if (!siteId) return null;

      const { data, error } = await supabase.rpc('get_attribution_stats', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _goal_event: goalEvent,
        _attribution_model: 'last_touch',
      });

      if (error) throw error;
      
      // Handle unauthorized response
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(data.error as string);
      }

      return data as unknown as AttributionData;
    },
    enabled: !!siteId,
  });
}
