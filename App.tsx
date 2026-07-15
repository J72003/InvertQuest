import './global.css';
import React, { useEffect, Component, type ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  CormorantGaramond_400Regular,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';
import { View, Text, ActivityIndicator } from 'react-native';
import { queryClient } from './src/lib/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthListener } from './src/hooks/useAuth';
import { useOfflineSync } from './src/hooks/useOfflineSync';
import { useOfflineQueueStore } from './src/store/offlineQueueStore';
import { Colors } from './src/constants/colors';
import { Toast } from './src/components/ui/Toast';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: any) {
    return { error: e?.message ?? String(e) };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#f1e8d0', padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#8b3a1f', marginTop: 60, marginBottom: 12 }}>
            Crash Details
          </Text>
          <Text style={{ fontSize: 13, color: '#1a1a14', lineHeight: 20 }}>
            {this.state.error}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  useAuthListener();
  useOfflineSync();
  const hydrateQueue = useOfflineQueueStore((s) => s.hydrate);

  useEffect(() => {
    hydrateQueue();
  }, [hydrateQueue]);

  return (
    <>
      <RootNavigator />
      <Toast />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_600SemiBold_Italic,
    CormorantGaramond_700Bold,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.parchment, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.forest} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer>
              <StatusBar style="dark" />
              <AppContent />
            </NavigationContainer>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
