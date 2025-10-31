import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set mounted flag after component is mounted
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading && isAuthenticated) {
      // Add small delay to ensure router is ready
      const timer = setTimeout(() => {
        try {
          router.replace('/home/home');
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback navigation
          window.location.href = '/home/home';
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router, isMounted, isLoading]);

  // Show loading during auth initialization
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.brand}>Cloop</Text>
          <Text style={styles.loadingText}>Initializing AI...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>C</Text>
          </View>
          
          <Text style={styles.brand}>Cloop</Text>
          <Text style={styles.heroSubtitle}>AI-Powered Learning Platform</Text>
          
          <View style={styles.heroDescription}>
            <Text style={styles.heroText}>
              Experience the future of education with our conversational AI tutor that provides{' '}
              <Text style={styles.highlightText}>intelligent real-time error correction</Text> and{' '}
              <Text style={styles.highlightText}>adaptive learning experiences</Text> tailored just for you.
            </Text>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Students Choose Cloop</Text>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="bulb-outline" size={28} color="#6366F1" />
              </View>
              <Text style={styles.featureTitle}>Smart AI Tutor</Text>
              <Text style={styles.featureDescription}>
                Conversational AI that understands your learning style and adapts to your pace
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="flash-outline" size={28} color="#10B981" />
              </View>
              <Text style={styles.featureTitle}>Real-Time Correction</Text>
              <Text style={styles.featureDescription}>
                Instant feedback on spelling, grammar, and conceptual errors as you learn
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="trending-up-outline" size={28} color="#F59E0B" />
              </View>
              <Text style={styles.featureTitle}>Adaptive Learning</Text>
              <Text style={styles.featureDescription}>
                Personalized curriculum that evolves based on your progress and understanding
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="chatbubbles-outline" size={28} color="#EF4444" />
              </View>
              <Text style={styles.featureTitle}>Interactive Sessions</Text>
              <Text style={styles.featureDescription}>
                Engaging question-based learning with micro-assessments and goal tracking
              </Text>
            </View>
          </View>
        </View>

        {/* AI Capabilities */}
        <View style={styles.capabilitiesSection}>
          <Text style={styles.sectionTitle}>Advanced AI Capabilities</Text>
          
          <View style={styles.capabilityItem}>
            <View style={styles.capabilityIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={styles.capabilityText}>Intelligent error detection and correction</Text>
          </View>
          
          <View style={styles.capabilityItem}>
            <View style={styles.capabilityIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={styles.capabilityText}>Personalized learning paths and goal setting</Text>
          </View>
          
          <View style={styles.capabilityItem}>
            <View style={styles.capabilityIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={styles.capabilityText}>Real-time performance analytics and insights</Text>
          </View>
          
          <View style={styles.capabilityItem}>
            <View style={styles.capabilityIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={styles.capabilityText}>24/7 availability for continuous learning</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>10K+</Text>
            <Text style={styles.statLabel}>Active Learners</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Accuracy Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>AI Support</Text>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Start Your AI Learning Journey</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of students who are already experiencing personalized, intelligent education
          </Text>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => {
                console.log('navigate to signup');
                router.push({ pathname: '/login-sigup/sigup' });
              }}
            >
              <Text style={styles.btnText}>Get Started Free</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.btnIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => {
                console.log('navigate to login');
                router.push({ pathname: '/login-sigup/login' });
              }}
            >
              <Text style={styles.btnTextSecondary}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Experience the future of education with AI-powered learning
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  brand: {
    fontSize: 36,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 24,
  },
  heroDescription: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  heroText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'center',
  },
  highlightText: {
    fontWeight: '700',
    color: '#6366F1',
  },
  
  // Features Section
  featuresSection: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresGrid: {
    gap: 20,
  },
  featureCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  
  // Capabilities Section
  capabilitiesSection: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    marginBottom: 12,
  },
  capabilityIcon: {
    marginRight: 12,
  },
  capabilityText: {
    fontSize: 16,
    color: '#065F46',
    fontWeight: '500',
    flex: 1,
  },
  
  // Stats Section
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 24,
    borderRadius: 20,
    marginBottom: 60,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#6366F1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // CTA Section
  ctaSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  
  // Buttons
  actions: {
    width: '100%',
    gap: 12,
  },
  btn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimary: {
    backgroundColor: '#6366F1',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  btnIcon: {
    marginLeft: 8,
  },
  btnTextSecondary: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 16,
  },
  
  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
