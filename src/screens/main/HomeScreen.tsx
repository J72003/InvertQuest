import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOfflineQueueStore } from '../../store/offlineQueueStore';
import { Colors } from '../../constants/colors';
import type { MainTabParamList, AppStackParamList } from '../../navigation/types';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Home'>,
    NativeStackNavigationProp<AppStackParamList>
  >;
};

export function HomeScreen({ navigation }: Props) {
  const queue = useOfflineQueueStore((s) => s.queue);
  const hasQueue = queue.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.parchment }}>
      {/* Offline banner */}
      {hasQueue && (
        <View
          style={{
            backgroundColor: Colors.gold,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Text
            style={{
              fontFamily: 'Newsreader_600SemiBold',
              fontSize: 13,
              color: Colors.forest,
              textAlign: 'center',
            }}
          >
            {queue.length} specimen{queue.length > 1 ? 's' : ''} queued offline — will sync when connected
          </Text>
        </View>
      )}

      {/* Main content */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          gap: 24,
        }}
      >
        <Text
          style={{
            fontFamily: 'CormorantGaramond_600SemiBold_Italic',
            fontSize: 40,
            color: Colors.forest,
            letterSpacing: 0.5,
          }}
        >
          Fieldnotes
        </Text>
        <Text
          style={{
            fontFamily: 'Newsreader_400Regular_Italic',
            fontSize: 15,
            color: Colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          Tap below to photograph and identify a freshwater invertebrate.
        </Text>

        {/* Primary action button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Camera')}
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: Colors.forest,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: Colors.forest,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 52 }}>🔬</Text>
          <Text
            style={{
              fontFamily: 'Newsreader_600SemiBold',
              fontSize: 17,
              color: Colors.parchment,
              letterSpacing: 0.3,
            }}
          >
            New Specimen
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
