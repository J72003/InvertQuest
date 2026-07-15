import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCaptureStore } from '../../store/captureStore';
import { Colors } from '../../constants/colors';
import type { AppStackParamList } from '../../navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Camera'>;
};

export function CameraScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    base64: string;
    width: number;
    height: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // GPS fires in background — never blocks capture
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status === 'granted') {
          return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        return null;
      })
      .then((pos) => {
        if (pos) setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      })
      .catch(() => {}); // GPS failure is non-fatal
  }, []);

  const setPending = useCaptureStore((s) => s.set);

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.parchment} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.parchment, padding: 32, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <Text style={{ fontSize: 48 }}>📷</Text>
        <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold_Italic', fontSize: 28, color: Colors.forest, textAlign: 'center' }}>
          Camera Access Needed
        </Text>
        <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
          InverteQuest needs camera access to photograph invertebrates.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ backgroundColor: Colors.forest, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 8, minWidth: 200, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 16, color: Colors.parchment }}>
            Allow Camera
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 15, color: Colors.textMuted }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  async function handleCapture() {
    if (isProcessing || !cameraRef.current) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (!photo) throw new Error('No photo returned');

      // Compress to 1600px wide, JPEG 0.85, get base64
      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );

      setPreviewUri(compressed.uri);
      setPreviewData({
        base64: compressed.base64!,
        width: compressed.width,
        height: compressed.height,
      });
    } catch (e) {
      Alert.alert('Capture Failed', 'Could not take photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleUsePhoto() {
    if (!previewUri || !previewData) return;
    setPending({
      localImageUri: previewUri,
      imageBase64: previewData.base64,
      imageWidth: previewData.width,
      imageHeight: previewData.height,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      capturedAt: new Date().toISOString(),
    });
    navigation.replace('Details');
  }

  function handleRetake() {
    setPreviewUri(null);
    setPreviewData(null);
  }

  // ── PREVIEW ────────────────────────────────────────────────
  if (previewUri) {
    const previewH = previewData ? SCREEN_W * (previewData.height / previewData.width) : SCREEN_W;

    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Image
          source={{ uri: previewUri }}
          style={{ width: SCREEN_W, height: previewH }}
          resizeMode="contain"
        />
        <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, gap: 12 }}>
          <TouchableOpacity
            onPress={handleUsePhoto}
            style={{ backgroundColor: Colors.forest, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 17, color: Colors.parchment }}>
              Use Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRetake}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 17, color: Colors.parchment }}>
              Retake
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // ── LIVE CAMERA ────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        flash={flash}
      />

      {/* Top controls */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 44, height: 44, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 18, color: '#fff' }}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}
            style={{ width: 44, height: 44, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 20 }}>{flash === 'on' ? '⚡' : '🔦'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* GPS indicator */}
      <View style={{ position: 'absolute', top: 70, alignSelf: 'center' }}>
        <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 12, color: location ? Colors.gold : 'rgba(255,255,255,0.4)' }}>
          {location ? `📍 GPS ready` : '📍 Locating…'}
        </Text>
      </View>

      {/* Shutter */}
      <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 32, alignItems: 'center' }}>
        <TouchableOpacity
          onPress={handleCapture}
          disabled={isProcessing}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isProcessing ? Colors.textMuted : Colors.parchment,
            borderWidth: 4,
            borderColor: 'rgba(255,255,255,0.6)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isProcessing && <ActivityIndicator color={Colors.forest} />}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}
