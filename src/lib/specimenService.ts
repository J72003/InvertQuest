import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { useOfflineQueueStore } from '../store/offlineQueueStore';
import type { AIPrediction, Behavior, ConfidenceLevel, SizeEstimate } from '../types/database';

export interface SaveSpecimenParams {
  userId: string;
  classroomId: string | null;
  localImageUri: string;
  imageBase64: string;
  taxonId: string | null;
  sizeEstimate: SizeEstimate | null;
  habitat: string | null;
  behaviors: Behavior[];
  confidence: ConfidenceLevel | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  aiPredictions: AIPrediction | null;
  capturedAt: string;
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

async function uploadImage(
  userId: string,
  base64: string,
  capturedAt: string,
): Promise<{ imagePath: string; imageUrl: string }> {
  const imagePath = `${userId}/${capturedAt.replace(/[:.]/g, '-')}.jpg`;

  // Convert base64 to blob via data URI
  const dataUri = `data:image/jpeg;base64,${base64}`;
  const blob = await uriToBlob(dataUri);

  const { error } = await supabase.storage
    .from('specimens')
    .upload(imagePath, blob, { contentType: 'image/jpeg', upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  // imageUrl stored as the path; signed URLs generated on demand in UI
  return { imagePath, imageUrl: imagePath };
}

async function _saveOnline(params: SaveSpecimenParams): Promise<string> {
  const { imagePath, imageUrl } = await uploadImage(
    params.userId,
    params.imageBase64,
    params.capturedAt,
  );

  let siteId: string | null = null;
  if (params.latitude && params.longitude) {
    const { data } = await supabase.rpc('nearby_site', {
      p_lat: params.latitude,
      p_lng: params.longitude,
      p_user_id: params.userId,
    });
    siteId = data ?? null;
  }

  const { data, error } = await supabase
    .from('specimens')
    .insert({
      user_id: params.userId,
      classroom_id: params.classroomId,
      taxon_id: params.taxonId,
      site_id: siteId,
      image_url: imageUrl,
      image_path: imagePath,
      size_estimate: params.sizeEstimate,
      habitat: params.habitat || null,
      behaviors: params.behaviors.length ? params.behaviors : null,
      confidence: params.confidence,
      notes: params.notes || null,
      latitude: params.latitude,
      longitude: params.longitude,
      ai_predictions: params.aiPredictions,
      captured_at: params.capturedAt,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);
  return data.id;
}

export async function saveSpecimen(
  params: SaveSpecimenParams,
): Promise<{ queued: boolean; specimenId: string | null }> {
  const netState = await NetInfo.fetch();
  const isOnline = netState.isConnected && netState.isInternetReachable;

  if (!isOnline) {
    await useOfflineQueueStore.getState().add({
      localImageUri: params.localImageUri,
      imageBase64: params.imageBase64,
      taxonId: params.taxonId,
      classroomId: params.classroomId,
      sizeEstimate: params.sizeEstimate,
      habitat: params.habitat,
      behaviors: params.behaviors,
      confidence: params.confidence,
      notes: params.notes,
      latitude: params.latitude,
      longitude: params.longitude,
      aiPredictions: params.aiPredictions,
      capturedAt: params.capturedAt,
    });
    return { queued: true, specimenId: null };
  }

  const specimenId = await _saveOnline(params);
  return { queued: false, specimenId };
}

export async function saveSpecimenDirect(params: SaveSpecimenParams): Promise<void> {
  await _saveOnline(params);
}

// Generate a signed URL for displaying a specimen image (valid 1 hour)
export async function getSpecimenImageUrl(imagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('specimens')
    .createSignedUrl(imagePath, 604800);
  if (error) return null;
  return data.signedUrl;
}

export async function updateSpecimen(
  specimenId: string,
  updates: {
    taxon_id?: string | null;
    size_estimate?: string | null;
    habitat?: string | null;
    behaviors?: string[];
    confidence?: string | null;
    notes?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from('specimens')
    .update(updates)
    .eq('id', specimenId);
  if (error) throw new Error(error.message);
}

export async function deleteSpecimen(specimenId: string, imagePath: string): Promise<void> {
  await supabase.storage.from('specimens').remove([imagePath]);
  const { error } = await supabase.from('specimens').delete().eq('id', specimenId);
  if (error) throw new Error(error.message);
}
