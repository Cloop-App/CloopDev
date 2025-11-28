import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Image, StatusBar, ScrollView, SafeAreaView, Modal, Platform, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../../src/client/profile/useUserProfile';
import { useChatHistory } from '../../src/client/profile/useProgress';
import { THEME } from '../../src/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
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
        <Ionicons
          name={getSubjectIcon(userSubject.subject.name)}
          size={24}
          color={THEME.colors.primary}
        />
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
      'Mathematics': 'calculator-outline',
      'Physics': 'atom-outline',
      'Chemistry': 'flask-outline',
      'Biology': 'leaf-outline',
      'History': 'library-outline',
      'Geography': 'earth-outline',
      'English': 'book-outline',
      'Hindi': 'language-outline',
    };
    return icons[subject] || 'book-outline';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.sidebarToggle}
            onPress={() => setShowSidebar(true)}
          >
            <Ionicons name="menu" size={24} color={THEME.colors.text.primary} />
          </Pressable>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}!</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color={THEME.colors.text.primary} />
            <View style={styles.notificationBadge} />
          </Pressable>
          <Pressable
            style={styles.profileButton}
            onPress={() => router.push('/profile/profile')}
          >
            <Image
              source={{
                uri: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=EF4444&color=fff&size=128`
              }}
              style={styles.profileAvatar}
            />
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
            colors={[THEME.colors.primary]}
            tintColor={THEME.colors.primary}
          />
        }
      >
        {/* Board Information Card */}
        <View style={styles.boardCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="school-outline" size={24} color={THEME.colors.primary} />
            <Text style={styles.cardTitle}>Your Board</Text>
          </View>
          <Text style={styles.boardName}>{academicInfo?.board || 'Not selected'}</Text>
          <Text style={styles.gradeLevel}>Grade {academicInfo?.grade_level || 'N/A'}</Text>
        </View>

        {/* Subjects Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Subjects</Text>
          <View style={styles.subjectsGrid}>
            {academicInfo?.user_subjects && academicInfo.user_subjects.length > 0 ? (
              academicInfo.user_subjects.map((userSubject, index) => renderSubjectCard(userSubject, index))
            ) : academicInfo?.subjects && academicInfo.subjects.length > 0 ? (
              // Fallback to old subjects array for backward compatibility
              academicInfo.subjects.map((subject, index) => (
                <Pressable
                  key={index}
                  style={styles.subjectCard}
                  onPress={() => {
                    // For old subjects array, we don't have subject ID, so show a message
                    alert('Please update your profile to access chapters')
                  }}
                >
                  <View style={styles.subjectIcon}>
                    <Ionicons
                      name={getSubjectIcon(subject)}
                      size={24}
                      color={THEME.colors.primary}
                    />
                  </View>
                  <Text style={styles.subjectName}>{subject}</Text>
                  <Text style={styles.subjectProgress}>Continue Learning</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.noSubjects}>No subjects selected</Text>
            )}
          </View>
        </View>

        {/* Live Agentic Tutor Button */}
        <View style={styles.section}>
          <Pressable
            style={styles.fullWidthActionButton}
            onPress={() => router.push('/chat/normal-chat' as any)}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            <Text style={styles.actionText}>Live Agentic Tutor</Text>
          </Pressable>
        </View>

        {/* Track Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Track Progress</Text>
            <Pressable
              style={styles.viewMetricsButton}
              onPress={() => router.push('/profile/metrics' as any)}
            >
              <Text style={styles.viewMetricsText}>View Metrics</Text>
              <Ionicons name="arrow-forward" size={16} color={THEME.colors.primary} />
            </Pressable>
          </View>
          <View style={styles.trackProgressCard}>
            {academicInfo?.user_subjects && academicInfo.user_subjects.length > 0 ? (
              academicInfo.user_subjects.map((userSubject, index) => (
                <View key={index} style={styles.trackProgressItem}>
                  <View style={styles.trackProgressHeader}>
                    <Text style={styles.trackProgressSubject}>{userSubject.subject.name}</Text>
                    <Text style={styles.trackProgressPercent}>{userSubject.completion_percent}%</Text>
                  </View>
                  <View style={styles.trackProgressBar}>
                    <View
                      style={[
                        styles.trackProgressFill,
                        { width: `${userSubject.completion_percent}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.trackProgressText}>
                    {userSubject.completed_chapters}/{userSubject.total_chapters} chapters completed
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noProgress}>No subjects enrolled yet</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {renderSidebar()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 15,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sidebarToggle: {
    marginRight: 15,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 15,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  boardCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text.primary,
    marginLeft: 8,
  },
  boardName: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginBottom: 5,
  },
  gradeLevel: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.text.primary,
    marginBottom: 15,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subjectCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2', // Light red
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text.primary,
    marginBottom: 5,
  },
  subjectProgress: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
  },
  subjectCompletion: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  noSubjects: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  fullWidthActionButton: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  progressCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 5,
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    width: '80%',
    height: '100%',
    backgroundColor: THEME.colors.background,
    paddingTop: 50,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 10,
  },
  chatHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  chatHistoryTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  chatHistoryText: {
    fontSize: 14,
    color: THEME.colors.text.primary,
    fontWeight: '500',
  },
  chatHistorySubject: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  loadingText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: THEME.colors.primary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  noChatHistory: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewMetricsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2', // Light red
    borderRadius: 6,
  },
  viewMetricsText: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  trackProgressCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trackProgressItem: {
    marginBottom: 15,
  },
  trackProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackProgressSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  trackProgressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  trackProgressBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginBottom: 6,
  },
  trackProgressFill: {
    height: '100%',
    backgroundColor: THEME.colors.secondary, // Yellow for progress
    borderRadius: 3,
  },
  trackProgressText: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
  },
  noProgress: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
