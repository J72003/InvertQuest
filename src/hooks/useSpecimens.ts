import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SpecimenWithRelations } from '../types/database';

export function useSpecimens(userId: string | null) {
  return useQuery({
    queryKey: ['specimens', userId],
    queryFn: async (): Promise<SpecimenWithRelations[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('specimens')
        .select('*, taxon:taxa(*)')
        .eq('user_id', userId)
        .order('captured_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SpecimenWithRelations[];
    },
    enabled: !!userId,
  });
}
