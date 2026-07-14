import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T | null;
  onChange: (value: T) => void;
  label?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  return (
    <View style={{ gap: 8 }}>
      {label && (
        <Text
          style={{
            fontFamily: 'Newsreader_600SemiBold',
            fontSize: 14,
            color: Colors.textSecondary,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: Colors.parchmentDark,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: Colors.border,
          overflow: 'hidden',
        }}
      >
        {options.map((opt, i) => {
          const isSelected = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              activeOpacity={0.8}
              onPress={() => onChange(opt.value)}
              style={{
                flex: 1,
                minHeight: 48,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                paddingHorizontal: 8,
                backgroundColor: isSelected ? Colors.forest : 'transparent',
                borderLeftWidth: i > 0 ? 1 : 0,
                borderLeftColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Newsreader_600SemiBold',
                  fontSize: 13,
                  color: isSelected ? Colors.parchment : Colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
