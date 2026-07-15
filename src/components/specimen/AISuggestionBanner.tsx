import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import type { AISuggestion } from '../../lib/identify';
import { TAXA } from '../../constants/taxa';
import { Colors } from '../../constants/colors';

interface AISuggestionBannerProps {
  suggestion: AISuggestion | null;
  isLoading: boolean;
  onAccept: (classIndex: number) => void;
}

const AGREEMENT_LABEL: Record<AISuggestion['agreement'], string> = {
  both: 'Both models agree',
  'roboflow-only': 'Only Roboflow responded',
  'claude-only': 'Only Claude responded',
  disagree: 'Models disagree. Lower confidence.',
  none: '',
};

export function AISuggestionBanner({ suggestion, isLoading, onAccept }: AISuggestionBannerProps) {
  if (!isLoading && !suggestion) return null;

  const taxon = suggestion ? TAXA.find((t) => t.modelClassIndex === suggestion.classIndex) : null;
  const pct = suggestion ? Math.round(suggestion.confidence * 100) : 0;
  const isHighConfidence = (suggestion?.confidence ?? 0) >= 0.7;

  return (
    <View
      style={{
        backgroundColor: isLoading ? Colors.parchmentDark : isHighConfidence ? Colors.forest + '12' : Colors.gold + '18',
        borderWidth: 1.5,
        borderColor: isLoading ? Colors.border : isHighConfidence ? Colors.forest + '40' : Colors.gold + '60',
        borderRadius: 10,
        padding: 14,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 18 }}>{isLoading ? '⏳' : '🤖'}</Text>
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={Colors.forest} />
              <Text
                style={{
                  fontFamily: 'Newsreader_400Regular_Italic',
                  fontSize: 14,
                  color: Colors.textSecondary,
                }}
              >
                Identifying specimen…
              </Text>
            </View>
          ) : taxon ? (
            <>
              <Text
                style={{
                  fontFamily: 'Newsreader_600SemiBold',
                  fontSize: 15,
                  color: Colors.textPrimary,
                }}
              >
                Looks like{' '}
                <Text style={{ color: Colors.forest }}>{taxon.commonName}</Text>
                {' '}({pct}%)
              </Text>
              <Text
                style={{
                  fontFamily: 'Newsreader_400Regular_Italic',
                  fontSize: 12,
                  color: Colors.textMuted,
                  marginTop: 2,
                }}
              >
                {AGREEMENT_LABEL[suggestion!.agreement]}
              </Text>
            </>
          ) : null}
        </View>

        {!isLoading && taxon && !isHighConfidence && (
          <TouchableOpacity
            onPress={() => onAccept(suggestion!.classIndex)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: Colors.forest,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                fontFamily: 'Newsreader_600SemiBold',
                fontSize: 12,
                color: Colors.parchment,
              }}
            >
              Use
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!isLoading && isHighConfidence && (
        <Text
          style={{
            fontFamily: 'Newsreader_400Regular',
            fontSize: 12,
            color: Colors.textSecondary,
          }}
        >
          Pre-selected below. Tap a different tile to change it.
        </Text>
      )}
    </View>
  );
}
