import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Image,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { THEME } from '../src/constants/theme';

// Asset Imports
// Note: User mentioned 'clooplogo.png' and 'robot.png' in 'assets/images'
// Adjusting paths based on previous file context: '../assets/images/...'
const CLOOP_LOGO = require('../assets/images/clooplogo.png');
const ROBOT_IMG = require('../assets/images/robot1.jpg');

const { width, height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in effects

  useEffect(() => {
    // Show splash for 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Start fade in for home screen content when splash ends
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !showSplash) {
      // If user is already logged in, redirect to home after splash
      // Adding a small delay to ensure transition is smooth
      const redirectTimer = setTimeout(() => {
        router.replace('/home/home');
      }, 100);
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, isLoading, router, showSplash]);

  if (isLoading || showSplash) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8B4FE" />

      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        {/* Branding Section */}
        <View style={styles.brandingSection}>
          <Image source={CLOOP_LOGO} style={styles.logoImage} resizeMode="contain" />
          
        </View>

        {/* Main Content Section */}
        <View style={styles.mainContent}>
          <Text style={styles.headline}>
            Improve Your Scores by{'\n'}
            <Text style={styles.highlight}>25%</Text> in One Week.
          </Text>

          <Text style={styles.subHeadline}>
            Try Now for Free !{'\n'}
            <Text style={styles.subHeadlineSmall}>Pay Only If You See Results.</Text>
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/login-sigup/sigup')}
          >
            <Text style={styles.primaryButtonText}>GET STARTED</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/login-sigup/login')}
          >
            <Text style={styles.secondaryButtonText}>ALREADY HAVE AN ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#BC84F1" />
      <View style={styles.splashContent}>
        <Image source={CLOOP_LOGO} style={styles.splashLogo} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D8B4FE', // Light purple/pink matching the image
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },

  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    backgroundColor: '#BC84F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  splashLogo: {
    width: 250,
    height: 250,
  },

  // Branding Section
  brandingSection: {
    alignItems: 'center',
    marginTop: 80,
  },
  logoImage: {
    width: 240,
    height: 100,
  },
  brandTagline: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginTop: 8,
  },

  // Main Content Section
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#4A4A4A',
    lineHeight: 34,
    marginBottom: 30,
  },
  highlight: {
    color: '#8B5CF6',
    fontWeight: '800',
  },
  subHeadline: {
    fontSize: 22,
    textAlign: 'center',
    color: '#8B5CF6',
    lineHeight: 30,
    fontWeight: '700',
  },
  subHeadlineSmall: {
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '500',
  },

  // Button Section
  buttonSection: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: '#A78BFA',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
