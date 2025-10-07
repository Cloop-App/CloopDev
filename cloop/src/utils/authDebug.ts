import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/auth';

/**
 * Debug utility to inspect and clear authentication data
 */
export class AuthDebugUtils {
  /**
   * Get current authentication data from AsyncStorage
   */
  static async inspectStoredAuth() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      console.log('=== AUTH DEBUG ===');
      console.log('Stored Token:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('Stored User:', userData ? JSON.parse(userData) : 'null');
      console.log('Service State:', AuthService.getInstance().getAuthState());
      console.log('================');
      
      return {
        token,
        userData: userData ? JSON.parse(userData) : null,
        serviceState: AuthService.getInstance().getAuthState()
      };
    } catch (error) {
      console.error('Error inspecting auth:', error);
      return null;
    }
  }

  /**
   * Completely clear all authentication data
   */
  static async clearAllAuthData() {
    try {
      console.log('🧹 Clearing all authentication data...');
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      // Reset AuthService
      await AuthService.getInstance().logout();
      
      console.log('✅ All authentication data cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
      return false;
    }
  }

  /**
   * Test token validity by making a test API call
   */
  static async testTokenValidity() {
    const authService = AuthService.getInstance();
    const token = authService.getToken();
    
    if (!token) {
      console.log('❌ No token found');
      return false;
    }

    try {
      // Import the API base URL
      const { API_BASE_URL } = await import('../config/api');
      
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        console.log('✅ Token is valid');
        return true;
      } else {
        const error = await response.json().catch(() => ({}));
        console.log('❌ Token is invalid:', error.error || response.statusText);
        return false;
      }
    } catch (error) {
      console.log('❌ Error testing token:', error);
      return false;
    }
  }

  /**
   * Complete auth reset and re-login
   */
  static async resetAndRelogin(emailOrPhone: string) {
    try {
      console.log('🔄 Starting auth reset and re-login...');
      
      // Clear existing data
      await this.clearAllAuthData();
      
      // Import login function
      const { loginUser } = await import('../client/login/login');
      
      // Attempt fresh login
      const result = await loginUser({ emailOrPhone });
      
      if (result.token && result.user) {
        await AuthService.getInstance().login(result.token, result.user);
        console.log('✅ Successfully logged in with fresh token');
        return true;
      } else {
        console.log('❌ Login succeeded but no token received');
        return false;
      }
    } catch (error) {
      console.log('❌ Error during reset and re-login:', error);
      return false;
    }
  }
}

// Expose to global scope for debugging in development
if (__DEV__) {
  // @ts-ignore
  global.AuthDebug = AuthDebugUtils;
  console.log('🔧 AuthDebug utilities available globally in __DEV__ mode');
  console.log('Usage: AuthDebug.inspectStoredAuth(), AuthDebug.clearAllAuthData(), etc.');
}