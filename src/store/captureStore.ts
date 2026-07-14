import { create } from 'zustand';

export interface PendingCapture {
  localImageUri: string;
  imageBase64: string; // stripped of data URI prefix
  imageWidth: number;
  imageHeight: number;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string;
}

interface CaptureState {
  pending: PendingCapture | null;
  set: (capture: PendingCapture) => void;
  clear: () => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  pending: null,
  set: (pending) => set({ pending }),
  clear: () => set({ pending: null }),
}));
