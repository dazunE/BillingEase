import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Small values the phone keeps between launches. On a phone the session token goes in the
 * Keychain / Keystore (expo-secure-store); the web build (used for testing) uses localStorage.
 */
export const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string | null): Promise<void> {
    if (Platform.OS === "web") {
      try {
        if (value === null) globalThis.localStorage?.removeItem(key);
        else globalThis.localStorage?.setItem(key, value);
      } catch { /* private mode */ }
      return;
    }
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  },
};

export const KEYS = {
  token: "be.session",
  business: "be.business",
  faceId: "be.faceid",
} as const;
