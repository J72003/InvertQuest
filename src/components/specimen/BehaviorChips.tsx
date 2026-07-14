import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Behavior } from '../../types/database';
import { Colors } from '../../constants/colors';

const ALL_BEHAVIORS: Behavior[] = [
  'Crawling',
  'Swimming',
  'Clinging to rocks',
  'Burrowing',
  'In a case-shelter',
  'Feeding',
  'Stationary',
  'In a group',
];

interface BehaviorChipsProps {
  value: Behavior[];
  onChange: (behaviors: Behavior[]) => void;
}

export function BehaviorChips({ value, onChange }: BehaviorChipsProps) {
  function toggle(b: Behavior) {
    if (value.includes(b)) {
      onChange(value.filter((x) => x !== b));
    } else {
      onChange([...value, b]);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: 'Newsreader_600SemiBold',
          fontSize: 14,
          color: Colors.textSecondary,
        }}
      >
        Behaviors observed
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ALL_BEHAVIORS.map((b) => {
          const active = value.includes(b);
          return (
            <TouchableOpacity
              key={b}
              activeOpacity={0.75}
              onPress={() => toggle(b)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: active ? Colors.forest : Colors.border,
                backgroundColor: active ? Colors.forest : Colors.inputBg,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Newsreader_600SemiBold',
                  fontSize: 13,
                  color: active ? Colors.parchment : Colors.textSecondary,
                }}
              >
                {b}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
