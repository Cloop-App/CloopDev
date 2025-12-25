import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Pressable, Image, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserMetrics } from '../../src/client/profile/useProgress';
import { useAuth } from '../../src/context/AuthContext';
import { useUserProfile } from '../../src/client/profile/useUserProfile';
import Svg, { Circle } from 'react-native-svg';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';
import { SubjectIcon } from '../../components/common/SubjectIcon';
import { API_BASE_URL } from '../../src/config/api';

// Circular Progress Component
const CircularProgress = ({ percent, size = 60, strokeWidth = 6, color = '#8B5CF6' }: any) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = circumference - (percent / 100) * circumference;

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#1F2937"
                    strokeWidth={strokeWidth}
                    strokeOpacity={0.1}
                    fill="none"
                />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={progress}
                    strokeLinecap="round"
                />
            </Svg>
            <View style={styles.iconContainer}>
                {/* Icon will be passed as child or overlay, but specific design has icon inside */}
            </View>
        </View>
    );
};

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
        };
    };
    created_at: string;
}

export default function MetricsHomeScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { academicInfo } = useUserProfile();

    // Recent Reports State
    const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
    const [loadingReports, setLoadingReports] = useState(true);

    // Navigation State
    const [activeTab, setActiveTab] = useState('statistics');

    const handleTabPress = (tabId: string) => {
        setActiveTab(tabId);
        if (tabId === 'home') router.push('/home/home' as any);
        else if (tabId === 'profile') router.push('/profile/profile' as any);
        else if (tabId === 'session') router.push('/chapter-topic/session' as any);
    };

    // Fetch Recent Reports
    useEffect(() => {
        const fetchRecentReports = async () => {
            if (!token) return;
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
    }, [token]);

    // Subjects List (from User Profile)
    // If no user subjects, show fallback empty state or subset of general subjects
    // The previous mocked list is removed in favor of real data
    const subjectsToDisplay = academicInfo?.user_subjects?.map(us => us.subject) || academicInfo?.subjects?.map(s => ({ name: s, id: Math.random() })) || [];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#9269F0" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatarContainer}>
                        <Image source={require('../../assets/images/cloop-icon.png')} style={styles.avatar} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Student</Text>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                    </View>
                </View>
                <Pressable style={styles.bellButton} onPress={() => router.push('/notifications/notifications' as any)}>
                    <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                    <View style={styles.notificationDot} />
                </Pressable>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Welcome Section */}
                <View style={styles.welcomeContainer}>
                    <View style={styles.welcomeTitleBox}>
                        <Text style={styles.welcomeTitle}>Hi there! Welcome to your mastery dashboard</Text>
                    </View>
                    <View style={styles.welcomeInfoBox}>
                        <Text style={styles.welcomeInfoTitle}>Here you can -</Text>
                        <Text style={styles.welcomeInfoText}>1. Track how much you study and how effectively you learn</Text>
                        <Text style={styles.welcomeInfoText}>2. See which concepts you've mastered and which need focus</Text>
                        <Text style={styles.welcomeInfoText}>3. Follow suggested focus areas to improve scores faster</Text>
                        <Text style={styles.welcomeInfoText}>4. Monitor progress and score improvement over time</Text>
                    </View>
                </View>

                {/* Quick Overview (Recent Reports) */}
                <Text style={styles.sectionTitle}>Quick Overview (Recent Sessions)</Text>

                {loadingReports ? (
                    <ActivityIndicator size="small" color="#9269F0" />
                ) : recentReports.length > 0 ? (
                    <View style={styles.recentReportsContainer}>
                        {recentReports.map((report) => (
                            <Pressable
                                key={report.id}
                                style={styles.reportCard}
                                onPress={() => {
                                    // Navigate to explicit report view if implemented, or replay chat logic
                                    // For now just console log
                                    console.log('Report clicked', report.id);
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
                                    <View style={styles.statItem}>
                                        <Ionicons name="help-circle-outline" size={16} color="#6B7280" />
                                        <Text style={styles.statText}>{report.total_questions} Questions</Text>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No recent sessions found.</Text>
                        <Text style={styles.emptyStateSubText}>Complete a topic to see your performance metrics here.</Text>
                    </View>
                )}

                {/* Subjects-wise Analysis */}
                <Text style={styles.sectionTitle}>Subjects-wise Analysis</Text>
                <View style={styles.subjectsGrid}>
                    {subjectsToDisplay.length > 0 ? (
                        subjectsToDisplay.map((subject, index) => (
                            <Pressable
                                key={(subject as any).id || index}
                                style={styles.subjectCard}
                                onPress={() => {
                                    console.log('Subject clicked:', (subject as any).name);
                                    // Navigate if possible
                                    if ((subject as any).id) {
                                        router.push({ pathname: '/metrices/persubject', params: { subjectId: (subject as any).id } });
                                    }
                                }}
                            >
                                <View style={[styles.subjectIconContainer]}>
                                    <SubjectIcon subject={(subject as any).name} size={40} />
                                </View>
                                <Text style={styles.subjectName}>{(subject as any).name}</Text>
                            </Pressable>
                        ))
                    ) : (
                        <Text style={styles.noSubjectsText}>No enrolled subjects found.</Text>
                    )}
                </View>

            </ScrollView>

            {/* Bottom Navigation */}
            <BottomNavigation activeTab="statistics" onTabPress={handleTabPress} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light gray background
    },
    header: {
        backgroundColor: '#9269F0', // Updated purple
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatar: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        lineHeight: 24,
    },
    bellButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1.5,
        borderColor: '#9269F0',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    welcomeContainer: {
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
    },
    welcomeTitleBox: {
        backgroundColor: '#E9D5FF',
        padding: 12,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    welcomeTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    welcomeInfoBox: {
        backgroundColor: '#F3E8FF',
        padding: 16,
        paddingTop: 12,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    welcomeInfoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    welcomeInfoText: {
        fontSize: 12,
        color: '#4B5563',
        lineHeight: 18,
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
    },
    recentReportsContainer: {
        marginBottom: 24,
        gap: 12,
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
    subjectsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        paddingBottom: 20,
    },
    subjectCard: {
        width: '30%',
        backgroundColor: '#F3E8FF',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        marginBottom: 12,
        aspectRatio: 0.9,
        justifyContent: 'center',
    },
    subjectIconContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    noSubjectsText: {
        width: '100%',
        textAlign: 'center',
        color: '#6B7280',
        padding: 20,
    },
    iconContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
