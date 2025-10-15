import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

/**
 * Custom hook to handle authentication errors globally
 * Automatically redirects to login when authentication fails
 */
export const useAuthErrorHandler = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleAuthError = async (error: Error) => {
    if (error.message.includes('Authentication required') || 
        error.message.includes('please login again')) {
      
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please login again.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              router.replace('/login-sigup/login');
            }
          }
        ]
      );
      return true; // Indicates the error was handled
    }
    return false; // Let the caller handle other errors
  };

  return { handleAuthError };
};

/**
 * Helper function to check if an error is authentication-related
 */
export const isAuthError = (error: Error): boolean => {
  return error.message.includes('Authentication required') || 
         error.message.includes('please login again') ||
         error.message.includes('Invalid or expired token');
};