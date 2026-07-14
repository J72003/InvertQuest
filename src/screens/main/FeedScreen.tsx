import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export function FeedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.parchment }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text
          style={{
            fontFamily: 'CormorantGaramond_600SemiBold_Italic',
            fontSize: 32,
            color: Colors.forest,
            marginBottom: 12,
          }}
        >
          Class Feed
        </Text>
        <Text
          style={{
            fontFamily: 'Newsreader_400Regular',
            fontSize: 15,
            color: Colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Realtime classroom feed coming in Checkpoint C.
        </Text>
      </View>
    </SafeAreaView>
  );
}
