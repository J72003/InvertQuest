import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainNavigator } from './MainNavigator';
import { CameraScreen } from '../screens/capture/CameraScreen';
import { DetailsScreen } from '../screens/capture/DetailsScreen';
import { SpecimenDetailScreen } from '../screens/specimen/SpecimenDetailScreen';
import { Colors } from '../constants/colors';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.parchment },
        headerTintColor: Colors.forest,
        headerTitleStyle: { fontFamily: 'Newsreader_600SemiBold' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ title: 'New Specimen', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="SpecimenDetail"
        component={SpecimenDetailScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
