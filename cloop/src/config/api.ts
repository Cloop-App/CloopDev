import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Get the appropriate API base URL for the current environment
 */
export const getApiBaseUrl = (): string => {
  // In development, use local IP for physical devices
  if (__DEV__) {
    // For iOS Simulator and Android Emulator, localhost works
    if (Platform.OS === 'ios' && !Constants.isDevice) {
      return 'http://localhost:4000';
    }
    if (Platform.OS === 'android' && !Constants.isDevice) {
      return 'http://10.0.2.2:4000'; // Android emulator localhost mapping
    }
    
    // For physical devices, you'll need to use your computer's IP address
    // You can get this by running: ipconfig (Windows) or ifconfig (Mac/Linux)
    // Replace this with your actual IP address
    const LOCAL_IP = '10.119.118.137'; // Updated with your current IP
    return `http://${LOCAL_IP}:4000`;
  }
  
  // In production, use your actual API URL
  return process.env.EXPO_PUBLIC_API_URL || 'https://your-api-domain.com';
};

export const API_BASE_URL = getApiBaseUrl();