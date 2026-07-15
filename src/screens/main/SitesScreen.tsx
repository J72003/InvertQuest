import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useSites, type SiteWithMetrics } from '../../hooks/useSites';
import { createSite } from '../../lib/siteService';
import { useAuthStore } from '../../store/authStore';
import { queryClient } from '../../lib/queryClient';
import { Colors } from '../../constants/colors';

// ── FBI grade helpers ────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  A: Colors.gradeA,
  B: Colors.gradeB,
  C: Colors.gradeC,
  D: Colors.gradeD,
};

const GRADE_LABEL: Record<string, string> = {
  A: 'Excellent',
  B: 'Good',
  C: 'Fair',
  D: 'Poor',
};

function FBIBadge({ grade, score }: { grade: string | null; score: number | null }) {
  if (!grade || score === null) {
    return (
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: Colors.borderLight,
          backgroundColor: Colors.inputBg,
        }}
      >
        <Text
          style={{
            fontFamily: 'Newsreader_400Regular',
            fontSize: 12,
            color: Colors.textMuted,
          }}
        >
          No data yet
        </Text>
      </View>
    );
  }

  const color = GRADE_COLOR[grade];
  return (
    <View style={{ alignItems: 'flex-end', gap: 2 }}>
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 20,
          backgroundColor: color + '18',
          borderWidth: 1,
          borderColor: color + '50',
        }}
      >
        <Text
          style={{
            fontFamily: 'Newsreader_600SemiBold',
            fontSize: 13,
            color,
          }}
        >
          {grade} · {GRADE_LABEL[grade]}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: 'Newsreader_400Regular',
          fontSize: 11,
          color: Colors.textMuted,
        }}
      >
        FBI {score.toFixed(2)}
      </Text>
    </View>
  );
}

// ── Site card ────────────────────────────────────────────────────

function SiteCard({ site }: { site: SiteWithMetrics }) {
  const lastSampled = site.lastSampledAt
    ? new Date(site.lastSampledAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: Colors.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        padding: 16,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Newsreader_600SemiBold',
              fontSize: 17,
              color: Colors.textPrimary,
            }}
          >
            {site.name}
          </Text>
          {site.description ? (
            <Text
              style={{
                fontFamily: 'Newsreader_400Regular_Italic',
                fontSize: 13,
                color: Colors.textMuted,
                marginTop: 2,
              }}
            >
              {site.description}
            </Text>
          ) : null}
        </View>
        <FBIBadge grade={site.fbiGrade} score={site.fbiScore} />
      </View>

      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 13, color: Colors.textSecondary }}>
          {site.specimenCount} {site.specimenCount === 1 ? 'specimen' : 'specimens'}
        </Text>
        <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 13, color: Colors.textSecondary }}>
          {site.taxaRichness} taxa
        </Text>
        <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 13, color: Colors.textSecondary }}>
          {site.eptRichness} EPT
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: 'Newsreader_400Regular_Italic',
            fontSize: 12,
            color: Colors.textMuted,
            flex: 1,
          }}
        >
          {lastSampled ? `Last sampled ${lastSampled}` : 'No specimens linked yet — capture within 100 m'}
        </Text>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              `https://maps.google.com/?q=${site.latitude},${site.longitude}`,
            )
          }
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: Colors.border,
            backgroundColor: Colors.parchment,
            marginLeft: 8,
          }}
        >
          <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 12, color: Colors.forest }}>
            Open in Maps
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Create site modal ────────────────────────────────────────────

function CreateSiteModal({
  visible,
  userId,
  onClose,
}: {
  visible: boolean;
  userId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'found' | 'failed'>('idle');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const detectGPS = useCallback(async () => {
    setGpsStatus('locating');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatus('failed');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setGpsStatus('found');
    } catch {
      setGpsStatus('failed');
    }
  }, []);

  const handleOpen = useCallback(() => {
    setName('');
    setDescription('');
    setGpsStatus('idle');
    setCoords(null);
    setSaving(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give this site a name before saving.');
      return;
    }
    if (!coords) {
      Alert.alert('Location required', 'Tap "Detect GPS" to pin this site before saving.');
      return;
    }
    setSaving(true);
    try {
      await createSite({
        userId,
        name: name.trim(),
        description: description.trim() || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      await queryClient.invalidateQueries({ queryKey: ['sites'] });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not create site.');
    } finally {
      setSaving(false);
    }
  }, [name, description, coords, userId, onClose]);

  const gpsLabel =
    gpsStatus === 'idle' ? 'Detect GPS location'
    : gpsStatus === 'locating' ? 'Locating…'
    : gpsStatus === 'found' ? `📍 ${coords!.latitude.toFixed(5)}, ${coords!.longitude.toFixed(5)}`
    : 'GPS failed — try again';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onShow={handleOpen}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.parchment }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: Colors.borderLight,
            }}
          >
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 16, color: Colors.textMuted }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: 'CormorantGaramond_600SemiBold_Italic',
                fontSize: 22,
                color: Colors.forest,
              }}
            >
              New Site
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={Colors.forest} />
              ) : (
                <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 16, color: Colors.forest }}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20, gap: 20 }}>
            {/* Site name */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 14, color: Colors.textSecondary }}>
                Site Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. West Fork Riffle, Bridge Pool…"
                placeholderTextColor={Colors.textMuted}
                style={{
                  fontFamily: 'Newsreader_400Regular',
                  fontSize: 16,
                  color: Colors.textPrimary,
                  backgroundColor: Colors.inputBg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              />
            </View>

            {/* Description */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 14, color: Colors.textSecondary }}>
                Description (optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Substrate type, flow conditions, notes…"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                style={{
                  fontFamily: 'Newsreader_400Regular',
                  fontSize: 15,
                  color: Colors.textPrimary,
                  backgroundColor: Colors.inputBg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            {/* GPS */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 14, color: Colors.textSecondary }}>
                Location
              </Text>
              <TouchableOpacity
                onPress={detectGPS}
                disabled={gpsStatus === 'locating'}
                style={{
                  backgroundColor: gpsStatus === 'found' ? Colors.forest + '12' : Colors.inputBg,
                  borderWidth: 1,
                  borderColor: gpsStatus === 'found' ? Colors.forest + '40' : Colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {gpsStatus === 'locating' && (
                  <ActivityIndicator size="small" color={Colors.forest} />
                )}
                <Text
                  style={{
                    fontFamily: 'Newsreader_400Regular',
                    fontSize: 14,
                    color: gpsStatus === 'found' ? Colors.forest : gpsStatus === 'failed' ? Colors.rust : Colors.textMuted,
                    flex: 1,
                  }}
                >
                  {gpsLabel}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  fontFamily: 'Newsreader_400Regular_Italic',
                  fontSize: 12,
                  color: Colors.textMuted,
                }}
              >
                Stand at the sampling spot, then tap above. Specimens captured within 100 m will auto-link to this site.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main screen ──────────────────────────────────────────────────

export function SitesScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: sites, isLoading, error, refetch, isRefetching } = useSites(user?.id ?? null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.parchment }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: 'CormorantGaramond_600SemiBold_Italic',
              fontSize: 32,
              color: Colors.forest,
            }}
          >
            My Sites
          </Text>
          {sites && sites.length > 0 && (
            <Text
              style={{
                fontFamily: 'Newsreader_400Regular',
                fontSize: 13,
                color: Colors.textMuted,
                marginTop: 2,
              }}
            >
              {sites.length} {sites.length === 1 ? 'site' : 'sites'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.forest,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 22, color: Colors.parchment, lineHeight: 26 }}>+</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.forest} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text
            style={{
              fontFamily: 'Newsreader_400Regular',
              fontSize: 15,
              color: Colors.textSecondary,
              textAlign: 'center',
            }}
          >
            Could not load sites. Pull down to retry.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sites ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SiteCard site={item} />}
          contentContainerStyle={
            !sites || sites.length === 0 ? { flex: 1 } : { paddingTop: 4, paddingBottom: 32 }
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={Colors.forest}
            />
          }
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 48 }}>📍</Text>
              <Text
                style={{
                  fontFamily: 'CormorantGaramond_600SemiBold_Italic',
                  fontSize: 24,
                  color: Colors.forest,
                  textAlign: 'center',
                }}
              >
                No sites yet
              </Text>
              <Text
                style={{
                  fontFamily: 'Newsreader_400Regular',
                  fontSize: 15,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                Create a site at your sampling location. Specimens you capture within 100 m will automatically link to it and build a water quality score.
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreate(true)}
                style={{
                  marginTop: 8,
                  backgroundColor: Colors.forest,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Newsreader_600SemiBold',
                    fontSize: 15,
                    color: Colors.parchment,
                  }}
                >
                  Create First Site
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {user && (
        <CreateSiteModal
          visible={showCreate}
          userId={user.id}
          onClose={() => setShowCreate(false)}
        />
      )}
    </SafeAreaView>
  );
}
