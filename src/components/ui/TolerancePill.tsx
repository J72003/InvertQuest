import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../../constants/colors';
import { getTolerance } from '../../constants/taxa';

interface TolerancePillProps {
  tolerance: number;
  showValue?: boolean;
  size?: 'sm' | 'md';
}

export function TolerancePill({ tolerance, showValue = false, size = 'md' }: TolerancePillProps) {
  const level = getTolerance(tolerance);
  const colorSet = Colors[level];
  const isSm = size === 'sm';

  const labels: Record<string, string> = {
    sensitive: 'Sensitive',
    moderate: 'Moderate',
    tolerant: 'Tolerant',
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: isSm ? 8 : 10,
        paddingVertical: isSm ? 3 : 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colorSet.border,
        backgroundColor: colorSet.bg,
        gap: 4,
      }}
    >
      <Text
        style={{
          fontFamily: 'Newsreader_600SemiBold',
          fontSize: isSm ? 11 : 12,
          color: colorSet.text,
          letterSpacing: 0.3,
        }}
      >
        {labels[level]}
        {showValue ? ` · ${tolerance.toFixed(1)}` : ''}
      </Text>
    </View>
  );
}
