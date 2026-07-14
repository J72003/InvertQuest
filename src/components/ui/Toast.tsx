import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '../../store/toastStore';
import { Colors } from '../../constants/colors';

const TOAST_DURATION = 2800;
const ANIMATION_MS = 220;

export function Toast() {
  const { message, type, hide } = useToastStore();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;

    // Slide in
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: ANIMATION_MS, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: ANIMATION_MS, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      // Slide out
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: ANIMATION_MS, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: ANIMATION_MS, useNativeDriver: true }),
      ]).start(() => hide());
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [message, opacity, translateY, hide]);

  if (!message) return null;

  const bgColor = type === 'success' ? Colors.forest : type === 'error' ? Colors.rust : Colors.gold;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
        right: 16,
        zIndex: 9999,
        opacity,
        transform: [{ translateY }],
      }}
      pointerEvents="none"
    >
      <View
        style={{
          backgroundColor: bgColor,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Text
          style={{
            fontFamily: 'Newsreader_600SemiBold',
            fontSize: 14,
            color: Colors.parchment,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
