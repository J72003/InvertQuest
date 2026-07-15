import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SpecimenWithRelations } from '../types/database';

export function useSpecimen(specimenId: string | null) {
  return useQuery({
    queryKey: ['specimen', specimenId],
    queryFn: async (): Promise<SpecimenWithRelations | null> => {
      if (!specimenId) return null;
      const { data, error } = await supabase
        .from('specimens')
        .select('*, taxon:taxa(*)')
        .eq('id', specimenId)
        .single();
      if (error) throw error;
      return data as SpecimenWithRelations;
    },
    enabled: !!specimenId,
  });
}
