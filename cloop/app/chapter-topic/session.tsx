import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useUserProfile } from '../../src/client/profile/useUserProfile';
import { useChatHistory } from '../../src/client/profile/useProgress';
import { THEME } from '../../src/constants/theme';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';
import { SubjectIcon } from '../../components/common/SubjectIcon';
import { fetchSavedTopics, SavedTopic } from '../../src/client/saved-topics/saved-topics-client';


const CLOOP_ICON = require('../../assets/images/cloop-icon.png');

type FilterType = 'saved' | 'completed' | 'incomplete';

export default function SessionScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { academicInfo } = useUserProfile();
  const { chatHistory, loading, refetch } = useChatHistory();
  const [activeTab, setActiveTab] = useState('session');
  const [filterType, setFilterType] = useState<FilterType>('completed');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>([]);


  useFocusEffect(
    useCallback(() => {
      refetch();
      if (filterType === 'saved' && user?.user_id) {
        fetchSavedTopics(user.user_id, token || undefined)
          .then(data => {
            console.log('Fetched saved topics:', data);
            setSavedTopics(data);
          })
          .catch(err => console.error('Error fetching saved topics:', err));
      }
    }, [filterType, user, token])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    if (filterType === 'saved' && user?.user_id) {
      try {
        const saved = await fetchSavedTopics(user.user_id, token || undefined);
        console.log('Refreshed saved topics:', saved);
        setSavedTopics(saved);
      } catch (err) {
        console.error('Error refreshing saved topics:', err);
      }
    }
    setRefreshing(false);
  }, [refetch, filterType, user, token]);




  // Helper functions from Home Screen
  const getBoardCode = (boardName: string): string => {
    if (!boardName) return '';
    const name = boardName.toLowerCase();
    if (name.includes('central board')) return 'CBSE';
    if (name.includes('indian certificate')) return 'ICSE';
    if (name.includes('state board')) return 'State Board';
    // Return acronym if possible
    const match = boardName.match(/\b(\w)/g);
    return match ? match.join('').toUpperCase() : boardName;
  };

  const getGradeDisplay = (grade: string | undefined) => {
    if (!grade) return '';
    const cleanGrade = grade.replace(/^Class\s+/i, '');
    return `Class ${cleanGrade}`;
  };

  // Filter logic
  const getFilteredSessions = () => {
    if (filterType === 'saved') {
      return savedTopics.map(st => ({
        topic_id: st.topic_id,
        title: st.topics.title,
        subject: st.topics.subjects?.name || 'Unknown',
        chapter: st.topics.chapters?.title || 'Unknown',
        completion_percent: Number(st.topics.completion_percent) || 0,
        is_completed: st.topics.is_completed,
        chat_count: 0
      })).filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return chatHistory.filter((session) => {
      // Filter by search query
      if (searchQuery && !session.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filter by type
      if (filterType === 'completed') {
        return true;
      } else if (filterType === 'incomplete') {
        return !session.is_completed;
      }

      return true;
    });
  };

  const filteredSessions = getFilteredSessions();

  const renderSavedCard = (session: any, index: number) => (
    <Pressable
      key={session.topic_id}
      style={[
        styles.sessionCard,
        {
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginHorizontal: -10, // Make card wider by extending into parent padding
          width: 'auto' // ensure it stretches
        }
      ]}
      onPress={() => {
        router.push(`/chat/topic-chat?topicId=${session.topic_id}` as any);
      }}
    >
      <View style={[styles.sessionHeader, { marginBottom: 0 }]}>
        <View style={styles.sessionIconContainer}>
          <Ionicons
            name="bookmark"
            size={24}
            color="#8B5CF6"
          />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          <Text style={styles.sessionSubject}>{session.subject}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={THEME.colors.text.secondary} />
      </View>
    </Pressable>
  );

  const renderSessionCard = (session: any, index: number) => (
    <Pressable
      key={session.topic_id}
      style={styles.sessionCard}
      onPress={() => {
        router.push(`/chat/topic-chat?topicId=${session.topic_id}` as any);
      }}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionIconContainer}>
          <Ionicons
            name={session.is_completed ? 'checkmark-circle' : 'time-outline'}
            size={24}
            color={session.is_completed ? '#10B981' : '#8B5CF6'}
          />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          <Text style={styles.sessionSubject}>{session.subject} - {session.chapter}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={THEME.colors.text.secondary} />
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            In progress: {Math.round(session.completion_percent || 0)}%
          </Text>
          <Text style={styles.daysText}>
            {session.chat_count || 0} sessions
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${session.completion_percent || 0}%`,
                backgroundColor: session.is_completed ? '#10B981' : '#8B5CF6'
              }
            ]}
          />
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />

      {/* Header - Matching Home Screen */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Image
              source={CLOOP_ICON}
              style={styles.headerAvatar}
              resizeMode="contain"
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerGreeting}>
                Hi {user?.name?.split(' ')[0] || 'User'},
                <Text style={styles.headerClass}> {getGradeDisplay(academicInfo?.grade_level || '10')} | {getBoardCode(academicInfo?.board || 'CBSE')}</Text>
              </Text>
              <Text style={styles.headerSubtitle}>Let's get started!</Text>
            </View>
          </View>
          <Pressable style={styles.notificationButton} onPress={() => router.push('/notifications/notifications' as any)}>
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Search and Filter - Matched Home Screen Style */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Topics"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#8B5CF6" />
              </Pressable>
            )}
          </View>
          {/* Removed extra cross logo/filter button as requested */}
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <Pressable
            style={[
              styles.filterButton,
              filterType === 'saved' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('saved')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'saved' && styles.filterButtonTextActive
            ]}>
              Saved
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterButton,
              filterType === 'completed' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('completed')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'completed' && styles.filterButtonTextActive
            ]}>
              Completed
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterButton,
              filterType === 'incomplete' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('incomplete')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'incomplete' && styles.filterButtonTextActive
            ]}>
              Incomplete
            </Text>
          </Pressable>
        </View>

        {/* Previous Sessions */}
        <Text style={styles.sectionTitle}>
          {filterType === 'completed' ? 'Completed Sessions' :
            filterType === 'incomplete' ? 'Incomplete Sessions' :
              'Saved Sessions'}
        </Text>

        {filteredSessions.length > 0 ? (
          filteredSessions.map((session, index) =>
            filterType === 'saved'
              ? renderSavedCard(session, index)
              : renderSessionCard(session, index)
          )
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No {filterType} sessions</Text>
            <Text style={styles.emptyMessage}>
              Your {filterType} sessions will appear here.
            </Text>
          </View>
        )}

        {/* Enrolled Subjects */}
        {/* Enrolled Subjects */}
        <Text style={styles.sectionTitle}>Enrolled Subjects</Text>
        <View style={styles.subjectsGrid}>
          {academicInfo?.user_subjects && academicInfo.user_subjects.length > 0 ? (
            academicInfo.user_subjects.map((userSubject, index) => (
              <Pressable
                key={index}
                style={styles.subjectCard}
                onPress={() => router.push(`/chapter-topic/chapter?subjectId=${userSubject.subject.id}&subjectName=${encodeURIComponent(userSubject.subject.name)}` as any)}
              >
                <View style={styles.subjectIconContainer}>
                  <SubjectIcon subject={userSubject.subject.name} size={60} />
                </View>
                <Text style={styles.subjectName}>{userSubject.subject.name}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.noSubjects}>No subjects enrolled</Text>
          )}
        </View>

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
  header: {
    backgroundColor: '#8B5CF6',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerClass: {
    fontWeight: '400',
    fontSize: 14,
    color: '#E9D5FF',
  },
  headerBoard: {
    fontWeight: '600',
    fontSize: 16,
    color: '#F3E8FF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E9D5FF',
    marginTop: 2,
    fontWeight: '500',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    marginTop: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9D5FF',
    borderRadius: 20, // Full pill shape
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 0,
  },
  searchFilterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sessionSubject: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressSection: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  daysText: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
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
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  subjectCard: {
    width: '31%', // Slight increase to reduce horizontal gaps
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10, // Reduced from 16
    alignItems: 'center',
    marginBottom: 12, // Reduced from 16
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectIconContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4, // Reduced from 8
  },
  subjectName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  noSubjects: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    width: '100%',
    marginTop: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});
