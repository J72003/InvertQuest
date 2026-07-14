import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/main/HomeScreen';
import { CollectionScreen } from '../screens/main/CollectionScreen';
import { SitesScreen } from '../screens/main/SitesScreen';
import { GuideScreen } from '../screens/main/GuideScreen';
import { Colors } from '../constants/colors';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.forest,
          borderTopColor: Colors.forestLight,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.parchment,
        tabBarInactiveTintColor: Colors.parchment + '88',
        tabBarLabelStyle: {
          fontFamily: 'Newsreader_400Regular',
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Capture',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔬" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{
          tabBarLabel: 'My Specimens',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Sites"
        component={SitesScreen}
        options={{
          tabBarLabel: 'Sites',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Guide"
        component={GuideScreen}
        options={{
          tabBarLabel: 'Guide',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
