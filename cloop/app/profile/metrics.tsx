import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserMetrics } from '../../src/client/profile/useProgress';

export default function MetricsScreen() {
  const router = useRouter();
  const { metrics, loading, error, refetch } = useUserMetrics();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.loadingText}>Loading your metrics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
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
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.noDataText}>No metrics data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Learning Metrics</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Ionicons name="school-outline" size={24} color="#2563eb" />
              <Text style={styles.overviewNumber}>{metrics.overview.completed_subjects}</Text>
              <Text style={styles.overviewLabel}>Completed Subjects</Text>
              <Text style={styles.overviewSubtext}>of {metrics.overview.total_subjects} total</Text>
            </View>
            <View style={styles.overviewCard}>
              <Ionicons name="book-outline" size={24} color="#10b981" />
              <Text style={styles.overviewNumber}>{metrics.overview.completed_chapters}</Text>
              <Text style={styles.overviewLabel}>Completed Chapters</Text>
              <Text style={styles.overviewSubtext}>of {metrics.overview.total_chapters} total</Text>
            </View>
            <View style={styles.overviewCard}>
              <Ionicons name="checkbox-outline" size={24} color="#f59e0b" />
              <Text style={styles.overviewNumber}>{metrics.overview.total_topics_completed}</Text>
              <Text style={styles.overviewLabel}>Topics Mastered</Text>
              <Text style={styles.overviewSubtext}>across all subjects</Text>
            </View>
            <View style={styles.overviewCard}>
              <Ionicons name="trending-up-outline" size={24} color="#8b5cf6" />
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
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
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
                    <Ionicons name="alert-circle" size={20} color="#f59e0b" />
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
              <Ionicons name="chatbubbles-outline" size={24} color="#2563eb" />
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    fontWeight: '600',
    color: '#333',
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
    borderRadius: 12,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  overviewSubtext: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  subjectProgressContainer: {
    gap: 12,
  },
  subjectProgressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subjectPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subjectStat: {
    fontSize: 12,
    color: '#666',
  },
  topicsContainer: {
    gap: 10,
  },
  topicCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  strongTopicCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  weakTopicCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
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
    color: '#333',
  },
  topicSubject: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  topicCompletion: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 2,
  },
  topicActivity: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '500',
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  activityLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 15,
  },
  mostActiveSection: {
    marginTop: 5,
  },
  mostActiveTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  mostActiveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  mostActiveTopicName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  mostActiveTopicCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#2563eb',
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
    color: '#666',
    textAlign: 'center',
  },
});