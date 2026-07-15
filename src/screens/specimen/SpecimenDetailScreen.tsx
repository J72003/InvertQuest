import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Share,
  Modal,
  ActivityIndicator,
  Dimensions,
  Linking,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSpecimen } from '../../hooks/useSpecimen';
import { useTaxa } from '../../hooks/useTaxa';
import { updateSpecimen, deleteSpecimen } from '../../lib/specimenService';
import { queryClient } from '../../lib/queryClient';
import { supabase } from '../../lib/supabase';
import { TaxonPicker } from '../../components/specimen/TaxonPicker';
import { BehaviorChips } from '../../components/specimen/BehaviorChips';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { TolerancePill } from '../../components/ui/TolerancePill';
import { Colors } from '../../constants/colors';
import type { AppStackParamList } from '../../navigation/types';
import type { Behavior, ConfidenceLevel, SizeEstimate } from '../../types/database';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const SIZE_OPTIONS: Array<{ value: SizeEstimate; label: string }> = [
  { value: '<1cm', label: '<1 cm' },
  { value: '1-3cm', label: '1–3 cm' },
  { value: '3-10cm', label: '3–10 cm' },
  { value: '>10cm', label: '>10 cm' },
];

const CONFIDENCE_OPTIONS: Array<{ value: ConfidenceLevel; label: string }> = [
  { value: 'certain', label: 'Certain' },
  { value: 'likely', label: 'Likely' },
  { value: 'unsure', label: 'Unsure' },
];

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'SpecimenDetail'>;
  route: RouteProp<AppStackParamList, 'SpecimenDetail'>;
};

export function SpecimenDetailScreen({ navigation, route }: Props) {
  const { specimenId } = route.params;
  const { data: specimen, isLoading } = useSpecimen(specimenId);
  const { data: taxaRows } = useTaxa();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [photoFullscreen, setPhotoFullscreen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [taxonClassIndex, setTaxonClassIndex] = useState<number | null>(null);
  const [otherText, setOtherText] = useState('');
  const [sizeEstimate, setSizeEstimate] = useState<SizeEstimate | null>(null);
  const [habitat, setHabitat] = useState('');
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!specimen?.image_path) return;
    supabase.storage
      .from('specimens')
      .createSignedUrl(specimen.image_path, 3600)
      .then(({ data }) => { if (data?.signedUrl) setImageUrl(data.signedUrl); });
  }, [specimen?.image_path]);

  // Populate edit fields when specimen loads
  useEffect(() => {
    if (!specimen) return;
    const classIdx = specimen.taxon?.model_class_index ?? null;
    setTaxonClassIndex(classIdx);
    setSizeEstimate(specimen.size_estimate);
    setHabitat(specimen.habitat ?? '');
    setBehaviors((specimen.behaviors as Behavior[]) ?? []);
    setConfidence(specimen.confidence);
    setNotes(specimen.notes ?? '');
  }, [specimen]);

  function getTaxonId(): string | null {
    if (taxonClassIndex === null || taxonClassIndex === -1) return null;
    return taxaRows?.find((t) => t.model_class_index === taxonClassIndex)?.id ?? null;
  }

  async function handleSave() {
    if (!specimen) return;
    setSaving(true);
    try {
      await updateSpecimen(specimen.id, {
        taxon_id: getTaxonId(),
        size_estimate: sizeEstimate,
        habitat: habitat.trim() || null,
        behaviors,
        confidence,
        notes: notes.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ['specimen', specimenId] });
      await queryClient.invalidateQueries({ queryKey: ['specimens'] });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!specimen) return;
    Alert.alert(
      'Delete Specimen',
      'This will permanently delete the specimen and its photo. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteSpecimen(specimen.id, specimen.image_path);
              await queryClient.invalidateQueries({ queryKey: ['specimens'] });
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Could not delete specimen.');
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  async function handleShare() {
    if (!specimen) return;
    const taxonName = specimen.taxon?.common_name ?? 'Unidentified specimen';
    const date = new Date(specimen.captured_at).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    const gpsText = specimen.latitude
      ? `📍 ${specimen.latitude.toFixed(5)}, ${specimen.longitude?.toFixed(5)}`
      : '';
    const mapsUrl = specimen.latitude
      ? `https://maps.google.com/?q=${specimen.latitude},${specimen.longitude}`
      : '';

    await Share.share({
      message: [
        `${taxonName} — ${date}`,
        gpsText,
        specimen.notes ? `Notes: ${specimen.notes}` : '',
        mapsUrl,
        '\nCaptured with InverteQuest',
      ].filter(Boolean).join('\n'),
    });
  }

  if (isLoading || !specimen) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.forest} />
      </View>
    );
  }

  const taxonName = specimen.taxon?.common_name ?? 'Unidentified';
  const date = new Date(specimen.captured_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <>
      {/* Fullscreen photo modal */}
      <Modal visible={photoFullscreen} animationType="fade" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            maximumZoomScale={5}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: SCREEN_W, height: SCREEN_H }}
                resizeMode="contain"
              />
            ) : (
              <ActivityIndicator color="#fff" />
            )}
          </ScrollView>
          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <TouchableOpacity
              onPress={() => setPhotoFullscreen(false)}
              style={{
                margin: 16, width: 40, height: 40,
                backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.parchment }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.parchment }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 12, gap: 12,
          }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
              <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 16, color: Colors.forest }}>← Back</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            {editing ? (
              <>
                <TouchableOpacity onPress={() => setEditing(false)} style={{ padding: 4 }}>
                  <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 15, color: Colors.textMuted }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  style={{ backgroundColor: Colors.forest, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 }}
                >
                  {saving
                    ? <ActivityIndicator size="small" color={Colors.parchment} />
                    : <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 15, color: Colors.parchment }}>Save</Text>
                  }
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={handleShare} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 20 }}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditing(true)}
                  style={{ backgroundColor: Colors.forest + '18', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 }}
                >
                  <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 15, color: Colors.forest }}>Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo */}
          <TouchableOpacity activeOpacity={0.95} onPress={() => setPhotoFullscreen(true)}>
            <View style={{ width: SCREEN_W, height: SCREEN_W * 0.75, backgroundColor: Colors.inputBg }}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: SCREEN_W, height: SCREEN_W * 0.75 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={Colors.forest} />
                </View>
              )}
              <View style={{
                position: 'absolute', bottom: 10, right: 10,
                backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 6,
                paddingHorizontal: 8, paddingVertical: 4,
              }}>
                <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 11, color: '#fff' }}>
                  Tap to zoom
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={{ padding: 20, gap: 20 }}>
            {/* Taxon header */}
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold_Italic', fontSize: 30, color: Colors.forest, flex: 1 }}>
                  {editing
                    ? (taxonClassIndex !== null && taxonClassIndex !== -1
                        ? (taxaRows?.find(t => t.model_class_index === taxonClassIndex)?.common_name ?? 'Unidentified')
                        : 'Unidentified')
                    : taxonName}
                </Text>
                {!editing && specimen.taxon && (
                  <TolerancePill tolerance={specimen.taxon.tolerance} showValue size="sm" />
                )}
              </View>
              {!editing && specimen.taxon && (
                <Text style={{ fontFamily: 'Newsreader_400Regular_Italic', fontSize: 14, color: Colors.textMuted }}>
                  {specimen.taxon.family}
                </Text>
              )}
              <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 13, color: Colors.textMuted }}>
                {date}
              </Text>
            </View>

            {editing ? (
              /* ── EDIT MODE ── */
              <View style={{ gap: 24 }}>
                <TaxonPicker
                  value={taxonClassIndex}
                  otherText={otherText}
                  onChange={setTaxonClassIndex}
                  onOtherTextChange={setOtherText}
                />
                <SegmentedControl
                  label="Size"
                  options={SIZE_OPTIONS}
                  value={sizeEstimate}
                  onChange={setSizeEstimate}
                />
                <View style={{ gap: 6 }}>
                  <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 14, color: Colors.textSecondary }}>
                    Habitat
                  </Text>
                  <TextInput
                    value={habitat}
                    onChangeText={setHabitat}
                    placeholder="e.g. cobble riffle, leaf pack…"
                    placeholderTextColor={Colors.textMuted}
                    style={{
                      fontFamily: 'Newsreader_400Regular', fontSize: 15,
                      color: Colors.textPrimary, backgroundColor: Colors.inputBg,
                      borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
                      paddingHorizontal: 14, paddingVertical: 12,
                    }}
                  />
                </View>
                <BehaviorChips value={behaviors} onChange={setBehaviors} />
                <SegmentedControl
                  label="How confident are you?"
                  options={CONFIDENCE_OPTIONS}
                  value={confidence}
                  onChange={setConfidence}
                />
                <View style={{ gap: 6 }}>
                  <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 14, color: Colors.textSecondary }}>
                    Notes
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Any additional observations…"
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={3}
                    style={{
                      fontFamily: 'Newsreader_400Regular', fontSize: 15,
                      color: Colors.textPrimary, backgroundColor: Colors.inputBg,
                      borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
                      paddingHorizontal: 14, paddingVertical: 12,
                      minHeight: 88, textAlignVertical: 'top',
                    }}
                  />
                </View>
              </View>
            ) : (
              /* ── VIEW MODE ── */
              <View style={{ gap: 16 }}>
                {/* Metadata grid */}
                <View style={{
                  flexDirection: 'row', flexWrap: 'wrap', gap: 10,
                  backgroundColor: Colors.inputBg, borderRadius: 10,
                  borderWidth: 1, borderColor: Colors.borderLight, padding: 14,
                }}>
                  {[
                    { label: 'Size', value: specimen.size_estimate },
                    { label: 'Confidence', value: specimen.confidence },
                    { label: 'Habitat', value: specimen.habitat },
                  ].filter(r => r.value).map(row => (
                    <View key={row.label} style={{ minWidth: '45%', flex: 1, gap: 2 }}>
                      <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {row.label}
                      </Text>
                      <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Behaviors */}
                {specimen.behaviors && specimen.behaviors.length > 0 && (
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 14, color: Colors.textSecondary }}>
                      Behaviors
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {(specimen.behaviors as string[]).map(b => (
                        <View key={b} style={{
                          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                          backgroundColor: Colors.forest, borderWidth: 1, borderColor: Colors.forest,
                        }}>
                          <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 13, color: Colors.parchment }}>
                            {b}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Notes */}
                {specimen.notes && (
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 14, color: Colors.textSecondary }}>
                      Notes
                    </Text>
                    <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 15, color: Colors.textPrimary, lineHeight: 22 }}>
                      {specimen.notes}
                    </Text>
                  </View>
                )}

                {/* Ecological info */}
                {specimen.taxon?.ecological_notes && (
                  <View style={{
                    backgroundColor: Colors.forest + '08', borderRadius: 10,
                    borderWidth: 1, borderColor: Colors.forest + '20', padding: 14, gap: 6,
                  }}>
                    <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 13, color: Colors.forest }}>
                      About this taxon
                    </Text>
                    <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 }}>
                      {specimen.taxon.ecological_notes}
                    </Text>
                  </View>
                )}

                {/* GPS */}
                {specimen.latitude && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://maps.google.com/?q=${specimen.latitude},${specimen.longitude}`)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      backgroundColor: Colors.inputBg, borderRadius: 10,
                      borderWidth: 1, borderColor: Colors.borderLight, padding: 14,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 14, color: Colors.forest }}>
                        Open in Maps
                      </Text>
                      <Text style={{ fontFamily: 'Newsreader_400Regular_Italic', fontSize: 12, color: Colors.textMuted }}>
                        {specimen.latitude.toFixed(5)}, {specimen.longitude?.toFixed(5)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: Colors.textMuted }}>›</Text>
                  </TouchableOpacity>
                )}

                {/* Delete */}
                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={deleting}
                  style={{
                    marginTop: 8, paddingVertical: 14, borderRadius: 10,
                    borderWidth: 1, borderColor: Colors.rust + '60',
                    backgroundColor: Colors.rust + '08', alignItems: 'center',
                  }}
                >
                  {deleting
                    ? <ActivityIndicator size="small" color={Colors.rust} />
                    : <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 15, color: Colors.rust }}>
                        Delete Specimen
                      </Text>
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
