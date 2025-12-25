import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { fetchTopics, Topic, ChapterDetails } from '../../src/client/chapters/chapters';
import { THEME } from '../../src/constants/theme';
import { SubjectIcon } from '../../components/common/SubjectIcon';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';
import { fetchSavedTopics, saveTopic, unsaveTopic } from '../../src/client/saved-topics/saved-topics-client';


export default function TopicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chapterId, chapterTitle, subjectName } = useLocalSearchParams<{
    chapterId: string;
    chapterTitle: string;
    subjectName: string;
  }>();
  const { user, token } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [savedTopicIds, setSavedTopicIds] = useState<Set<number>>(new Set());

  const [chapter, setChapter] = useState<ChapterDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  useFocusEffect(
    useCallback(() => {
      if (chapterId && user && token) {
        loadTopics();
      }
      if (user && user.user_id) {
        loadSavedTopics();
      }
    }, [chapterId, user, token])
  );

  const loadSavedTopics = async () => {
    if (!user?.user_id) return;
    try {
      const saved = await fetchSavedTopics(user.user_id, token || undefined);
      setSavedTopicIds(new Set(saved.map(s => s.topic_id)));
    } catch (err) {
      console.error('Failed to load saved topics', err);
    }
  };


  const loadTopics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchTopics(parseInt(chapterId!), {
        userId: user?.user_id,
        token: token || undefined
      });

      setTopics(response.topics);
      setChapter(response.chapter);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load topics';
      setError(errorMessage);
      console.error('Error loading topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (topicId: number) => {
    if (!user?.user_id) return;
    const isSaved = savedTopicIds.has(topicId);

    // Optimistic update
    const newSaved = new Set(savedTopicIds);
    if (isSaved) {
      newSaved.delete(topicId);
    } else {
      newSaved.add(topicId);
    }
    setSavedTopicIds(newSaved);

    try {
      if (isSaved) {
        await unsaveTopic(user.user_id, topicId, token || undefined);
      } else {
        await saveTopic(user.user_id, topicId, token || undefined);
      }
    } catch (err) {
      // Revert on error
      console.error('Failed to toggle save topic', err);
      // Re-fetch to ensure sync
      loadSavedTopics();
      alert('Failed to update bookmark');
    }
  };

  const handleTopicPress = (topic: Topic) => {
    router.push(`/chat/topic-chat?topicId=${topic.id}&topicTitle=${encodeURIComponent(topic.title)}&chapterTitle=${encodeURIComponent(chapterTitle || '')}&subjectName=${encodeURIComponent(subjectName || '')}` as any);
  };

  const getStatusIcon = (isCompleted: boolean) => {
    return isCompleted ? 'checkmark-circle' : 'radio-button-off';
  };

  const getStatusColor = (isCompleted: boolean) => {
    return isCompleted ? '#10B981' : '#D1D5DB';
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 50) return THEME.colors.secondary; // Yellow
    return THEME.colors.primary; // Red
  };

  const formatTimeSpent = (seconds: number) => {
    if (seconds === 0) return 'Not started';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    } else {
      return `${seconds}s`;
    }
  };

  const renderTopicCard = (topic: Topic, index: number) => {
    // Parse completion_percent properly
    const completionPercent = Number(topic.completion_percent) || 0;
    const timeSpentSeconds = topic.time_spent_seconds || 0;

    return (
      <Pressable
        key={topic.id}
        style={[
          styles.topicCard,
          topic.is_completed && styles.completedTopicCard
        ]}
        onPress={() => handleTopicPress(topic)}
      >
        <View style={styles.topicHeader}>
          <View style={styles.topicIconContainer}>
            <Ionicons
              name={getStatusIcon(topic.is_completed)}
              size={24}
              color={getStatusColor(topic.is_completed)}
            />
          </View>
          <View style={styles.topicInfo}>
            <Text style={[
              styles.topicTitle,
              topic.is_completed && styles.completedTopicTitle
            ]}>
              {topic.title}
            </Text>
            <Text style={styles.topicNumber}>Topic {index + 1}</Text>
          </View>
          <View style={styles.topicActions}>
            <Pressable
              onPress={() => handleToggleSave(topic.id)}
              style={{ padding: 8, marginRight: 4 }}
            >
              <Ionicons
                name={savedTopicIds.has(topic.id) ? "bookmark" : "bookmark-outline"}
                size={24}
                color="#8B5CF6"
              />
            </Pressable>

            {/* Play/Chevron Button */}
            <Pressable
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#8B5CF6',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="play" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {completionPercent > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>Progress</Text>
              <Text style={[
                styles.completionPercentage,
                { color: getCompletionColor(completionPercent) }
              ]}>
                {Math.round(completionPercent)}% Complete
              </Text>
            </View>

            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${completionPercent}%`,
                    backgroundColor: getCompletionColor(completionPercent)
                  }
                ]}
              />
            </View>
          </View>
        )}

        <View style={styles.topicFooter}>
          <View style={styles.topicMeta}>
            <Ionicons name="time-outline" size={14} color={THEME.colors.text.secondary} />
            <Text style={styles.metaText}>
              {formatTimeSpent(timeSpentSeconds)}
            </Text>
          </View>
          {topic.content && (
            <View style={styles.topicMeta}>
              <Ionicons name="document-text-outline" size={14} color={THEME.colors.text.secondary} />
              <Text style={styles.metaText}>Has content</Text>
            </View>
          )}
        </View>
      </Pressable>
    )
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading topics...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#8B5CF6" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadTopics}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const completedTopics = topics.filter(t => t.is_completed).length;
  const overallProgress = topics.length > 0
    ? Math.round(topics.reduce((acc, t) => acc + Number(t.completion_percent), 0) / topics.length)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{chapter?.title || chapterTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {subjectName} • {topics.length} Topics
          </Text>
        </View>

      </View>

      {/* Chapter Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="library" size={24} color={THEME.colors.primary} />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle}>Chapter Progress</Text>
            <Text style={styles.summarySubtitle}>
              {completedTopics} of {topics.length} topics completed
            </Text>
          </View>
          <Text style={styles.overallProgress}>{overallProgress}%</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${(completedTopics / topics.length) * 100}%`,
                backgroundColor: getCompletionColor((completedTopics / topics.length) * 100)
              }
            ]}
          />
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{topics.length}</Text>
            <Text style={styles.statLabel}>Total Topics</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{completedTopics}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: THEME.colors.text.secondary }]}>
              {topics.length - completedTopics}
            </Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      </View>

      {/* Topics List */}
      <ScrollView
        style={styles.topicsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Topics</Text>
        {topics.length > 0 ? (
          topics.map((topic, index) => renderTopicCard(topic, index))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Topics Available</Text>
            <Text style={styles.emptyMessage}>
              Topics for this chapter will appear here once they are created.
            </Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabPress={(tabId) => {
          setActiveTab(tabId);
          if (tabId === 'home') router.push('/home/home' as any);
          else if (tabId === 'statistics') router.push('/metrices/home' as any);
          else if (tabId === 'profile') router.push('/profile/profile' as any);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginTop: 2,
    fontFamily: 'System',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E9D5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text.primary,
    fontFamily: 'System',
  },
  summarySubtitle: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  overallProgress: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  statLabel: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 4,
  },
  topicsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text.primary,
    marginBottom: 16,
    fontFamily: 'System',
  },
  topicCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completedTopicCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicIconContainer: {
    marginRight: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text.primary,
    marginBottom: 2,
    fontFamily: 'System',
  },
  completedTopicTitle: {
    color: '#065F46',
  },
  topicNumber: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  topicActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  completedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  completionPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

});