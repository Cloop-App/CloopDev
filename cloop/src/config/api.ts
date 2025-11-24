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
  // In development, always use localhost since you're using web browser
  // Use environment variable if provided, otherwise default to the
  // public EC2 IP where the backend will be deployed.
  // Replace with your domain or different IP if needed.
  return process.env.EXPO_PUBLIC_API_URL || 'http://51.21.143.32:4000';
};

export const API_BASE_URL = getApiBaseUrl();