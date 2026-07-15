import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import type { AppStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Account'>;
};

function getRedirectUrl(): string | undefined {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return undefined;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 16, color: Colors.textPrimary }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function SuccessBox({ message }: { message: string }) {
  return (
    <View style={{
      backgroundColor: Colors.gradeA + '15', borderRadius: 10,
      borderWidth: 1, borderColor: Colors.gradeA + '50', padding: 14,
    }}>
      <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 }}>
        {message}
      </Text>
    </View>
  );
}

function EmailInput({
  value,
  onChangeText,
  placeholder = 'your@email.com',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      style={{
        fontFamily: 'Newsreader_400Regular', fontSize: 15,
        color: Colors.textPrimary, backgroundColor: Colors.inputBg,
        borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 12,
      }}
    />
  );
}

export function AccountScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const isAnonymous = !user?.email;

  const [backupEmail, setBackupEmail] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSent, setBackupSent] = useState(false);

  const [signinEmail, setSigninEmail] = useState('');
  const [signinLoading, setSigninLoading] = useState(false);
  const [signinSent, setSigninSent] = useState(false);

  async function handleBackup() {
    const email = backupEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    setBackupLoading(true);
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: getRedirectUrl() },
    );
    setBackupLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setBackupSent(true);
  }

  async function handleSignIn() {
    const email = signinEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    setSigninLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: getRedirectUrl() },
    });
    setSigninLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setSigninSent(true);
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
        contentContainerStyle={{ padding: 20, gap: 28 }}
        keyboardShouldPersistTaps="handled"
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
                Clearing your browser data or switching devices will lose your collection. Link an email to access it from anywhere.
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

        {/* Backup (anonymous users only) */}
        {isAnonymous && (
          <Section title="Back up your data">
            <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 }}>
              Enter your email. You will get a confirmation link. Once you click it, your collection is linked to that address and accessible from any device.
            </Text>
            {backupSent ? (
              <SuccessBox message="Check your email and click the confirmation link. Once confirmed, your data is backed up." />
            ) : (
              <>
                <EmailInput value={backupEmail} onChangeText={setBackupEmail} />
                <TouchableOpacity
                  onPress={handleBackup}
                  disabled={backupLoading}
                  style={{ backgroundColor: Colors.forest, borderRadius: 8, paddingVertical: 13, alignItems: 'center' }}
                >
                  {backupLoading
                    ? <ActivityIndicator size="small" color={Colors.parchment} />
                    : <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 15, color: Colors.parchment }}>
                        Save my data
                      </Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </Section>
        )}

        {/* Sign in on this device */}
        <Section title="Sign in on this device">
          <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 }}>
            If you backed up your data on another device, enter that email to access your collection here.
          </Text>
          {signinSent ? (
            <SuccessBox message="Check your email and click the sign-in link." />
          ) : (
            <>
              <EmailInput value={signinEmail} onChangeText={setSigninEmail} />
              <TouchableOpacity
                onPress={handleSignIn}
                disabled={signinLoading}
                style={{
                  backgroundColor: Colors.inputBg, borderRadius: 8,
                  paddingVertical: 13, alignItems: 'center',
                  borderWidth: 1, borderColor: Colors.border,
                }}
              >
                {signinLoading
                  ? <ActivityIndicator size="small" color={Colors.forest} />
                  : <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 15, color: Colors.forest }}>
                      Send sign-in link
                    </Text>
                }
              </TouchableOpacity>
            </>
          )}
        </Section>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            paddingVertical: 13, borderRadius: 10,
            borderWidth: 1, borderColor: Colors.rust + '60',
            backgroundColor: Colors.rust + '08', alignItems: 'center',
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
