import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Behavior, ConfidenceLevel, SizeEstimate, AIPrediction } from '../types/database';

const QUEUE_KEY = 'fieldnotes_offline_queue';

export interface QueuedSpecimen {
  queueId: string;
  localImageUri: string;
  imageBase64: string;
  taxonId: string | null;
  classroomId: string | null;
  sizeEstimate: SizeEstimate | null;
  habitat: string | null;
  behaviors: Behavior[];
  confidence: ConfidenceLevel | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  aiPredictions: AIPrediction | null;
  capturedAt: string;
  enqueuedAt: string;
}

interface OfflineQueueState {
  queue: QueuedSpecimen[];
  isDraining: boolean;
  add: (item: Omit<QueuedSpecimen, 'queueId' | 'enqueuedAt'>) => Promise<void>;
  remove: (queueId: string) => Promise<void>;
  setDraining: (draining: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => ({
  queue: [],
  isDraining: false,

  add: async (item) => {
    const queued: QueuedSpecimen = {
      ...item,
      queueId: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      enqueuedAt: new Date().toISOString(),
    };
    const next = [...get().queue, queued];
    set({ queue: next });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  },

  remove: async (queueId) => {
    const next = get().queue.filter((q) => q.queueId !== queueId);
    set({ queue: next });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  },

  setDraining: (isDraining) => set({ isDraining }),

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (raw) {
        set({ queue: JSON.parse(raw) });
      }
    } catch {
      // Corrupt storage — start fresh
      await AsyncStorage.removeItem(QUEUE_KEY);
    }
  },
}));
