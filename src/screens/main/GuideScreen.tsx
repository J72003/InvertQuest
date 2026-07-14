import React from 'react';
import {
  ScrollView,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAXA_BY_ORDER, ORDER_COMMON_NAMES, getTolerance } from '../../constants/taxa';
import { TolerancePill } from '../../components/ui/TolerancePill';
import { Colors } from '../../constants/colors';
import type { TaxonOrder } from '../../constants/taxa';

const ORDERS: TaxonOrder[] = ['Ephemeroptera', 'Trichoptera', 'Coleoptera', 'Lepidoptera', 'Amphipoda'];

export function GuideScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.parchment }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: 'CormorantGaramond_600SemiBold_Italic',
            fontSize: 36,
            color: Colors.forest,
            marginBottom: 4,
          }}
        >
          Field Guide
        </Text>
        <Text
          style={{
            fontFamily: 'Newsreader_400Regular_Italic',
            fontSize: 14,
            color: Colors.textSecondary,
            marginBottom: 24,
          }}
        >
          13 EPT indicator taxa · Hilsenhoff Family Biotic Index
        </Text>

        {ORDERS.map((order) => (
          <View key={order} style={{ marginBottom: 32 }}>
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
                paddingBottom: 8,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: 'CormorantGaramond_700Bold',
                  fontSize: 20,
                  color: Colors.forest,
                }}
              >
                {ORDER_COMMON_NAMES[order]}
              </Text>
              <Text
                style={{
                  fontFamily: 'Newsreader_400Regular_Italic',
                  fontSize: 13,
                  color: Colors.textMuted,
                }}
              >
                {order}
              </Text>
            </View>

            {TAXA_BY_ORDER[order].map((taxon) => (
              <View
                key={taxon.modelClassIndex}
                style={{
                  backgroundColor: Colors.inputBg,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Colors.borderLight,
                  padding: 16,
                  marginBottom: 10,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: 'Newsreader_600SemiBold',
                        fontSize: 16,
                        color: Colors.textPrimary,
                      }}
                    >
                      {taxon.commonName}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Newsreader_400Regular_Italic',
                        fontSize: 13,
                        color: Colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {taxon.family}
                    </Text>
                  </View>
                  <TolerancePill tolerance={taxon.tolerance} showValue size="sm" />
                </View>
                <Text
                  style={{
                    fontFamily: 'Newsreader_400Regular',
                    fontSize: 13,
                    color: Colors.textSecondary,
                    lineHeight: 20,
                  }}
                >
                  {taxon.ecologicalNotes}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* FBI scale explanation */}
        <View
          style={{
            backgroundColor: Colors.forest + '10',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Colors.forest + '30',
            padding: 16,
            gap: 8,
          }}
        >
          <Text
            style={{
              fontFamily: 'Newsreader_600SemiBold',
              fontSize: 15,
              color: Colors.forest,
            }}
          >
            Family Biotic Index Grades
          </Text>
          {[
            { grade: 'A', range: '0 – 3.75', label: 'Excellent', color: Colors.gradeA },
            { grade: 'B', range: '3.76 – 5.00', label: 'Good', color: Colors.gradeB },
            { grade: 'C', range: '5.01 – 6.50', label: 'Fair', color: Colors.gradeC },
            { grade: 'D', range: '6.51 – 10.0', label: 'Poor', color: Colors.gradeD },
          ].map((row) => (
            <View
              key={row.grade}
              style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
            >
              <Text
                style={{
                  fontFamily: 'Newsreader_600SemiBold',
                  fontSize: 18,
                  color: row.color,
                  width: 20,
                }}
              >
                {row.grade}
              </Text>
              <Text
                style={{
                  fontFamily: 'Newsreader_400Regular',
                  fontSize: 14,
                  color: Colors.textSecondary,
                }}
              >
                {row.range} · {row.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
