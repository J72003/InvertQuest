import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useSpecimens } from '../../hooks/useSpecimens';
import { useAuthStore } from '../../store/authStore';
import { TolerancePill } from '../../components/ui/TolerancePill';
import { Colors } from '../../constants/colors';
import type { SpecimenWithRelations } from '../../types/database';

function SpecimenCard({ specimen }: { specimen: SpecimenWithRelations }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.storage
      .from('specimens')
      .createSignedUrl(specimen.image_path, 3600)
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
    <View
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

      {specimen.taxon && (
        <TolerancePill tolerance={specimen.taxon.tolerance} size="sm" />
      )}
    </View>
  );
}

function EmptyState() {
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
      <Text style={{ fontSize: 48 }}>🔬</Text>
      <Text
        style={{
          fontFamily: 'CormorantGaramond_600SemiBold_Italic',
          fontSize: 24,
          color: Colors.forest,
          textAlign: 'center',
        }}
      >
        No specimens yet
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
        Tap Capture to photograph your first freshwater invertebrate.
      </Text>
    </View>
  );
}

export function CollectionScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: specimens, isLoading, error, refetch, isRefetching } = useSpecimens(
    user?.id ?? null,
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.parchment }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
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
          data={specimens ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SpecimenCard specimen={item} />}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={Colors.forest}
            />
          }
          contentContainerStyle={
            !specimens || specimens.length === 0 ? { flex: 1 } : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}
