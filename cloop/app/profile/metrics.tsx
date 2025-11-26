import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Pressable, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserMetrics } from '../../src/client/profile/useProgress';
import { THEME } from '../../src/constants/theme';

const LOGO_IMG = require('../../assets/images/logo.png');

export default function MetricsScreen() {
  const router = useRouter();
  const { metrics, loading, error, refetch } = useUserMetrics();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.loadingText}>Loading your metrics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!metrics) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.noDataText}>No metrics data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.text.primary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Image source={LOGO_IMG} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>Learning Metrics</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="school-outline" size={24} color={THEME.colors.primary} />
              </View>
              <Text style={styles.overviewNumber}>{metrics.overview.completed_subjects}</Text>
              <Text style={styles.overviewLabel}>Completed Subjects</Text>
              <Text style={styles.overviewSubtext}>of {metrics.overview.total_subjects} total</Text>
            </View>
            <View style={styles.overviewCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="book-outline" size={24} color={THEME.colors.success} />
              </View>
              <Text style={styles.overviewNumber}>{metrics.overview.completed_chapters}</Text>
              <Text style={styles.overviewLabel}>Completed Chapters</Text>
              <Text style={styles.overviewSubtext}>of {metrics.overview.total_chapters} total</Text>
            </View>
            <View style={styles.overviewCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="checkbox-outline" size={24} color={THEME.colors.secondary} />
              </View>
              <Text style={styles.overviewNumber}>{metrics.overview.total_topics_completed}</Text>
              <Text style={styles.overviewLabel}>Topics Mastered</Text>
              <Text style={styles.overviewSubtext}>across all subjects</Text>
            </View>
            <View style={styles.overviewCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="trending-up-outline" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.overviewNumber}>{metrics.overview.overall_progress}%</Text>
              <Text style={styles.overviewLabel}>Overall Progress</Text>
              <Text style={styles.overviewSubtext}>learning journey</Text>
            </View>
          </View>
        </View>

        {/* Subject Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Progress</Text>
          <View style={styles.subjectProgressContainer}>
            {metrics.subject_progress.map((subject, index) => (
              <View key={index} style={styles.subjectProgressCard}>
                <View style={styles.subjectProgressHeader}>
                  <Text style={styles.subjectName}>{subject.subject.name}</Text>
                  <Text style={styles.subjectPercent}>{subject.completion_percent}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${subject.completion_percent}%` }
                    ]}
                  />
                </View>
                <View style={styles.subjectStats}>
                  <Text style={styles.subjectStat}>
                    {subject.completed_chapters}/{subject.total_chapters} chapters
                  </Text>
                  <Text style={styles.subjectStat}>
                    {subject.topics_completed} topics completed
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Strong Topics */}
        {metrics.strong_topics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strong Topics</Text>
            <View style={styles.topicsContainer}>
              {metrics.strong_topics.map((topic, index) => (
                <View key={index} style={[styles.topicCard, styles.strongTopicCard]}>
                  <View style={styles.topicIcon}>
                    <Ionicons name="checkmark-circle" size={20} color={THEME.colors.success} />
                  </View>
                  <View style={styles.topicInfo}>
                    <Text style={styles.topicTitle}>{topic.title}</Text>
                    <Text style={styles.topicSubject}>{topic.subject} - {topic.chapter}</Text>
                    <Text style={styles.topicCompletion}>{topic.completion_percent}% complete</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Weak Topics */}
        {metrics.weak_topics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Topics Needing Attention</Text>
            <View style={styles.topicsContainer}>
              {metrics.weak_topics.map((topic, index) => (
                <View key={index} style={[styles.topicCard, styles.weakTopicCard]}>
                  <View style={styles.topicIcon}>
                    <Ionicons name="alert-circle" size={20} color={THEME.colors.secondary} />
                  </View>
                  <View style={styles.topicInfo}>
                    <Text style={styles.topicTitle}>{topic.title}</Text>
                    <Text style={styles.topicSubject}>{topic.subject} - {topic.chapter}</Text>
                    <Text style={styles.topicActivity}>{topic.chat_count} chat sessions</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Activity Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Summary</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="chatbubbles-outline" size={24} color={THEME.colors.primary} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityNumber}>{metrics.activity.total_chat_sessions}</Text>
                <Text style={styles.activityLabel}>Total Chat Sessions</Text>
              </View>
            </View>

            <View style={styles.activityDivider} />

            <View style={styles.mostActiveSection}>
              <Text style={styles.mostActiveTitle}>Most Active Topics</Text>
              {metrics.activity.most_active_topics.slice(0, 3).map((topic, index) => (
                <View key={index} style={styles.mostActiveItem}>
                  <Text style={styles.mostActiveTopicName}>{topic.title}</Text>
                  <Text style={styles.mostActiveTopicCount}>{topic.chat_count} chats</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 15,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text.primary,
  },
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text.primary,
    marginBottom: 15,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    width: '47%',
    alignItems: 'center',
    ...THEME.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.text.primary,
    marginTop: 4,
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  overviewSubtext: {
    fontSize: 10,
    color: THEME.colors.text.light,
    textAlign: 'center',
    marginTop: 2,
  },
  subjectProgressContainer: {
    gap: 12,
  },
  subjectProgressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    ...THEME.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  subjectProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text.primary,
  },
  subjectPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
    borderRadius: 4,
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subjectStat: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: '500',
  },
  topicsContainer: {
    gap: 10,
  },
  topicCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...THEME.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  strongTopicCard: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.success,
  },
  weakTopicCard: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.secondary,
  },
  topicIcon: {
    marginRight: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  topicSubject: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  topicCompletion: {
    fontSize: 11,
    color: THEME.colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  topicActivity: {
    fontSize: 11,
    color: THEME.colors.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    ...THEME.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  activityInfo: {
    marginLeft: 15,
  },
  activityNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.text.primary,
  },
  activityLabel: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
  activityDivider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 15,
  },
  mostActiveSection: {
    marginTop: 5,
  },
  mostActiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text.primary,
    marginBottom: 12,
  },
  mostActiveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mostActiveTopicName: {
    fontSize: 13,
    color: THEME.colors.text.primary,
    flex: 1,
    fontWeight: '500',
  },
  mostActiveTopicCount: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
  },
  errorText: {
    fontSize: 16,
    color: THEME.colors.error,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
});