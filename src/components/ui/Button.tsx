import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const VARIANTS = {
  primary: {
    container: {
      backgroundColor: Colors.forest,
      borderWidth: 0,
    } as ViewStyle,
    text: { color: Colors.parchment } as TextStyle,
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: Colors.forest,
    } as ViewStyle,
    text: { color: Colors.forest } as TextStyle,
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    } as ViewStyle,
    text: { color: Colors.forest } as TextStyle,
  },
  danger: {
    container: {
      backgroundColor: Colors.rust,
      borderWidth: 0,
    } as ViewStyle,
    text: { color: Colors.parchment } as TextStyle,
  },
};

export function Button({
  onPress,
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const v = VARIANTS[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        {
          minHeight: 56,
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
          ...(fullWidth && { width: '100%' }),
        },
        v.container,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'ghost' ? Colors.forest : Colors.parchment}
          size="small"
        />
      ) : (
        <Text
          style={[
            {
              fontSize: 16,
              fontFamily: 'Newsreader_600SemiBold',
              letterSpacing: 0.3,
            },
            v.text,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
