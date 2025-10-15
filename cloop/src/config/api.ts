import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Get the appropriate API base URL for the current environment
 */
export const getApiBaseUrl = (): string => {
  // In development, always use localhost since you're using web browser
  if (__DEV__) {
    return 'http://localhost:4000';
  }
  
  // In production, use your actual API URL
  return process.env.EXPO_PUBLIC_API_URL || 'https://your-api-domain.com';
};

export const API_BASE_URL = getApiBaseUrl();