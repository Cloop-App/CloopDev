import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sections = [
    'hero',
    'features',
    'capabilities',
    'comparison',
    'cta'
  ];

  const showStyle = (i: number) => (currentIndex === i ? null : styles.hidden);

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
    <SafeAreaView style={[
      styles.container,
      currentIndex === 0 && styles.containerHero,
      currentIndex === 1 && styles.containerFeatures
    ]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={[
        styles.pagerContainer,
        (currentIndex === 0 || currentIndex === 1) && styles.pagerContainerNoPadding
      ]}>
        <View style={styles.pagerContent}>
        {/* Upper Half - Hero & Quick Features */}
        <View style={[styles.upperHalf, showStyle(0)]}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>C</Text>
            </View>
            
            <Text style={styles.brand}>Cloop</Text>
            <Text style={styles.heroSubtitle}>Study Less. Score More. With Cloop.</Text>
            
            <View style={styles.heroDescription}>
              <Text style={styles.heroText} numberOfLines={4} ellipsizeMode="tail">
                India's first AI-powered learning tutor that helps you finish homework faster, prepare better for tests, and{' '}
                <Text style={styles.highlightText}>improve your marks by up to 25%</Text> — in just 4 weeks.
              </Text>
            </View>
          </View>

          {/* Quick Features Grid */}
          <View style={styles.quickFeaturesSection}>
            <View style={styles.quickFeatureItem}>
              <Text style={styles.quickFeatureIcon}>📚</Text>
              <Text style={styles.quickFeatureText}>Covers your school syllabus & NCERT chapters</Text>
            </View>
            <View style={styles.quickFeatureItem}>
              <Text style={styles.quickFeatureIcon}>⏱️</Text>
              <Text style={styles.quickFeatureText}>Saves up to 50% of study time through smart revision</Text>
            </View>
            <View style={styles.quickFeatureItem}>
              <Text style={styles.quickFeatureIcon}>💯</Text>
              <Text style={styles.quickFeatureText}>Gives instant feedback on every answer you write</Text>
            </View>
            <View style={styles.quickFeatureItem}>
              <Text style={styles.quickFeatureIcon}>🤖</Text>
              <Text style={styles.quickFeatureText}>24×7 AI tutor — no waiting for teachers or tuition classes</Text>
            </View>
          </View>
        </View>

        {/* Why Students Love Cloop */}
        <View style={[styles.lowerHalf, showStyle(1)]}>
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Why Students (and Parents) Love Cloop</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name="trophy-outline" size={28} color="#F59E0B" />
                </View>
                <Text style={styles.featureTitle}>🧠 Improve Exam Performance</Text>
                <Text style={styles.featureDescription} numberOfLines={4} ellipsizeMode="tail">
                  Cloop's adaptive practice questions and instant feedback help you remember better, revise faster, and score higher — with up to 25% improvement in test performance after 3 weeks of use.
                </Text>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name="time-outline" size={28} color="#10B981" />
                </View>
                <Text style={styles.featureTitle}>⏱ Reduce Study Time</Text>
                <Text style={styles.featureDescription} numberOfLines={3} ellipsizeMode="tail">
                  AI tracks your weak spots and creates short, focused revision paths — cutting your daily study time by up to 50%.
                </Text>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name="checkmark-circle-outline" size={28} color="#EAB308" />
                </View>
                <Text style={styles.featureTitle}>🎯 Master Every Concept</Text>
                <Text style={styles.featureDescription} numberOfLines={4} ellipsizeMode="tail">
                  From tricky physics numericals to confusing grammar rules, Cloop corrects your mistakes in real time so you actually understand, not just memorize.
                </Text>
              </View>
              {/* Removed extra feature card to reduce vertical overflow on small screens */}
            </View>
          </View>
        </View>

        {/* Capabilities */}
        <View style={[styles.capabilitiesSection, showStyle(2)]}>
          <Text style={styles.sectionTitle}>What Cloop Does for You</Text>
          <View style={styles.capabilityItem}>
            <View style={styles.capabilityIcon}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#F59E0B" />
            </View>
            <View style={styles.capabilityContent}>
              <Text style={styles.capabilityTitle}>AI Tutor for Every Subject</Text>
              <Text style={styles.capabilityText}>Chat with Cloop to understand Maths, Science, or English concepts instantly.</Text>
            </View>
          </View>
          <View style={styles.capabilityItem}>
            <View style={styles.capabilityIcon}>
              <Ionicons name="book" size={20} color="#10B981" />
            </View>
            <View style={styles.capabilityContent}>
              <Text style={styles.capabilityTitle}>Homework Helper</Text>
              <Text style={styles.capabilityText}>Ask doubts from your school homework — Cloop explains step by step.</Text>
            </View>
          </View>
          <View style={styles.capabilityItem}>
            <View style={styles.capabilityIcon}>
              <Ionicons name="document-text" size={20} color="#EAB308" />
            </View>
            <View style={styles.capabilityContent}>
              <Text style={styles.capabilityTitle}>Test Preparation Mode</Text>
              <Text style={styles.capabilityText}>Generate chapter-wise mock tests and get feedback on every wrong answer.</Text>
            </View>
          </View>
          <View style={styles.capabilityItem}>
            <View style={styles.capabilityIcon}>
              <Ionicons name="create" size={20} color="#EA580C" />
            </View>
            <View style={styles.capabilityContent}>
              <Text style={styles.capabilityTitle}>Error Correction</Text>
              <Text style={styles.capabilityText}>Learn from mistakes through real-time grammar, logic, and concept correction.</Text>
            </View>
          </View>
          <View style={styles.capabilityItem}>
            <View style={styles.capabilityIcon}>
              <Ionicons name="calendar" size={20} color="#059669" />
            </View>
            <View style={styles.capabilityContent}>
              <Text style={styles.capabilityTitle}>Smart Revision Planner</Text>
              <Text style={styles.capabilityText}>AI creates a 10-min daily plan based on what you forget most.</Text>
            </View>
          </View>
          <View style={styles.capabilityItem}>
            <View style={styles.capabilityIcon}>
              <Ionicons name="flag" size={20} color="#10B981" />
            </View>
            <View style={styles.capabilityContent}>
              <Text style={styles.capabilityTitle}>Goal Tracker 🏅</Text>
              <Text style={styles.capabilityText}>Sets weekly learning goals — and rewards you when you achieve them!</Text>
            </View>
          </View>
        </View>

        {/* Comparison */}
        <View style={[styles.comparisonSection, showStyle(3)]}>
          <Text style={styles.sectionTitle}>🔬 Cloop vs Traditional Tuitions</Text>
          <Text style={styles.comparisonSubtitle}>See why thousands are switching to AI-powered learning</Text>
          <View style={styles.comparisonTable}>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}><Text style={styles.comparisonHeader}></Text></View>
              <View style={[styles.comparisonCell, styles.comparisonCloopHeader]}>
                <Text style={styles.comparisonHeaderText}>Cloop (AI Tutor)</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonHeaderText}>Private Tuition</Text>
              </View>
            </View>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}><Text style={styles.comparisonLabel}>Cost</Text></View>
              <View style={[styles.comparisonCell, styles.comparisonCloopCell]}>
                <Text style={styles.comparisonValue}>90% cheaper</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>Expensive monthly fees</Text>
              </View>
            </View>
            <View style={[styles.comparisonRow, styles.comparisonRowAlt]}>
              <View style={styles.comparisonCell}><Text style={styles.comparisonLabel}>Availability</Text></View>
              <View style={[styles.comparisonCell, styles.comparisonCloopCell]}>
                <Text style={styles.comparisonValue}>24×7</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>Fixed hours only</Text>
              </View>
            </View>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}><Text style={styles.comparisonLabel}>Personalization</Text></View>
              <View style={[styles.comparisonCell, styles.comparisonCloopCell]}>
                <Text style={styles.comparisonValue}>Adapts to you</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>One-size-fits-all</Text>
              </View>
            </View>
            <View style={[styles.comparisonRow, styles.comparisonRowAlt]}>
              <View style={styles.comparisonCell}><Text style={styles.comparisonLabel}>Feedback Speed</Text></View>
              <View style={[styles.comparisonCell, styles.comparisonCloopCell]}>
                <Text style={styles.comparisonValue}>Instant correction</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>Delayed correction</Text>
              </View>
            </View>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}><Text style={styles.comparisonLabel}>Learning Style</Text></View>
              <View style={[styles.comparisonCell, styles.comparisonCloopCell]}>
                <Text style={styles.comparisonValue}>Interactive chat-based</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>Lecture-based</Text>
              </View>
            </View>
            <View style={[styles.comparisonRow, styles.comparisonRowAlt]}>
              <View style={styles.comparisonCell}><Text style={styles.comparisonLabel}>Improvement</Text></View>
              <View style={[styles.comparisonCell, styles.comparisonCloopCell]}>
                <Text style={styles.comparisonValueBold}>+25% faster results</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>Depends on teacher</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats page removed per request */}

        {/* CTA Section */}
        <View style={[styles.ctaSection, showStyle(4)]}>
          <Text style={styles.ctaTitle}>Start Your AI Learning Journey</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of students who are already experiencing personalized, intelligent education
          </Text>
          {/* Condensed features replicated here so CTA also shows key benefits */}
          <View style={styles.ctaFeaturesGrid}>
            <View style={styles.ctaFeatureCard}>
              <View style={styles.ctaFeatureIcon}>
                <Ionicons name="trophy-outline" size={18} color="#F59E0B" />
              </View>
              <View style={styles.ctaFeatureContent}>
                <Text style={styles.ctaFeatureTitle}>Improve Exam Performance</Text>
                <Text style={styles.ctaFeatureText} numberOfLines={2} ellipsizeMode="tail">Adaptive practice and instant feedback to boost test scores quickly.</Text>
              </View>
            </View>

            <View style={styles.ctaFeatureCard}>
              <View style={styles.ctaFeatureIcon}>
                <Ionicons name="time-outline" size={18} color="#10B981" />
              </View>
              <View style={styles.ctaFeatureContent}>
                <Text style={styles.ctaFeatureTitle}>Save Study Time</Text>
                <Text style={styles.ctaFeatureText} numberOfLines={2} ellipsizeMode="tail">Short, focused revision paths that cut study hours in half.</Text>
              </View>
            </View>

            <View style={styles.ctaFeatureCard}>
              <View style={styles.ctaFeatureIcon}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#EAB308" />
              </View>
              <View style={styles.ctaFeatureContent}>
                <Text style={styles.ctaFeatureTitle}>Master Concepts</Text>
                <Text style={styles.ctaFeatureText} numberOfLines={2} ellipsizeMode="tail">Real-time corrections so you understand, not just memorize.</Text>
              </View>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => {
                console.log('navigate to signup');
                router.push({ pathname: '/login-sigup/sigup' });
              }}
            >
              <Text style={styles.btnText}>Start Free</Text>
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
        <View style={[styles.footer, showStyle(4)]}>
          <Text style={styles.footerText}>
            Join 10,000+ students already learning faster with Cloop.
          </Text>
        </View>
        </View>

      </View>

      {/* Bottom navigation: Prev arrow, pagination dots, Next arrow */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.arrowButton, currentIndex === 0 && styles.arrowDisabled]}
          onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? '#94A3B8' : '#111827'} />
        </TouchableOpacity>

        <View style={styles.dotsWrapper}>
          {sections.map((s, i) => (
            <View key={s} style={[styles.dot, currentIndex === i && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.arrowButton, currentIndex === sections.length - 1 && styles.arrowDisabled]}
          onPress={() => setCurrentIndex(Math.min(sections.length - 1, currentIndex + 1))}
          disabled={currentIndex === sections.length - 1}
        >
          <Ionicons name="chevron-forward" size={20} color={currentIndex === sections.length - 1 ? '#94A3B8' : '#111827'} />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 0,
  },
  
  // Upper Half Section
  upperHalf: {
    backgroundColor: '#FEF3C7',
    paddingBottom: 40,
  },
  
  // Lower Half Section
  lowerHalf: {
    backgroundColor: '#D1FAE5',
    paddingTop: 20,
    minHeight: 520,
    overflow: 'hidden',
  },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    minHeight: 480,
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
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
    color: '#059669',
    marginBottom: 24,
  },
  heroDescription: {
    alignItems: 'center',
    paddingHorizontal: 12,
    maxWidth: 560,
  },
  heroText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'center',
  },
  highlightText: {
    fontWeight: '700',
    color: '#F59E0B',
  },
  
  // Quick Features Section
  quickFeaturesSection: {
    paddingHorizontal: 24,
    paddingBottom: 0,
    marginHorizontal: 0,
    paddingTop: 0,
    overflow: 'hidden',
  },
  quickFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FCD34D',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '100%'
  },
  quickFeatureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  quickFeatureText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  
  // Features Section
  featuresSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresGrid: {
    gap: 12,
    paddingHorizontal: 8,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#A7F3D0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    marginBottom: 10,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  
  // Capabilities Section
  capabilitiesSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 40,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  capabilityIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  capabilityContent: {
    flex: 1,
  },
  capabilityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  capabilityText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  
  // Comparison Section
  comparisonSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 40,
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  comparisonTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  comparisonRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  comparisonCell: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  comparisonCloopHeader: {
    backgroundColor: '#FEF3C7',
  },
  comparisonCloopCell: {
    backgroundColor: '#D1FAE5',
  },
  comparisonHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    textAlign: 'left',
  },
  comparisonHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'left',
  },
  comparisonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'left',
  },
  comparisonValue: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'left',
  },
  comparisonValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'left',
  },
  
  // Stats Section
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 20,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
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
    paddingTop: 40,
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
    backgroundColor: '#059669',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F59E0B',
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
    color: '#D97706',
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
  pagerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  pagerContainerNoPadding: {
    paddingHorizontal: 0,
  },
  containerHero: {
    backgroundColor: '#FEF3C7',
  },
  containerFeatures: {
    backgroundColor: '#D1FAE5',
  },
  pagerContent: {
    flex: 1,
  },
  arrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
    // placed inside bottom nav now
    marginHorizontal: 8,
  },
  arrowDisabled: {
    backgroundColor: '#F8FAFC',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  dotsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#059669',
    width: 12,
    height: 12,
  },
  hidden: {
    display: 'none',
  },
  // CTA condensed feature styles
  ctaFeaturesGrid: {
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  ctaFeatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E6F9F0',
    marginBottom: 8,
  },
  ctaFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ctaFeatureContent: {
    flex: 1,
  },
  ctaFeatureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  ctaFeatureText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
