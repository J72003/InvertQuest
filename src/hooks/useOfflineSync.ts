import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { useOfflineQueueStore } from '../store/offlineQueueStore';
import { useAuthStore } from '../store/authStore';
import { saveSpecimenDirect } from '../lib/specimenService';
import { queryClient } from '../lib/queryClient';

export function useOfflineSync() {
  useEffect(() => {
    async function drain() {
      const store = useOfflineQueueStore.getState();
      const user = useAuthStore.getState().user;
      if (store.isDraining || !user || store.queue.length === 0) return;

      store.setDraining(true);
      let synced = 0;

      for (const item of [...store.queue]) {
        try {
          await saveSpecimenDirect({
            userId: user.id,
            classroomId: item.classroomId,
            localImageUri: item.localImageUri,
            imageBase64: item.imageBase64,
            taxonId: item.taxonId,
            sizeEstimate: item.sizeEstimate,
            habitat: item.habitat,
            behaviors: item.behaviors,
            confidence: item.confidence,
            notes: item.notes,
            latitude: item.latitude,
            longitude: item.longitude,
            aiPredictions: item.aiPredictions,
            capturedAt: item.capturedAt,
          });
          await store.remove(item.queueId);
          synced++;
        } catch {
          break;
        }
      }

      useOfflineQueueStore.getState().setDraining(false);
      if (synced > 0) {
        await queryClient.invalidateQueries({ queryKey: ['specimens'] });
        await queryClient.invalidateQueries({ queryKey: ['sites'] });
      }
    }

    const unsubNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) drain();
    });

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') drain();
    });

    return () => {
      unsubNetInfo();
      appStateSub.remove();
    };
  }, []);
}
