import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Image, StatusBar, ScrollView, SafeAreaView, Modal, Platform, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../../src/client/profile/useUserProfile';
import { useChatHistory } from '../../src/client/profile/useProgress';
import { THEME } from '../../src/constants/theme';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';
import { SubjectIcon } from '../../components/common/SubjectIcon';
import { API_BASE_URL } from '../../src/config/api';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CLOOP_ICON = require('../../assets/images/cloop-icon.png');


export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, logout, user, isLoading } = useAuth();
  const {
    profile,
    academicInfo,
    progressInfo,
    loading,
    error,
    isProfileComplete,

    missingFields,
    refetch: refetchProfile
  } = useUserProfile();
  const {
    chatHistory,
    loading: chatHistoryLoading,
    error: chatHistoryError,
    refetch: refetchChatHistory
  } = useChatHistory();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chatHistoryRefreshing, setChatHistoryRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  interface RecentReport {
    id: number;
    topic_id: number;
    score_percent: number;
    total_questions: number;
    correct_answers: number;
    incorrect_answers: number;
    topics: {
      title: string;
      chapters: {
        title: string;
        subjects: {
          id: number;
        }
      };
      subject_id?: number; // Optional fallback
    };
    created_at: string;
    subject_id?: number; // Top level fallback
  }

  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchUnreadCount = async () => {
    if (isAuthenticated && ((user as any)?.token || (user as any)?.session?.access_token)) {
      try {
        const token = (user as any)?.token || (user as any)?.session?.access_token;
        // Dynamic import or ensure client is imported
        const { getUnreadNotificationCount } = require('../../src/client/notifications');
        const count = await getUnreadNotificationCount(token);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      // Fetch Recent Reports
      const fetchRecentReports = async () => {
        const token = (user as any)?.token || (user as any)?.session?.access_token;

        if (!token) {
          console.log("No token found for recent reports fetch");
          setLoadingReports(false);
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/api/topic-chats/reports/recent`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setRecentReports(data);
          }
        } catch (error) {
          console.error("Failed to fetch recent reports", error);
        } finally {
          setLoadingReports(false);
        }
      };

      fetchRecentReports();
    }
  }, [isAuthenticated, refreshing]); // Re-fetch on refresh

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchProfile();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProfile]);

  const onRefreshChatHistory = useCallback(async () => {
    setChatHistoryRefreshing(true);
    try {
      await refetchChatHistory();
    } catch (error) {
      console.error('Error refreshing chat history:', error);
    } finally {
      setChatHistoryRefreshing(false);
    }
  }, [refetchChatHistory]);

  useEffect(() => {
    // Set mounted flag after component is mounted
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      // Add small delay to ensure router is ready
      const timer = setTimeout(() => {
        try {
          router.replace('/login-sigup/login');
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback navigation
          window.location.href = '/login-sigup/login';
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router, isMounted, isLoading]);

  const handleLogout = async () => {
    try {
      await logout();
      // Use a small delay before navigation
      setTimeout(() => {
        try {
          router.replace('/');
        } catch (error) {
          console.error('Navigation error after logout:', error);
          window.location.href = '/';
        }
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading during auth initialization
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Redirecting to login...</Text>
      </View>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading your profile...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'red', marginBottom: 10 }}>Error: {error}</Text>
        <Pressable
          style={{ backgroundColor: THEME.colors.primary, padding: 10, borderRadius: 5 }}
          onPress={() => window.location.reload()}
        >
          <Text style={{ color: 'white' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const renderSidebar = () => (
    <Modal
      visible={showSidebar}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSidebar(false)}
    >
      <View style={styles.sidebarOverlay}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Chat History</Text>
            <Pressable onPress={() => setShowSidebar(false)}>
              <Ionicons name="close" size={24} color={THEME.colors.text.secondary} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.sidebarContent}
            refreshControl={
              <RefreshControl
                refreshing={chatHistoryRefreshing}
                onRefresh={onRefreshChatHistory}
                colors={[THEME.colors.primary]}
                tintColor={THEME.colors.primary}
              />
            }
          >
            {chatHistoryLoading ? (
              <Text style={styles.loadingText}>Loading chat history...</Text>
            ) : chatHistoryError ? (
              <Text style={styles.errorText}>Error loading chat history</Text>
            ) : chatHistory.length > 0 ? (
              chatHistory.map((chat, index) => (
                <Pressable
                  key={chat.topic_id}
                  style={styles.chatHistoryItem}
                  onPress={() => {
                    setShowSidebar(false);
                    router.push(`/chat/topic-chat?topicId=${chat.topic_id}` as any);
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={20} color={THEME.colors.text.secondary} />
                  <View style={styles.chatHistoryTextContainer}>
                    <Text style={styles.chatHistoryText}>{chat.title}</Text>
                    <Text style={styles.chatHistorySubject}>{chat.subject} - {chat.chapter}</Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.noChatHistory}>No chat history yet</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSubjectCard = (userSubject: any, index: number) => (
    <Pressable
      key={index}
      style={styles.subjectCard}
      onPress={() => router.push(`/chapter-topic/chapter?subjectId=${userSubject.subject.id}&subjectName=${encodeURIComponent(userSubject.subject.name)}` as any)}
    >
      <View style={styles.subjectIcon}>
        <SubjectIcon subject={userSubject.subject.name} size={40} />
      </View>
      <Text style={styles.subjectName}>{userSubject.subject.name}</Text>
      <Text style={styles.subjectProgress}>
        {userSubject.completed_chapters}/{userSubject.total_chapters} chapters
      </Text>
      <Text style={styles.subjectCompletion}>
        {userSubject.completion_percent}% complete
      </Text>
    </Pressable>
  );

  const getSubjectIcon = (subject: string): any => {
    const icons: { [key: string]: any } = {
      'Mathematics': 'calculator',
      'Physics': 'flask',
      'Chemistry': 'flask',
      'Biology': 'flower',
      'History': 'book',
      'Geography': 'globe',
      'English': 'book',
      'Hindi': 'language',
      'Literature': 'book',
      'Fine Art': 'brush',
      'Economics': 'stats-chart',
    };
    return icons[subject] || 'book';
  };

  const getSubjectColor = (subject: string): string => {
    const colors: { [key: string]: string } = {
      'Mathematics': '#E8F5E9',
      'Physics': '#E3F2FD',
      'Chemistry': '#FFF3E0',
      'Biology': '#F3E5F5',
      'History': '#FFE0B2',
      'Geography': '#E0F2F1',
      'English': '#FCE4EC',
      'Hindi': '#FFF9C4',
      'Literature': '#FFEBEE',
      'Fine Art': '#FFF3E0',
      'Economics': '#FFE0B2',
    };
    return colors[subject] || '#F5F5F5';
  };

  const getSubjectIconColor = (subject: string): string => {
    const colors: { [key: string]: string } = {
      'Mathematics': '#4CAF50',
      'Physics': '#2196F3',
      'Chemistry': '#FF9800',
      'Biology': '#9C27B0',
      'History': '#FF5722',
      'Geography': '#009688',
      'English': '#E91E63',
      'Hindi': '#FBC02D',
      'Literature': '#F44336',
      'Fine Art': '#FF9800',
      'Economics': '#FF5722',
    };
    return colors[subject] || '#8B5CF6';
  };

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 15 }]}>
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
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Content */}
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
        {/* Search Bar */}
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
          <Pressable style={styles.searchFilterButton}>
            <Ionicons name="options-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Recent (Quick Overview) Section */}
        <Text style={styles.sectionTitle}>Recent</Text>

        {loadingReports ? (
          <ActivityIndicator size="small" color="#8B5CF6" style={{ marginBottom: 20 }} />
        ) : recentReports.length > 0 ? (
          <View style={styles.recentReportsContainer}>
            {recentReports.slice(0, 2).map((report) => ( // Show max 2 on home
              <Pressable
                key={report.id}
                style={styles.reportCard}
                onPress={() => {
                  // Try to resolve subject ID from nested data or fallback
                  const subjectId = report.topics?.chapters?.subjects?.id || report.topics?.subject_id || report.subject_id;
                  if (subjectId) {
                    router.push({ pathname: '/metrices/persubject', params: { subjectId: subjectId } });
                  } else {
                    console.warn('Could not determine subject ID for navigation', report);
                  }
                }}
              >
                <View style={styles.reportHeader}>
                  <View>
                    <Text style={styles.reportTopic} numberOfLines={1}>{report.topics?.title || 'Unknown Topic'}</Text>
                    <Text style={styles.reportChapter} numberOfLines={1}>{report.topics?.chapters?.title || 'Unknown Chapter'}</Text>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: report.score_percent >= 70 ? '#D1FAE5' : '#FEE2E2' }]}>
                    <Text style={[styles.scoreText, { color: report.score_percent >= 70 ? '#059669' : '#DC2626' }]}>
                      {report.score_percent}%
                    </Text>
                  </View>
                </View>

                <View style={styles.reportStatsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
                    <Text style={styles.statText}>{report.correct_answers} Correct</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                    <Text style={styles.statText}>{report.incorrect_answers} Incorrect</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No recent activity</Text>
            <Text style={styles.emptyStateSubText}>Your recent learning sessions will appear here.</Text>
          </View>
        )}

        {/* Enrolled Subjects Title */}
        <Text style={styles.enrolledTitle}>Enrolled Subjects</Text>

        {/* Subjects Grid */}
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
          ) : academicInfo?.subjects && academicInfo.subjects.length > 0 ? (
            academicInfo.subjects.map((subject, index) => (
              <Pressable
                key={index}
                style={styles.subjectCard}
                onPress={() => alert('Please update your profile to access chapters')}
              >
                <View style={styles.subjectIconContainer}>
                  <SubjectIcon subject={subject} size={60} />
                </View>
                <Text style={styles.subjectName}>{subject}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.noSubjects}>No subjects selected</Text>
          )}
        </View>

        <View style={{ height: 140 }} />
      </ScrollView >

      {/* Floating Ask Tutor Button */}
      < Pressable
        style={styles.floatingButton}
        onPress={() => router.push('/chat/normal-chat' as any)
        }
      >
        <Text style={styles.floatingButtonText}>Ask Tutor?</Text>
        <View style={styles.floatingButtonIcon}>
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </View>
      </Pressable >

      {/* Custom Bottom Navigation */}
      < BottomNavigation
        activeTab={activeTab}
        onTabPress={(tabId) => {
          setActiveTab(tabId);
          if (tabId === 'session') router.push('/chapter-topic/session' as any);
          else if (tabId === 'statistics') router.push('/metrices/home' as any);
          else if (tabId === 'profile') router.push('/profile/profile' as any);
          // if home, just stay or scroll to top
        }}
      />
    </View >
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10, // Adjust for visual centering within the 100px height after StatusBar padding
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
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'System',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    marginHorizontal: 20,
    marginTop: 20,
  },
  recentReportsContainer: {
    marginBottom: 24,
    gap: 12,
    paddingHorizontal: 20,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportTopic: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
    maxWidth: 220,
  },
  reportChapter: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: 220,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reportStatsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptyStateSubText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  headerClass: {
    fontWeight: '600',
    fontSize: 16,
    color: '#E9D5FF',
    fontFamily: 'System',
  },
  headerBoard: {
    fontWeight: '600',
    fontSize: 16,
    color: '#F3E8FF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E9D5FF',
    marginTop: 2,
    fontWeight: '600',
    fontFamily: 'System',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    marginTop: 20,
    marginHorizontal: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9D5FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 35,
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
  content: {
    flex: 1,
  },
  enrolledTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginHorizontal: 20,
    fontFamily: 'System',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    rowGap: 20,
    marginBottom: 20,
  },
  subjectCard: {
    width: '31%', // Fit 3 items (3 * 31% = 93%, leaving 7% for spacing)
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    marginBottom: 0,
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
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'System',
  },
  noSubjects: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    width: '100%',
    marginTop: 40,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 110,
    right: 10,
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 20,
    paddingRight: 16,
    borderRadius: 30,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  floatingButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sidebar: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  sidebarContent: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6B7280',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'red',
  },
  chatHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatHistoryTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  chatHistoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'System',
  },
  chatHistorySubject: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  noChatHistory: {
    textAlign: 'center',
    marginTop: 40,
    color: '#9CA3AF',
  },
  subjectIcon: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectProgress: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'System',
  },
  subjectCompletion: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
    marginTop: 2,
    fontFamily: 'System',
  },
});
