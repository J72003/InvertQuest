import React, { forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  hint?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, containerStyle, hint, style, ...props },
  ref,
) {
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontFamily: 'Newsreader_600SemiBold',
            fontSize: 14,
            color: Colors.textSecondary,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        placeholderTextColor={Colors.textMuted}
        style={[
          {
            minHeight: 52,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: error ? Colors.rust : Colors.border,
            backgroundColor: Colors.inputBg,
            fontFamily: 'Newsreader_400Regular',
            fontSize: 16,
            color: Colors.textPrimary,
          },
          style,
        ]}
        {...props}
      />
      {hint && !error && (
        <Text
          style={{
            fontFamily: 'Newsreader_400Regular',
            fontSize: 13,
            color: Colors.textMuted,
          }}
        >
          {hint}
        </Text>
      )}
      {error && (
        <Text
          style={{
            fontFamily: 'Newsreader_400Regular',
            fontSize: 13,
            color: Colors.rust,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
});
