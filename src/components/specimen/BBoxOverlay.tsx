import React from 'react';
import { View, Text } from 'react-native';
import type { RoboflowPrediction } from '../../types/database';
import { TAXA } from '../../constants/taxa';
import { Colors } from '../../constants/colors';

interface BBoxOverlayProps {
  bbox: RoboflowPrediction['bbox'];
  classIndex: number;
  confidence: number;
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
}

export function BBoxOverlay({
  bbox,
  classIndex,
  confidence,
  imageWidth,
  imageHeight,
  displayWidth,
  displayHeight,
}: BBoxOverlayProps) {
  if (!bbox) return null;

  const taxon = TAXA.find((t) => t.modelClassIndex === classIndex);

  // Map from image pixel space to display pixel space
  const scaleX = displayWidth / imageWidth;
  const scaleY = displayHeight / imageHeight;

  const left = (bbox.x - bbox.width / 2) * scaleX;
  const top = (bbox.y - bbox.height / 2) * scaleY;
  const width = bbox.width * scaleX;
  const height = bbox.height * scaleY;

  return (
    <>
      <View
        style={{
          position: 'absolute',
          left,
          top,
          width,
          height,
          borderWidth: 2,
          borderColor: Colors.gold,
          borderRadius: 4,
        }}
      />
      {/* Label above the bbox */}
      <View
        style={{
          position: 'absolute',
          left,
          top: Math.max(top - 28, 4),
          backgroundColor: Colors.gold,
          borderRadius: 4,
          paddingHorizontal: 6,
          paddingVertical: 2,
        }}
      >
        <Text
          style={{
            fontFamily: 'Newsreader_600SemiBold',
            fontSize: 11,
            color: Colors.forest,
          }}
        >
          {taxon?.commonName ?? 'Unknown'} {Math.round(confidence * 100)}%
        </Text>
      </View>
    </>
  );
}
