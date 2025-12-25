
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
  Alert,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { fetchChapters, Chapter, Subject } from '../../src/client/chapters/chapters';
import { THEME } from '../../src/constants/theme';
import { SubjectIcon } from '../../components/common/SubjectIcon';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';

export default function ChapterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subjectId, subjectName } = useLocalSearchParams<{
    subjectId: string;
    subjectName: string;
  }>();
  const { user, token, isLoading: authLoading } = useAuth();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');



  useFocusEffect(
    useCallback(() => {
      console.log('[ChapterScreen] useFocusEffect triggered', { subjectId, authLoading, hasUser: !!user, hasToken: !!token });

      // Wait for auth initialization
      if (authLoading) {
        console.log('[ChapterScreen] Waiting for auth loading...');
        return;
      }

      if (!subjectId) {
        console.error('[ChapterScreen] Missing subjectId');
        setError('Invalid subject parameters');
        setLoading(false);
        return;
      }

      if (!user || !token) {
        console.error('[ChapterScreen] Missing user or token', { user: !!user, token: !!token });
        setError('Authentication required');
        setLoading(false);
        return;
      }

      console.log('[ChapterScreen] All checks passed, calling loadChapters');
      loadChapters();
    }, [subjectId, user, token, authLoading])
  );

  const loadChapters = async () => {
    console.log('[ChapterScreen] loadChapters started');
    try {
      setLoading(true);
      setError(null);

      console.log('[ChapterScreen] Calling fetchChapters API');
      const response = await fetchChapters(parseInt(subjectId!), {
        userId: user?.user_id,
        token: token || undefined
      });
      console.log('[ChapterScreen] fetchChapters success', response);

      setChapters(response.chapters);
      setSubject(response.subject);
    } catch (err) {
      console.error('[ChapterScreen] fetchChapters error', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chapters';
      setError(errorMessage);
    } finally {
      console.log('[ChapterScreen] loadChapters finished, setting loading to false');
      setLoading(false);
    }
  };

  const handleChapterPress = (chapter: Chapter) => {
    router.push({
      pathname: '/chapter-topic/topic',
      params: {
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        subjectId,
        subjectName
      }
    });
  };

  const getCompletionColor = (percent: number) => {
    if (percent >= 100) return '#10B981';
    if (percent >= 50) return '#F59E0B';
    return THEME.colors.primary;
  };

  const renderChapterCard = (chapter: Chapter, index: number) => (
    <Pressable
      key={chapter.id}
      style={styles.chapterCard}
      onPress={() => handleChapterPress(chapter)}
    >
      <View style={styles.chapterHeader}>
        <View style={styles.chapterIconContainer}>
          <SubjectIcon subject={subject?.name || subjectName} size={40} />
        </View>
        <View style={styles.chapterInfo}>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          <Text style={styles.chapterNumber}>Chapter {index + 1}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={THEME.colors.text.secondary}
        />
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {chapter.completed_topics}/{chapter.total_topics} topics completed
          </Text>
          <Text style={[
            styles.completionPercentage,
            { color: getCompletionColor(Number(chapter.completion_percent)) }
          ]}>
            {chapter.completion_percent}% Complete
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${chapter.completion_percent}%`,
                backgroundColor: getCompletionColor(Number(chapter.completion_percent))
              }
            ]}
          />
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Ionicons name="library-outline" size={16} color={THEME.colors.text.secondary} />
          <Text style={styles.metricText}>{chapter.total_topics} Topics</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
          <Text style={styles.metricText}>{chapter.completed_topics} Done</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="time-outline" size={16} color={THEME.colors.text.secondary} />
          <Text style={styles.metricText}>
            {new Date(chapter.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading chapters...</Text>
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
          <Pressable style={styles.retryButton} onPress={loadChapters}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>{subject?.name || subjectName}</Text>
          <Text style={styles.headerSubtitle}>{chapters.length} Chapters Available</Text>
        </View>

      </View>

      {/* Subject Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{chapters.length}</Text>
            <Text style={styles.summaryLabel}>Total Chapters</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {chapters.filter(c => Number(c.completion_percent) === 100).length}
            </Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {Math.round(chapters.reduce((acc, c) => acc + Number(c.completion_percent), 0) / chapters.length) || 0}%
            </Text>
            <Text style={styles.summaryLabel}>Overall Progress</Text>
          </View>
        </View>
      </View>

      {/* Chapters List */}
      <ScrollView
        style={styles.chaptersContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Chapters</Text>
        {chapters.length > 0 ? (
          chapters.map((chapter, index) => renderChapterCard(chapter, index))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="library-outline" size={72} color="#D1D5DB" />
            </View>

            <Text style={styles.emptyTitle}>No Chapters Available</Text>
            <Text style={styles.emptyMessage}>
              No chapters have been created for {subjectName || 'this subject'} yet.
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
    fontFamily: 'System',
  },
  summaryLabel: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  chaptersContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700', // Bold
    color: THEME.colors.text.primary,
    marginBottom: 16,
    fontFamily: 'System',
  },
  chapterCard: {
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
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chapterIconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text.primary,
    marginBottom: 2,
    fontFamily: 'System',
  },
  chapterNumber: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
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
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricText: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

});
