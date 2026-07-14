import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { AppNavigator } from './AppNavigator';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.parchment, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <ActivityIndicator size="large" color={Colors.forest} />
    </View>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.parchment, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
      <Text style={{ fontSize: 32 }}>⚠️</Text>
      <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 18, color: Colors.forest, textAlign: 'center' }}>
        Cannot connect to server
      </Text>
      <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
        {message}
      </Text>
      <Text style={{ fontFamily: 'Newsreader_400Regular_Italic', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>
        Retrying automatically…
      </Text>
    </View>
  );
}

export function RootNavigator() {
  const { session, isLoading, error } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;
  if (!session) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="App" component={AppNavigator} />
    </Stack.Navigator>
  );
}
