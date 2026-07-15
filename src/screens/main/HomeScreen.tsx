import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOfflineQueueStore } from '../../store/offlineQueueStore';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import type { MainTabParamList, AppStackParamList } from '../../navigation/types';

const ONBOARDING_KEY = 'onboarding_seen_v1';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Home'>,
    NativeStackNavigationProp<AppStackParamList>
  >;
};

function OnboardingModal({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Modal animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.parchment }}>
        <ScrollView
          contentContainerStyle={{ padding: 28, gap: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontFamily: 'CormorantGaramond_600SemiBold_Italic',
              fontSize: 36,
              color: Colors.forest,
              textAlign: 'center',
            }}
          >
            Welcome to InverteQuest
          </Text>
          <Text
            style={{
              fontFamily: 'Newsreader_400Regular_Italic',
              fontSize: 16,
              color: Colors.textSecondary,
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            Take photos of freshwater invertebrates, have AI identify them, and track the water quality at your sampling sites.
          </Text>

          {[
            {
              emoji: '🔬',
              title: 'How it works',
              body: 'Point your camera at a macroinvertebrate (a stonefly, mayfly, caddisfly, or similar) and InverteQuest uses AI to identify it from 13 indicator taxa.',
            },
            {
              emoji: '📍',
              title: 'What is a Site?',
              body: 'A site is a named sampling location, like a stretch of stream, a pool, or a riffle. Create one before capturing, and any specimen taken within 100 m will link to it automatically.',
            },
            {
              emoji: '📊',
              title: 'What is the FBI score?',
              body: 'The Family Biotic Index (FBI) scores water quality based on the pollution tolerance of the invertebrates you find. Sensitive species like stoneflies can only survive in clean water. Lower is better.\n\nA (0–3.75)   Excellent\nB (3.76–5.00)  Good\nC (5.01–6.50)  Fair\nD (6.51+)    Poor',
            },
            {
              emoji: '🦟',
              title: 'What is EPT?',
              body: 'EPT stands for Ephemeroptera (mayflies), Plecoptera (stoneflies), and Trichoptera (caddisflies). These three orders are the most sensitive to pollution and are used worldwide as water quality indicators. A high EPT count means healthy water.',
            },
          ].map((item) => (
            <View
              key={item.title}
              style={{
                backgroundColor: Colors.inputBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.borderLight,
                padding: 16,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
              <Text
                style={{
                  fontFamily: 'Newsreader_600SemiBold',
                  fontSize: 16,
                  color: Colors.forest,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontFamily: 'Newsreader_400Regular',
                  fontSize: 14,
                  color: Colors.textSecondary,
                  lineHeight: 22,
                }}
              >
                {item.body}
              </Text>
            </View>
          ))}

          <TouchableOpacity
            onPress={onDismiss}
            style={{
              backgroundColor: Colors.forest,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontFamily: 'Newsreader_600SemiBold',
                fontSize: 17,
                color: Colors.parchment,
              }}
            >
              Start Exploring
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function HomeScreen({ navigation }: Props) {
  const queue = useOfflineQueueStore((s) => s.queue);
  const hasQueue = queue.length > 0;
  const user = useAuthStore((s) => s.user);
  const isAnonymous = !user?.email;
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) setShowOnboarding(true);
    });
  }, []);

  async function dismissOnboarding() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.parchment }}>
      {showOnboarding && <OnboardingModal onDismiss={dismissOnboarding} />}

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
            {queue.length} specimen{queue.length > 1 ? 's' : ''} queued offline. Will sync when connected.
          </Text>
        </View>
      )}

      {/* Account button */}
      <View style={{ position: 'absolute', top: 56, right: 20, zIndex: 10 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Account')}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: isAnonymous ? Colors.gold + '25' : Colors.forest + '15',
            borderWidth: 1,
            borderColor: isAnonymous ? Colors.gold + '60' : Colors.forest + '30',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16 }}>{isAnonymous ? '⚠️' : '👤'}</Text>
        </TouchableOpacity>
      </View>

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
          Tap the button below to photograph and identify a freshwater invertebrate.
        </Text>

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

        <TouchableOpacity onPress={() => setShowOnboarding(true)}>
          <Text
            style={{
              fontFamily: 'Newsreader_400Regular_Italic',
              fontSize: 13,
              color: Colors.textMuted,
              textDecorationLine: 'underline',
            }}
          >
            What is InverteQuest?
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
