import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useSpecimens } from '../../hooks/useSpecimens';
import { useAuthStore } from '../../store/authStore';
import { TolerancePill } from '../../components/ui/TolerancePill';
import { Colors } from '../../constants/colors';
import type { SpecimenWithRelations } from '../../types/database';
import type { MainTabParamList, AppStackParamList } from '../../navigation/types';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Collection'>,
    NativeStackNavigationProp<AppStackParamList>
  >;
};

function SpecimenCard({
  specimen,
  onPress,
}: {
  specimen: SpecimenWithRelations;
  onPress: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.storage
      .from('specimens')
      .createSignedUrl(specimen.image_path, 604800)
      .then(({ data }) => {
        if (data?.signedUrl) setImageUrl(data.signedUrl);
      });
  }, [specimen.image_path]);

  const taxonName = specimen.taxon?.common_name ?? 'Unidentified';
  const date = new Date(specimen.captured_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        backgroundColor: Colors.parchment,
      }}
    >
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: Colors.inputBg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: Colors.borderLight,
        }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 68, height: 68 }}
            resizeMode="cover"
          />
        ) : (
          <ActivityIndicator size="small" color={Colors.textMuted} />
        )}
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={{
            fontFamily: 'Newsreader_600SemiBold',
            fontSize: 16,
            color: Colors.textPrimary,
          }}
        >
          {taxonName}
        </Text>
        <Text
          style={{
            fontFamily: 'Newsreader_400Regular_Italic',
            fontSize: 13,
            color: Colors.textMuted,
          }}
        >
          {date}
        </Text>
        {specimen.size_estimate && (
          <Text
            style={{
              fontFamily: 'Newsreader_400Regular',
              fontSize: 13,
              color: Colors.textSecondary,
            }}
          >
            {specimen.size_estimate}
          </Text>
        )}
      </View>

      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        {specimen.taxon && (
          <TolerancePill tolerance={specimen.taxon.tolerance} size="sm" />
        )}
        <Text style={{ fontSize: 16, color: Colors.textMuted }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 48 }}>{hasSearch ? '🔍' : '🔬'}</Text>
      <Text
        style={{
          fontFamily: 'CormorantGaramond_600SemiBold_Italic',
          fontSize: 24,
          color: Colors.forest,
          textAlign: 'center',
        }}
      >
        {hasSearch ? 'No matches' : 'No specimens yet'}
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
        {hasSearch
          ? 'Try a different taxon name or clear the search.'
          : 'Tap Capture to photograph your first freshwater invertebrate.'}
      </Text>
    </View>
  );
}

export function CollectionScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const { data: specimens, isLoading, error, refetch, isRefetching } = useSpecimens(
    user?.id ?? null,
  );
  const [search, setSearch] = useState('');

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const filtered = specimens?.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.taxon?.common_name?.toLowerCase().includes(q) ||
      s.taxon?.family?.toLowerCase().includes(q) ||
      s.habitat?.toLowerCase().includes(q)
    );
  }) ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.parchment }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text
          style={{
            fontFamily: 'CormorantGaramond_600SemiBold_Italic',
            fontSize: 32,
            color: Colors.forest,
          }}
        >
          My Specimens
        </Text>
        {specimens && specimens.length > 0 && (
          <Text
            style={{
              fontFamily: 'Newsreader_400Regular',
              fontSize: 13,
              color: Colors.textMuted,
              marginTop: 2,
            }}
          >
            {specimens.length} {specimens.length === 1 ? 'specimen' : 'specimens'} recorded
          </Text>
        )}
      </View>

      {/* Search bar */}
      {specimens && specimens.length > 0 && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by taxon, family, habitat…"
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
            style={{
              fontFamily: 'Newsreader_400Regular',
              fontSize: 15,
              color: Colors.textPrimary,
              backgroundColor: Colors.inputBg,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          />
        </View>
      )}

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
            Could not load specimens. Pull down to retry.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SpecimenCard
              specimen={item}
              onPress={() => navigation.navigate('SpecimenDetail', { specimenId: item.id })}
            />
          )}
          ListEmptyComponent={<EmptyState hasSearch={!!search.trim()} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={Colors.forest}
            />
          }
          contentContainerStyle={
            filtered.length === 0 ? { flex: 1 } : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}
