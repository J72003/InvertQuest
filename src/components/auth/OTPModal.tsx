import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';

export type OTPMode = 'backup' | 'signin';

interface Props {
  visible: boolean;
  mode: OTPMode;
  onDismiss: () => void;
  onSuccess?: () => void;
}

type Step = 'email' | 'otp' | 'done';

export function OTPModal({ visible, mode, onDismiss, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle magic link clicks (when Supabase sends a link instead of OTP code)
  useEffect(() => {
    if (!visible) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        setStep('done');
        onSuccess?.();
        setTimeout(() => { reset(); onDismiss(); }, 2000);
      }
    });
    return () => subscription.unsubscribe();
  }, [visible]);

  function reset() {
    setStep('email');
    setEmail('');
    setOtp('');
    setError(null);
    setLoading(false);
  }

  function handleDismiss() {
    reset();
    onDismiss();
  }

  async function handleSendCode() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === 'backup') {
        const { error: err } = await supabase.auth.updateUser({ email: trimmed });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithOtp({
          email: trimmed,
          options: { shouldCreateUser: false },
        });
        if (err) throw err;
      }
      setStep('otp');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (otp.length !== 6) {
      setError('Enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const type = mode === 'backup' ? 'email_change' : 'email';
      const { error: err } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp,
        type: type as any,
      });
      if (err) throw err;
      setStep('done');
      onSuccess?.();
      setTimeout(() => { reset(); onDismiss(); }, 2000);
    } catch (e: any) {
      setError(e?.message ?? 'Invalid code. Check your email and try again.');
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<Step, string> = {
    email: mode === 'backup' ? 'Save your data' : 'Sign in',
    otp: 'Check your email',
    done: mode === 'backup' ? 'Data saved!' : 'Signed in!',
  };

  const subtitles: Record<Step, string> = {
    email: mode === 'backup'
      ? 'Enter your email to back up your captures. You can access them from any device.'
      : 'Enter the email you used to back up your data.',
    otp: `Enter the 6-digit code we sent to ${email}. You can also click the link in the email directly.`,
    done: mode === 'backup'
      ? 'Your collection is now backed up and accessible from any device.'
      : 'You are now signed in. Your collection has been restored.',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.parchment }}>
        <KeyboardAvoidingView
          style={{ flex: 1, padding: 28, gap: 24 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {step !== 'done' && (
            <TouchableOpacity onPress={handleDismiss} style={{ alignSelf: 'flex-end' }}>
              <Text style={{ fontSize: 22, color: Colors.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}

          <View style={{ gap: 8 }}>
            <Text style={{
              fontFamily: 'CormorantGaramond_600SemiBold_Italic',
              fontSize: 34, color: Colors.forest,
            }}>
              {titles[step]}
            </Text>
            <Text style={{
              fontFamily: 'Newsreader_400Regular',
              fontSize: 15, color: Colors.textSecondary, lineHeight: 24,
            }}>
              {subtitles[step]}
            </Text>
          </View>

          {step === 'done' && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 72 }}>✓</Text>
            </View>
          )}

          {step === 'email' && (
            <View style={{ gap: 12 }}>
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                onSubmitEditing={handleSendCode}
                returnKeyType="send"
                style={{
                  fontFamily: 'Newsreader_400Regular', fontSize: 16,
                  color: Colors.textPrimary, backgroundColor: Colors.inputBg,
                  borderWidth: 1, borderColor: error ? Colors.rust : Colors.border,
                  borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14,
                }}
              />
              {error && (
                <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 13, color: Colors.rust }}>
                  {error}
                </Text>
              )}
              <TouchableOpacity
                onPress={handleSendCode}
                disabled={loading}
                style={{
                  backgroundColor: Colors.forest, borderRadius: 10,
                  paddingVertical: 16, alignItems: 'center',
                }}
              >
                {loading
                  ? <ActivityIndicator color={Colors.parchment} />
                  : <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 16, color: Colors.parchment }}>
                      Send Code
                    </Text>
                }
              </TouchableOpacity>
              {mode === 'backup' && (
                <TouchableOpacity onPress={handleDismiss} style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontFamily: 'Newsreader_400Regular_Italic', fontSize: 14, color: Colors.textMuted }}>
                    Skip for now
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {step === 'otp' && (
            <View style={{ gap: 12 }}>
              <TextInput
                value={otp}
                onChangeText={(t) => { setOtp(t.replace(/[^0-9]/g, '')); setError(null); }}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                placeholder="000000"
                placeholderTextColor={Colors.textMuted}
                style={{
                  fontFamily: 'Newsreader_400Regular', fontSize: 36,
                  letterSpacing: 12, textAlign: 'center',
                  color: Colors.textPrimary, backgroundColor: Colors.inputBg,
                  borderWidth: 1, borderColor: error ? Colors.rust : Colors.border,
                  borderRadius: 8, paddingHorizontal: 16, paddingVertical: 18,
                }}
              />
              {error && (
                <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 13, color: Colors.rust, textAlign: 'center' }}>
                  {error}
                </Text>
              )}
              <TouchableOpacity
                onPress={handleVerify}
                disabled={loading || otp.length !== 6}
                style={{
                  backgroundColor: otp.length === 6 ? Colors.forest : Colors.textMuted,
                  borderRadius: 10, paddingVertical: 16, alignItems: 'center',
                }}
              >
                {loading
                  ? <ActivityIndicator color={Colors.parchment} />
                  : <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 16, color: Colors.parchment }}>
                      Verify
                    </Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setStep('email'); setOtp(''); setError(null); }}
                style={{ alignItems: 'center', paddingVertical: 6 }}
              >
                <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 14, color: Colors.textMuted }}>
                  Use a different email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendCode} style={{ alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ fontFamily: 'Newsreader_400Regular_Italic', fontSize: 13, color: Colors.textMuted }}>
                  Resend code
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
