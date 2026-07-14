import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useAIIdentification } from '../../hooks/useAIIdentification';
import { useTaxa } from '../../hooks/useTaxa';
import { useCaptureStore } from '../../store/captureStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { saveSpecimen } from '../../lib/specimenService';
import { queryClient } from '../../lib/queryClient';
import { AISuggestionBanner } from '../../components/specimen/AISuggestionBanner';
import { BBoxOverlay } from '../../components/specimen/BBoxOverlay';
import { TaxonPicker } from '../../components/specimen/TaxonPicker';
import { BehaviorChips } from '../../components/specimen/BehaviorChips';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';
import type { Behavior, ConfidenceLevel, SizeEstimate } from '../../types/database';

const { width: SCREEN_W } = Dimensions.get('window');

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
  navigation: CompositeNavigationProp<
    NativeStackNavigationProp<AppStackParamList, 'Details'>,
    BottomTabNavigationProp<MainTabParamList>
  >;
};

export function DetailsScreen({ navigation }: Props) {
  const pending = useCaptureStore((s) => s.pending);
  const clearPending = useCaptureStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const { data: taxaRows } = useTaxa();
  const showToast = useToastStore((s) => s.show);

  const { aiPrediction, suggestion, isLoading: aiLoading } = useAIIdentification(
    pending?.imageBase64 ?? null,
  );

  // Form state
  const [taxonClassIndex, setTaxonClassIndex] = useState<number | null>(null);
  const [otherText, setOtherText] = useState('');
  const [sizeEstimate, setSizeEstimate] = useState<SizeEstimate | null>(null);
  const [habitat, setHabitat] = useState('');
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pre-select taxon when AI result arrives with high confidence
  const didAutoSelect = useRef(false);
  useEffect(() => {
    if (suggestion && !didAutoSelect.current && suggestion.confidence >= 0.7) {
      setTaxonClassIndex(suggestion.classIndex);
      didAutoSelect.current = true;
    }
  }, [suggestion]);

  // If navigated here without pending data (e.g. direct nav), go back
  useEffect(() => {
    if (!pending) navigation.goBack();
  }, [pending, navigation]);

  if (!pending) return null;

  const imageAspect = pending.imageWidth / pending.imageHeight;
  const displayW = SCREEN_W;
  const displayH = displayW / imageAspect;

  // Look up the database taxon ID for the selected class index
  function getTaxonId(): string | null {
    if (taxonClassIndex === null || taxonClassIndex === -1) return null;
    return taxaRows?.find((t) => t.model_class_index === taxonClassIndex)?.id ?? null;
  }

  async function handleSave() {
    if (!user) return;

    // Require at least a taxon selection (or "Other") before saving
    if (taxonClassIndex === null) {
      Alert.alert('Identify the specimen', 'Select a taxon tile or choose "Other / Not sure" before saving.');
      return;
    }

    if (!pending) return;
    setIsSaving(true);
    const snap = pending; // stable reference for async closure
    try {
      const { queued } = await saveSpecimen({
        userId: user.id,
        classroomId: null,
        localImageUri: snap.localImageUri,
        imageBase64: snap.imageBase64,
        taxonId: getTaxonId(),
        sizeEstimate,
        habitat: habitat.trim() || null,
        behaviors,
        confidence,
        notes: notes.trim() || null,
        latitude: snap.latitude,
        longitude: snap.longitude,
        aiPredictions: aiPrediction,
        capturedAt: snap.capturedAt,
      });

      clearPending();
      await queryClient.invalidateQueries({ queryKey: ['specimens'] });

      showToast(queued ? 'Saved offline — will sync when connected' : 'Specimen saved!', queued ? 'info' : 'success');

      // Navigate back to Home tab
      navigation.navigate('MainTabs', { screen: 'Collection' });
    } catch (e: any) {
      Alert.alert('Save Failed', e?.message ?? 'Could not save specimen. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.parchment }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo with bbox overlay */}
          <View style={{ width: displayW, height: displayH }}>
            <Image
              source={{ uri: pending.localImageUri }}
              style={{ width: displayW, height: displayH }}
              resizeMode="cover"
            />
            {suggestion?.bbox && (
              <BBoxOverlay
                bbox={suggestion.bbox}
                classIndex={suggestion.classIndex}
                confidence={suggestion.confidence}
                imageWidth={pending.imageWidth}
                imageHeight={pending.imageHeight}
                displayWidth={displayW}
                displayHeight={displayH}
              />
            )}
          </View>

          {/* Form body */}
          <View style={{ padding: 20, gap: 24 }}>
            <View>
              <Text
                style={{
                  fontFamily: 'CormorantGaramond_600SemiBold_Italic',
                  fontSize: 28,
                  color: Colors.forest,
                }}
              >
                New Specimen
              </Text>
              {pending.latitude && (
                <Text
                  style={{
                    fontFamily: 'Newsreader_400Regular_Italic',
                    fontSize: 13,
                    color: Colors.textMuted,
                    marginTop: 2,
                  }}
                >
                  📍 {pending.latitude.toFixed(5)}, {pending.longitude?.toFixed(5)}
                </Text>
              )}
            </View>

            {/* AI suggestion banner */}
            <AISuggestionBanner
              suggestion={suggestion}
              isLoading={aiLoading}
              onAccept={(idx) => setTaxonClassIndex(idx)}
            />

            {/* Taxon picker */}
            <TaxonPicker
              value={taxonClassIndex}
              otherText={otherText}
              onChange={setTaxonClassIndex}
              onOtherTextChange={setOtherText}
            />

            {/* Size */}
            <SegmentedControl
              label="Size"
              options={SIZE_OPTIONS}
              value={sizeEstimate}
              onChange={setSizeEstimate}
            />

            {/* Habitat */}
            <Input
              label="Habitat"
              placeholder="e.g. cobble riffle, leaf pack, sandy pool edge…"
              value={habitat}
              onChangeText={setHabitat}
            />

            {/* Behaviors */}
            <BehaviorChips value={behaviors} onChange={setBehaviors} />

            {/* Confidence */}
            <SegmentedControl
              label="How confident are you?"
              options={CONFIDENCE_OPTIONS}
              value={confidence}
              onChange={setConfidence}
            />

            {/* Notes */}
            <Input
              label="Notes (optional)"
              placeholder="Any additional observations…"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              style={{ minHeight: 88, textAlignVertical: 'top' }}
            />
          </View>
        </ScrollView>

        {/* Sticky save button */}
        <SafeAreaView
          edges={['bottom']}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.parchment,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            padding: 16,
          }}
        >
          <Button
            label="Save Specimen"
            onPress={handleSave}
            loading={isSaving}
            fullWidth
          />
        </SafeAreaView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
