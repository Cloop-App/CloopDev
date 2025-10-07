import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Image, StatusBar, ScrollView, SafeAreaView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../../src/client/profile/useUserProfile';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();
  const { 
    profile, 
    academicInfo, 
    progressInfo, 
    loading, 
    error,
    isProfileComplete,
    missingFields 
  } = useUserProfile();
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login-sigup/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

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
          style={{ backgroundColor: '#2563eb', padding: 10, borderRadius: 5 }}
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
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>
          <ScrollView style={styles.sidebarContent}>
            <Pressable style={styles.chatHistoryItem}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.chatHistoryText}>Mathematics Algebra</Text>
            </Pressable>
            <Pressable style={styles.chatHistoryItem}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.chatHistoryText}>Physics Mechanics</Text>
            </Pressable>
            <Pressable style={styles.chatHistoryItem}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.chatHistoryText}>Chemistry Organic</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSubjectCard = (subject: string, index: number) => (
    <Pressable key={index} style={styles.subjectCard}>
      <View style={styles.subjectIcon}>
        <Ionicons 
          name={getSubjectIcon(subject)} 
          size={24} 
          color="#2563eb" 
        />
      </View>
      <Text style={styles.subjectName}>{subject}</Text>
      <Text style={styles.subjectProgress}>Continue Learning</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable 
            style={styles.sidebarToggle}
            onPress={() => setShowSidebar(true)}
          >
            <Ionicons name="menu" size={24} color="#333" />
          </Pressable>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}!</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <Pressable style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge} />
          </Pressable>
          <Pressable
            style={styles.profileButton}
            onPress={() => router.push('/profile/profile')}
          >
            <Image
              source={{ 
                uri: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=10B981&color=fff&size=128` 
              }}
              style={styles.profileAvatar}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Board Information Card */}
        <View style={styles.boardCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="school-outline" size={24} color="#2563eb" />
            <Text style={styles.cardTitle}>Your Board</Text>
          </View>
          <Text style={styles.boardName}>{academicInfo?.board || 'Not selected'}</Text>
          <Text style={styles.gradeLevel}>Grade {academicInfo?.grade_level || 'N/A'}</Text>
        </View>

        {/* Subjects Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Subjects</Text>
          <View style={styles.subjectsGrid}>
            {academicInfo?.subjects?.map((subject, index) => renderSubjectCard(subject, index)) || (
              <Text style={styles.noSubjects}>No subjects selected</Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Pressable style={styles.actionButton}>
              <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
              <Text style={styles.actionText}>Start Chat</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="book-outline" size={20} color="#fff" />
              <Text style={styles.actionText}>Browse Lessons</Text>
            </Pressable>
          </View>
        </View>

        {/* Study Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{progressInfo?.num_chats || 0}</Text>
              <Text style={styles.progressLabel}>Chats</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{progressInfo?.num_lessons || 0}</Text>
              <Text style={styles.progressLabel}>Lessons</Text>
            </View>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    color: '#666',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#ef4444',
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
    color: '#333',
    marginLeft: 8,
  },
  boardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 5,
  },
  gradeLevel: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  subjectProgress: {
    fontSize: 12,
    color: '#666',
  },
  noSubjects: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
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
    color: '#2563eb',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    width: '80%',
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    borderBottomColor: '#f3f4f6',
  },
  chatHistoryText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
});
