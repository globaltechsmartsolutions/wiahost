import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "wiahost:offline-cache";
const DEFAULT_MAX_AGE_MS = 1000 * 60 * 60 * 24;

type CacheEnvelope<T> = {
  savedAt: string;
  value: T;
};

function cacheKey(key: string) {
  return `${CACHE_PREFIX}:${key}`;
}

export async function readOfflineCache<T>(
  key: string,
  maxAgeMs = DEFAULT_MAX_AGE_MS,
) {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(key));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    const savedAt = new Date(parsed.savedAt).getTime();

    if (!Number.isFinite(savedAt) || Date.now() - savedAt > maxAgeMs) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function writeOfflineCache<T>(key: string, value: T) {
  try {
    const envelope: CacheEnvelope<T> = {
      savedAt: new Date().toISOString(),
      value,
    };

    await AsyncStorage.setItem(cacheKey(key), JSON.stringify(envelope));
  } catch {
    // Offline cache is a safety net. It should never block live operations.
  }
}
