import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Taxon } from '../types/database';

export function useTaxa() {
  return useQuery({
    queryKey: ['taxa'],
    queryFn: async (): Promise<Taxon[]> => {
      const { data, error } = await supabase
        .from('taxa')
        .select('*')
        .order('model_class_index');
      if (error) throw error;
      return data as Taxon[];
    },
    staleTime: Infinity, // Taxa are seeded once and never change
    gcTime: Infinity,
  });
}
