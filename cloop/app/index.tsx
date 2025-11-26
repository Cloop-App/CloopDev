import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Image,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

// Using require for local assets to ensure they are bundled
const LOGO_IMG = require('../assets/images/logo.png');
const HERO_IMG = require('../assets/images/hero.png');
const TROPHY_IMG = require('../assets/images/trophy.png');

const { width, height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<any>(null);

  const slides = [
    { id: 'hero', title: '', subtitle: '' },
    { id: 'features', title: 'Why Students Love Cloop', subtitle: 'AI-powered learning that works' },
    { id: 'capabilities', title: 'What Cloop Does', subtitle: 'Your personal AI tutor' },
    { id: 'comparison', title: 'Cloop vs Others', subtitle: 'The smart choice' },
    { id: 'cta', title: '', subtitle: '' }, // Removed title as requested
  ];

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const timer = setTimeout(() => {
        router.replace('/home/home');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, router]);

  const scrollTo = (index: number) => {
    if (index >= 0 && index < slides.length) {
      slidesRef.current?.scrollTo({ x: index * width, animated: true });
      setCurrentIndex(index);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false, listener: (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
      }
    }
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
        <Image source={LOGO_IMG} style={styles.loadingLogo} resizeMode="contain" />
      </View>
    );
  }

  const renderHeroContent = () => (
    <View style={styles.slideContent}>
      <View style={styles.heroHeader}>
        <Image source={LOGO_IMG} style={styles.logo} resizeMode="contain" />
        <Text style={styles.heroBrand}>Cloop</Text>
        <Text style={styles.heroSubtitle}>Study Less. Score More.</Text>
      </View>

      <View style={styles.heroImageContainer}>
        <Image source={HERO_IMG} style={styles.heroImage} resizeMode="contain" />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          India's first AI-powered learning tutor that helps you finish homework faster and
          <Text style={styles.highlightText}> improve marks by 25%</Text>.
        </Text>
      </View>
    </View>
  );

  const renderFeaturesContent = () => (
    <View style={styles.slideContent}>
      <View style={styles.featureCard}>
        <Image source={TROPHY_IMG} style={styles.featureImage} resizeMode="contain" />
        <Text style={styles.cardTitle}>Gamified Learning</Text>
        <Text style={styles.cardText}>
          Earn rewards and badges as you learn. Adaptive practice helps you score higher with up to
          <Text style={{ fontWeight: '700', color: THEME.colors.primary }}> 25% improvement</Text> in 3 weeks.
        </Text>
      </View>

      <View style={styles.featureCard}>
        <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
          <Ionicons name="time" size={32} color="#10B981" />
        </View>
        <Text style={styles.cardTitle}>Save 50% Study Time</Text>
        <Text style={styles.cardText}>
          Stop wasting time on what you already know. AI tracks weak spots and creates focused revision paths just for you.
        </Text>
      </View>
    </View>
  );

  const renderCapabilitiesContent = () => (
    <View style={styles.slideContent}>
      <View style={styles.listContainer}>
        {[
          { icon: 'chatbubbles', color: '#F59E0B', title: 'AI Tutor', text: 'Instant answers to all your doubts, 24/7.' },
          { icon: 'school', color: '#EF4444', title: 'Homework Helper', text: 'Step-by-step explanations, not just answers.' },
          { icon: 'document-text', color: '#EAB308', title: 'Test Prep', text: 'Unlimited mock tests with instant feedback.' },
          { icon: 'pencil', color: '#EA580C', title: 'Writing Coach', text: 'Real-time grammar and logic correction.' },
        ].map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={[styles.listIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>{item.title}</Text>
              <Text style={styles.listDesc}>{item.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderComparisonContent = () => (
    <View style={styles.slideContent}>
      <View style={styles.comparisonCard}>
        <View style={styles.comparisonHeader}>
          <View style={{ flex: 1 }}></View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.colHeader}>Cloop</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.colHeader, { color: '#6B7280' }]}>Others</Text>
          </View>
        </View>

        {[
          { label: '24/7 Availability', cloop: true, other: false },
          { label: 'Personalized Plan', cloop: true, other: false },
          { label: 'Instant Doubts', cloop: true, other: false },
          { label: 'Cost Effective', cloop: true, other: false },
        ].map((row, i) => (
          <View key={i} style={[styles.comparisonRow, i === 3 && { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <View style={styles.iconCol}>
              <Ionicons name="checkmark-circle" size={24} color={THEME.colors.primary} />
            </View>
            <View style={styles.iconCol}>
              <Ionicons name="close-circle" size={24} color="#E5E7EB" />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Why settle for less? Upgrade to the <Text style={styles.highlightText}>future of learning</Text>.
        </Text>
      </View>
    </View>
  );

  const renderCTAContent = () => (
    <View style={styles.slideContent}>
      <View style={styles.ctaCard}>
        <Image source={LOGO_IMG} style={styles.ctaLogo} resizeMode="contain" />
        <Text style={styles.ctaMainTitle}>Start Your Journey</Text>
        <Text style={styles.ctaMainSubtitle}>
          Join 10,000+ students learning faster with Cloop.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/login-sigup/sigup')}
        >
          <Text style={styles.primaryButtonText}>Start Free</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/login-sigup/login')}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />

      <View style={styles.header}>
        {currentIndex > 0 && slides[currentIndex].title ? (
          <Text style={styles.headerTitle}>{slides[currentIndex].title}</Text>
        ) : null}
      </View>

      <Animated.ScrollView
        ref={slidesRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            {slide.id === 'hero' && renderHeroContent()}
            {slide.id === 'features' && renderFeaturesContent()}
            {slide.id === 'capabilities' && renderCapabilitiesContent()}
            {slide.id === 'comparison' && renderComparisonContent()}
            {slide.id === 'cta' && renderCTAContent()}
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: THEME.colors.primary }]}
              />
            );
          })}
        </View>

        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnHidden]}
            onPress={() => scrollTo(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <Ionicons name="arrow-back" size={24} color={THEME.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrimary, currentIndex === slides.length - 1 && styles.navBtnHidden]}
            onPress={() => scrollTo(currentIndex + 1)}
            disabled={currentIndex === slides.length - 1}
          >
            <Ionicons name="arrow-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
  },
  loadingLogo: {
    width: 120,
    height: 120,
  },
  header: {
    height: 50, // Reduced height
    justifyContent: 'flex-end', // Align bottom to be closer to content
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.l,
    paddingBottom: 3, // Reduced padding
  },
  headerTitle: {
    ...THEME.typography.h3,
    fontSize: 22, // Slightly larger
    fontWeight: '700', // Bold
    color: THEME.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    width: width,
    paddingHorizontal: THEME.spacing.l,
    paddingTop: 0, // Remove top padding to bring content closer to header
    paddingBottom: 100, // Space for bottom container
    alignItems: 'center',
  },
  slideContent: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 0, // Remove top padding from content
  },

  // Hero
  heroHeader: {
    alignItems: 'center',
    marginBottom: THEME.spacing.m,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: THEME.spacing.s,
  },
  heroBrand: {
    fontSize: 36,
    fontWeight: '900',
    color: THEME.colors.text.primary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  heroImageContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.l,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: THEME.spacing.l,
    borderRadius: THEME.sizes.radius.xl,
    width: '100%',
    ...THEME.shadows.medium,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  infoText: {
    ...THEME.typography.body,
    textAlign: 'center',
    color: THEME.colors.text.primary,
    fontSize: 16,
    lineHeight: 24,
  },
  highlightText: {
    fontWeight: '700',
    color: THEME.colors.secondary,
  },

  // Features
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: THEME.spacing.l, // Reduced padding
    borderRadius: THEME.sizes.radius.xl,
    marginBottom: THEME.spacing.m, // Reduced margin
    width: '100%',
    alignItems: 'center',
    ...THEME.shadows.medium,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  featureImage: {
    width: 100, // Reduced size
    height: 100, // Reduced size
    marginBottom: THEME.spacing.s, // Reduced margin
  },
  iconBox: {
    width: 70, // Reduced size
    height: 70, // Reduced size
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.s, // Reduced margin
  },
  cardTitle: {
    ...THEME.typography.h3,
    fontSize: 20, // Slightly smaller
    marginBottom: 4,
    textAlign: 'center',
  },
  cardText: {
    ...THEME.typography.body,
    textAlign: 'center',
    color: THEME.colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
  },

  // Capabilities List (New Layout)
  listContainer: {
    width: '100%',
    gap: THEME.spacing.m,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: THEME.spacing.m,
    borderRadius: THEME.sizes.radius.l,
    ...THEME.shadows.small,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.m,
  },
  listTextContainer: {
    flex: 1,
  },
  listTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: THEME.colors.text.primary,
    marginBottom: 2,
  },
  listDesc: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },

  // Comparison
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    padding: THEME.spacing.l,
    borderRadius: THEME.sizes.radius.xl,
    width: '100%',
    ...THEME.shadows.medium,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.l,
  },
  comparisonHeader: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.m,
    paddingBottom: THEME.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  colHeader: {
    fontWeight: '700',
    fontSize: 16,
    color: THEME.colors.primary,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  iconCol: {
    flex: 1,
    alignItems: 'center',
  },

  // CTA
  ctaCard: {
    backgroundColor: '#FFFFFF',
    padding: THEME.spacing.xl,
    borderRadius: THEME.sizes.radius.xl,
    width: '100%',
    alignItems: 'center',
    ...THEME.shadows.large,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginTop: THEME.spacing.l,
  },
  ctaLogo: {
    width: 100,
    height: 100,
    marginBottom: THEME.spacing.m,
  },
  ctaMainTitle: {
    ...THEME.typography.h2,
    fontSize: 28,
    marginBottom: THEME.spacing.s,
    textAlign: 'center',
  },
  ctaMainSubtitle: {
    ...THEME.typography.body,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
    color: THEME.colors.text.secondary,
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    width: '100%',
    height: 60,
    borderRadius: THEME.sizes.radius.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.m,
    ...THEME.shadows.medium,
  },
  primaryButtonText: {
    ...THEME.typography.button,
    fontSize: 20,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 60,
    borderRadius: THEME.sizes.radius.l,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.secondary,
  },
  secondaryButtonText: {
    ...THEME.typography.button,
    color: THEME.colors.secondary,
    fontSize: 20,
  },

  // Bottom Container
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: THEME.spacing.l,
    paddingBottom: Platform.OS === 'android' ? 24 : 0, // Add padding for Android nav bar
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.background,
    // Add gradient or blur if needed, but solid background is safer for overlap issues
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  navButtons: {
    flexDirection: 'row',
    gap: THEME.spacing.m,
  },
  navBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.small,
  },
  navBtnPrimary: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  navBtnHidden: {
    opacity: 0,
  },
});
