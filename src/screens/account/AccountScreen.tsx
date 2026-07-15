import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { OTPModal, OTPMode } from '../../components/auth/OTPModal';
import { Colors } from '../../constants/colors';
import type { AppStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Account'>;
};

export function AccountScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const isAnonymous = !user?.email;

  const [otpVisible, setOtpVisible] = useState(false);
  const [otpMode, setOtpMode] = useState<OTPMode>('backup');

  function openModal(mode: OTPMode) {
    setOtpMode(mode);
    setOtpVisible(true);
  }

  async function handleSignOut() {
    Alert.alert(
      'Sign out',
      isAnonymous
        ? 'Your specimens are not backed up. If you sign out, they cannot be recovered. Back up your data first.'
        : 'You can sign back in at any time using your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.parchment }}>
      <OTPModal
        visible={otpVisible}
        mode={otpMode}
        onDismiss={() => setOtpVisible(false)}
      />

      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 16, color: Colors.forest }}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={{
          fontFamily: 'CormorantGaramond_600SemiBold_Italic',
          fontSize: 22, color: Colors.forest, marginLeft: 16,
        }}>
          Account
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        <View style={{
          backgroundColor: Colors.inputBg, borderRadius: 12,
          borderWidth: 1, borderColor: Colors.borderLight, padding: 16, gap: 6,
        }}>
          {isAnonymous ? (
            <>
              <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 15, color: Colors.textPrimary }}>
                Data stored on this device only
              </Text>
              <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 }}>
                Clearing your browser data or switching devices will lose your collection. Link an email to access it anywhere.
              </Text>
            </>
          ) : (
            <>
              <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 15, color: Colors.gradeA }}>
                Backed up
              </Text>
              <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 14, color: Colors.textPrimary }}>
                {user.email}
              </Text>
              <Text style={{ fontFamily: 'Newsreader_400Regular_Italic', fontSize: 12, color: Colors.textMuted }}>
                Your collection is accessible from any device.
              </Text>
            </>
          )}
        </View>

        {/* Back up (anonymous only) */}
        {isAnonymous && (
          <TouchableOpacity
            onPress={() => openModal('backup')}
            style={{
              backgroundColor: Colors.forest, borderRadius: 10,
              paddingVertical: 16, alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 16, color: Colors.parchment }}>
              Save my data
            </Text>
          </TouchableOpacity>
        )}

        {/* Sign in on this device */}
        <TouchableOpacity
          onPress={() => openModal('signin')}
          style={{
            backgroundColor: Colors.inputBg, borderRadius: 10,
            paddingVertical: 16, alignItems: 'center',
            borderWidth: 1, borderColor: Colors.border,
          }}
        >
          <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 16, color: Colors.forest }}>
            Sign in on this device
          </Text>
        </TouchableOpacity>
        <Text style={{
          fontFamily: 'Newsreader_400Regular_Italic',
          fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: -8,
        }}>
          Already backed up on another device? Sign in here to restore your collection.
        </Text>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            paddingVertical: 14, borderRadius: 10,
            borderWidth: 1, borderColor: Colors.rust + '60',
            backgroundColor: Colors.rust + '08', alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 15, color: Colors.rust }}>
            Sign out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
