/**
 * Offline queue drain invariant tests.
 * Verifies the store correctly persists, hydrates, and removes queue entries.
 */
import { useOfflineQueueStore } from '../../store/offlineQueueStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'fieldnotes_offline_queue';

const baseItem = {
  localImageUri: 'file:///tmp/test.jpg',
  taxonId: null,
  classroomId: null,
  sizeEstimate: null as null,
  habitat: null,
  behaviors: [] as any[],
  confidence: null as null,
  notes: null,
  latitude: 38.0,
  longitude: -77.0,
  aiPredictions: null,
  capturedAt: new Date().toISOString(),
};

beforeEach(() => {
  // Reset store state between tests
  useOfflineQueueStore.setState({ queue: [], isDraining: false });
  jest.clearAllMocks();
});

describe('offlineQueueStore', () => {
  it('add() appends an item with a unique queueId and persists to storage', async () => {
    await useOfflineQueueStore.getState().add(baseItem);

    const queue = useOfflineQueueStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].queueId).toBeTruthy();
    expect(queue[0].enqueuedAt).toBeTruthy();
    expect(queue[0].localImageUri).toBe('file:///tmp/test.jpg');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      QUEUE_KEY,
      expect.stringContaining('"localImageUri":"file:///tmp/test.jpg"'),
    );
  });

  it('two add() calls create two entries with distinct queueIds', async () => {
    await useOfflineQueueStore.getState().add(baseItem);
    await useOfflineQueueStore.getState().add(baseItem);

    const queue = useOfflineQueueStore.getState().queue;
    expect(queue).toHaveLength(2);
    expect(queue[0].queueId).not.toBe(queue[1].queueId);
  });

  it('remove() deletes the matching entry and persists', async () => {
    await useOfflineQueueStore.getState().add(baseItem);
    await useOfflineQueueStore.getState().add(baseItem);

    const firstId = useOfflineQueueStore.getState().queue[0].queueId;
    await useOfflineQueueStore.getState().remove(firstId);

    const queue = useOfflineQueueStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].queueId).not.toBe(firstId);

    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
      QUEUE_KEY,
      expect.not.stringContaining(firstId),
    );
  });

  it('hydrate() restores queue from AsyncStorage on cold start', async () => {
    const stored = [{ ...baseItem, queueId: 'abc123', enqueuedAt: new Date().toISOString() }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(stored));

    await useOfflineQueueStore.getState().hydrate();

    const queue = useOfflineQueueStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].queueId).toBe('abc123');
  });

  it('hydrate() starts with empty queue if storage is corrupt', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not valid json {{{{');

    await useOfflineQueueStore.getState().hydrate();

    expect(useOfflineQueueStore.getState().queue).toHaveLength(0);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(QUEUE_KEY);
  });

  it('setDraining() updates the isDraining flag without side effects', () => {
    useOfflineQueueStore.getState().setDraining(true);
    expect(useOfflineQueueStore.getState().isDraining).toBe(true);
    useOfflineQueueStore.getState().setDraining(false);
    expect(useOfflineQueueStore.getState().isDraining).toBe(false);
  });
});
