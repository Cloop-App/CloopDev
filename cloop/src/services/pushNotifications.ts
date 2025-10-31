import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../config/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and save token to backend
 */
export async function registerForPushNotifications(token?: string) {
  try {
    // Check if running on a physical device (not web or simulator)
    if (Platform.OS === 'web') {
      console.log('Push notifications are not supported on web');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permissions not granted');
      return null;
    }

    // Get the push token
    const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', expoPushToken);

    // Save to backend if user token provided
    if (token) {
      await savePushTokenToBackend(expoPushToken, token);
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('content-generation', {
        name: 'Content Generation',
        description: 'Notifications about curriculum generation progress',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      });
    }

    return expoPushToken;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to backend
 */
async function savePushTokenToBackend(expoPushToken: string, authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ expoPushToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to save push token');
    }

    const data = await response.json();
    console.log('Push token saved to backend:', data);
    return data;
  } catch (error) {
    console.error('Error saving push token to backend:', error);
    throw error;
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  // Handle notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    }
  );

  // Handle user interaction with notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification response:', response);
      onNotificationResponse?.(response);
    }
  );

  // Return cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

/**
 * Check content generation status
 */
export async function checkContentGenerationStatus(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/content-generation/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking content generation status:', error);
    return null;
  }
}
