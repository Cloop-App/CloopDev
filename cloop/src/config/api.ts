import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Get the appropriate API base URL for the current environment
 * 
 * To connect to EC2:
 * 1. Set EXPO_PUBLIC_API_URL in your .env file:
 *    EXPO_PUBLIC_API_URL=http://YOUR_EC2_IP:4000
 * 2. Or update the production return value below
 */
export const getApiBaseUrl = (): string => {
  // Priority: Expo config `extra` (available in production builds),
  // then process.env (works in Expo Go/dev), then hardcoded default.
  const extraUrl = (Constants.expoConfig && (Constants.expoConfig as any).extra && (Constants.expoConfig as any).extra.EXPO_PUBLIC_API_URL) ||
    (Constants.manifest && (Constants.manifest as any).extra && (Constants.manifest as any).extra.EXPO_PUBLIC_API_URL);

  const envUrl = process.env?.EXPO_PUBLIC_API_URL;

  let resolved = extraUrl || envUrl || 'http://localhost:4000';

  // Helper for Android Emulator (localhost -> 10.0.2.2)
  if (Platform.OS === 'android' && (resolved.includes('localhost') || resolved.includes('127.0.0.1'))) {
    resolved = resolved.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
    console.log('[getApiBaseUrl] Remapped localhost to 10.0.2.2 for Android');
  }
  if (!__DEV__) {
    // minimal runtime logging so we can see the resolved base URL in release logs
    try {
      // eslint-disable-next-line no-console
      console.log('[getApiBaseUrl] resolved:', resolved);
    } catch (e) { }
  }

  return resolved;
};

export const API_BASE_URL = getApiBaseUrl();