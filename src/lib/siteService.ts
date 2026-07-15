import { supabase } from './supabase';

export async function createSite(params: {
  userId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
}): Promise<string> {
  const { data, error } = await supabase
    .from('sites')
    .insert({
      created_by: params.userId,
      classroom_id: null,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      latitude: params.latitude,
      longitude: params.longitude,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function deleteSite(siteId: string): Promise<void> {
  const { error } = await supabase.from('sites').delete().eq('id', siteId);
  if (error) throw new Error(error.message);
}
