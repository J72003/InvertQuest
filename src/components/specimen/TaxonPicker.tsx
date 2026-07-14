import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { TAXA_BY_ORDER, ORDER_COMMON_NAMES, getTolerance } from '../../constants/taxa';
import type { TaxonOrder } from '../../constants/taxa';
import { Colors } from '../../constants/colors';
import { Input } from '../ui/Input';

const ORDERS: TaxonOrder[] = ['Ephemeroptera', 'Trichoptera', 'Coleoptera', 'Lepidoptera', 'Amphipoda'];
const OTHER_INDEX = -1;

interface TaxonPickerProps {
  value: number | null; // model_class_index, or -1 for "Other"
  otherText: string;
  onChange: (classIndex: number | null) => void;
  onOtherTextChange: (text: string) => void;
}

const TOLERANCE_COLORS: Record<string, { bg: string; text: string }> = {
  sensitive: Colors.sensitive,
  moderate: Colors.moderate,
  tolerant: Colors.tolerant,
};

export function TaxonPicker({ value, otherText, onChange, onOtherTextChange }: TaxonPickerProps) {
  return (
    <View style={{ gap: 16 }}>
      <Text
        style={{
          fontFamily: 'Newsreader_600SemiBold',
          fontSize: 14,
          color: Colors.textSecondary,
        }}
      >
        Taxon Identification
      </Text>

      {ORDERS.map((order) => (
        <View key={order} style={{ gap: 8 }}>
          <Text
            style={{
              fontFamily: 'CormorantGaramond_600SemiBold_Italic',
              fontSize: 16,
              color: Colors.forest,
            }}
          >
            {ORDER_COMMON_NAMES[order]}
            {'  '}
            <Text
              style={{
                fontFamily: 'Newsreader_400Regular_Italic',
                fontSize: 13,
                color: Colors.textMuted,
              }}
            >
              {order}
            </Text>
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TAXA_BY_ORDER[order].map((taxon) => {
              const isSelected = value === taxon.modelClassIndex;
              const tol = getTolerance(taxon.tolerance);
              const tolColors = TOLERANCE_COLORS[tol];

              return (
                <TouchableOpacity
                  key={taxon.modelClassIndex}
                  activeOpacity={0.75}
                  onPress={() => onChange(isSelected ? null : taxon.modelClassIndex)}
                  style={{
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? Colors.forest : Colors.borderLight,
                    backgroundColor: isSelected ? Colors.forest : Colors.inputBg,
                    padding: 12,
                    minWidth: 140,
                    flex: 1,
                    gap: 4,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Newsreader_600SemiBold',
                      fontSize: 14,
                      color: isSelected ? Colors.parchment : Colors.textPrimary,
                    }}
                    numberOfLines={2}
                  >
                    {taxon.commonName}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Newsreader_400Regular_Italic',
                      fontSize: 11,
                      color: isSelected ? Colors.parchment + 'bb' : Colors.textMuted,
                    }}
                  >
                    {taxon.family}
                  </Text>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 20,
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : tolColors.bg,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Newsreader_600SemiBold',
                        fontSize: 10,
                        color: isSelected ? Colors.parchment : tolColors.text,
                      }}
                    >
                      tol {taxon.tolerance}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* Other / Not sure */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onChange(value === OTHER_INDEX ? null : OTHER_INDEX)}
        style={{
          borderRadius: 10,
          borderWidth: 2,
          borderColor: value === OTHER_INDEX ? Colors.gold : Colors.borderLight,
          backgroundColor: value === OTHER_INDEX ? Colors.gold + '15' : Colors.inputBg,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 20 }}>❓</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Newsreader_600SemiBold',
              fontSize: 14,
              color: value === OTHER_INDEX ? Colors.gold : Colors.textSecondary,
            }}
          >
            Other / Not sure
          </Text>
          <Text
            style={{
              fontFamily: 'Newsreader_400Regular',
              fontSize: 12,
              color: Colors.textMuted,
            }}
          >
            Describe what you see
          </Text>
        </View>
      </TouchableOpacity>

      {value === OTHER_INDEX && (
        <Input
          placeholder="e.g. small worm-like larva, black with 6 legs..."
          multiline
          numberOfLines={2}
          value={otherText}
          onChangeText={onOtherTextChange}
          style={{ minHeight: 72, textAlignVertical: 'top' }}
          autoFocus
        />
      )}
    </View>
  );
}
