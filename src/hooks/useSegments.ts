import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnalyticsFilter } from './useAnalytics';

export interface Segment {
  id: string;
  site_id: string;
  user_id: string;
  name: string;
  description: string | null;
  filters: AnalyticsFilter;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useSegments(siteId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const segmentsQuery = useQuery({
    queryKey: ['segments', siteId],
    queryFn: async () => {
      if (!siteId) return [];

      const { data, error } = await supabase
        .from('segments')
        .select('*')
        .eq('site_id', siteId)
        .order('name');

      if (error) throw error;
      return (data || []).map((s: any) => ({
        ...s,
        filters: s.filters as AnalyticsFilter,
      })) as Segment[];
    },
    enabled: !!siteId,
  });

  const createSegment = useMutation({
    mutationFn: async ({ name, description, filters, isDefault }: { 
      name: string; 
      description?: string; 
      filters: AnalyticsFilter;
      isDefault?: boolean;
    }) => {
      if (!siteId) throw new Error('No site selected');

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Not authenticated');

      // If setting as default, unset other defaults first
      if (isDefault) {
        await supabase
          .from('segments')
          .update({ is_default: false } as any)
          .eq('site_id', siteId);
      }

      const { error } = await supabase
        .from('segments')
        .insert({
          site_id: siteId,
          user_id: userData.user.id,
          name,
          description: description || null,
          filters: filters as any,
          is_default: isDefault || false,
        } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', siteId] });
      toast({
        title: 'Segment saved',
        description: 'Your filter segment has been saved.',
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

  const updateSegment = useMutation({
    mutationFn: async ({ id, name, description, filters, isDefault }: { 
      id: string;
      name?: string; 
      description?: string; 
      filters?: AnalyticsFilter;
      isDefault?: boolean;
    }) => {
      if (!siteId) throw new Error('No site selected');

      // If setting as default, unset other defaults first
      if (isDefault) {
        await supabase
          .from('segments')
          .update({ is_default: false } as any)
          .eq('site_id', siteId)
          .neq('id', id);
      }

      const updateData: any = { updated_at: new Date().toISOString() };
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (filters !== undefined) updateData.filters = filters;
      if (isDefault !== undefined) updateData.is_default = isDefault;

      const { error } = await supabase
        .from('segments')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', siteId] });
      toast({
        title: 'Segment updated',
        description: 'Your filter segment has been updated.',
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

  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('segments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', siteId] });
      toast({
        title: 'Segment deleted',
        description: 'Your filter segment has been deleted.',
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
    segments: segmentsQuery.data || [],
    isLoading: segmentsQuery.isLoading,
    error: segmentsQuery.error,
    createSegment,
    updateSegment,
    deleteSegment,
  };
}