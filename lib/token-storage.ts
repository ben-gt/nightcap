import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEYS = {
  accessToken: 'rr_access_token',
  refreshToken: 'rr_refresh_token',
  expiresAt: 'rr_token_expires_at',
} as const;

type TokenData = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
};

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch {}
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch {}
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveTokens(
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number,
): Promise<void> {
  const expiresAt = Date.now() + expiresIn * 1000;
  await Promise.all([
    setItem(TOKEN_KEYS.accessToken, accessToken),
    refreshToken ? setItem(TOKEN_KEYS.refreshToken, refreshToken) : Promise.resolve(),
    setItem(TOKEN_KEYS.expiresAt, expiresAt.toString()),
  ]);
}

export async function loadTokens(): Promise<TokenData> {
  const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
    getItem(TOKEN_KEYS.accessToken),
    getItem(TOKEN_KEYS.refreshToken),
    getItem(TOKEN_KEYS.expiresAt),
  ]);
  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : null,
  };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    removeItem(TOKEN_KEYS.accessToken),
    removeItem(TOKEN_KEYS.refreshToken),
    removeItem(TOKEN_KEYS.expiresAt),
  ]);
}

export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return true;
  // Consider expired 60s early to avoid edge cases
  return Date.now() > expiresAt - 60_000;
}
