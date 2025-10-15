import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { fetchTopics, Topic, ChapterDetails } from '../../src/client/chapters/chapters';

export default function TopicScreen() {
  const router = useRouter();
  const { chapterId, chapterTitle, subjectName } = useLocalSearchParams<{
    chapterId: string;
    chapterTitle: string;
    subjectName: string;
  }>();
  const { user, token } = useAuth();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [chapter, setChapter] = useState<ChapterDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chapterId && user && token) {
      loadTopics();
    }
  }, [chapterId, user, token]);

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
    if (percentage >= 50) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const renderTopicCard = (topic: Topic, index: number) => (
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
          {topic.is_completed && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          )}
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color="#9CA3AF" 
          />
        </View>
      </View>
      
      {Number(topic.completion_percent) > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>Progress</Text>
            <Text style={[
              styles.completionPercentage,
              { color: getCompletionColor(Number(topic.completion_percent)) }
            ]}>
              {topic.completion_percent}% Complete
            </Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { 
                  width: `${topic.completion_percent}%`,
                  backgroundColor: getCompletionColor(Number(topic.completion_percent))
                }
              ]} 
            />
          </View>
        </View>
      )}

      <View style={styles.topicFooter}>
        <View style={styles.topicMeta}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>
            Added {new Date(topic.created_at).toLocaleDateString()}
          </Text>
        </View>
        {topic.content && (
          <View style={styles.topicMeta}>
            <Ionicons name="document-text-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>Has content</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading topics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadTopics}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const completedTopics = topics.filter(t => t.is_completed).length;
  const overallProgress = topics.length > 0 
    ? Math.round(topics.reduce((acc, t) => acc + Number(t.completion_percent), 0) / topics.length)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
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
            <Ionicons name="library" size={24} color="#2563eb" />
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
            <Text style={[styles.statNumber, { color: '#6B7280' }]}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    color: '#EF4444',
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
    backgroundColor: '#2563eb',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    backgroundColor: '#EFF6FF',
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
    color: '#111827',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  overallProgress: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
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
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  topicsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
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
    color: '#111827',
    marginBottom: 2,
  },
  completedTopicTitle: {
    color: '#065F46',
  },
  topicNumber: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#6B7280',
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
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});