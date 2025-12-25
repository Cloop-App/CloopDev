import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Pressable, Image, Platform, ActivityIndicator, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { API_BASE_URL } from '../../src/config/api';
import Svg, { Circle, Rect } from 'react-native-svg';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';
import { SubjectIcon } from '../../components/common/SubjectIcon';
import { SessionSummaryCard } from '../../components/chat/SessionSummaryCard';
import { Modal, TouchableOpacity, Dimensions } from 'react-native';

// Formatting helper for time
const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export default function PerSubjectAnalysisScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { subjectId } = useLocalSearchParams();
    const { token } = useAuth();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [topicReports, setTopicReports] = useState<any[]>([]);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!token || !subjectId) return;
            try {
                const response = await fetch(`${API_BASE_URL}/api/profile/learning-analytics/subject/${subjectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Fetch Topic Reports
                const reportsResponse = await fetch(`${API_BASE_URL}/api/topic-chats/reports/subject/${subjectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                } else {
                    setError('Failed to fetch data');
                }

                if (reportsResponse.ok) {
                    const reportsResult = await reportsResponse.json();
                    setTopicReports(reportsResult);
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, subjectId]);

    const handleTabPress = (tabId: string) => {
        if (tabId === 'home') router.push('/home/home' as any);
        else if (tabId === 'session') router.push('/chapter-topic/session' as any);
        else if (tabId === 'profile') router.push('/profile/profile' as any);
        else if (tabId === 'statistics') router.push('/metrices/home' as any); // Back to main metrics
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9269F0" />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Error</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.errorText}>Could not load subject data.</Text>
                </View>
            </View>
        );
    }

    const { subject, summary, time_analytics, concepts_mastery, recommended_focus, error_analysis } = data;

    // Calculate improvement (heuristic based on trend if available, else random small positive for demo)
    // In real app, compare current week avg vs last week avg
    const improvements = "+5%";

    // Marks potential
    const currentScore = summary.average_score || 0;
    const bestPossible = Math.min(100, currentScore + 15); // Hypothetical potential

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#9269F0" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </Pressable>
                <Text style={styles.headerTitle}>Subjects-wise Analysis</Text>
                <Pressable style={styles.bellButton} onPress={() => router.push('/notifications/notifications' as any)}>
                    <Ionicons name="notifications-outline" size={24} color="#FFF" />
                </Pressable>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Subject Title */}
                <View style={styles.subjectHeader}>
                    <View style={styles.subjectTag}>
                        <SubjectIcon subject={subject.name} size={24} />
                        <Text style={styles.subjectName}>{subject.name}</Text>
                    </View>
                </View>

                {/* Total Learning Time */}
                <Text style={styles.sectionTitle}>Total Learning Time</Text>
                <Text style={styles.sectionSubtitle}>This shows how smartly you're studying, not just how long.</Text>

                <View style={styles.timeStatsRow}>
                    <View style={styles.timeCard}>
                        <Text style={styles.timeValue}>{formatTime(time_analytics.daily_seconds)}</Text>
                        <Text style={styles.timeLabel}>Daily</Text>
                        <Text style={styles.focusedTime}>Focused Time</Text>
                    </View>
                    <View style={styles.timeCard}>
                        <Text style={styles.timeValue}>{formatTime(time_analytics.weekly_seconds)}</Text>
                        <Text style={styles.timeLabel}>Weekly</Text>
                        <Text style={styles.focusedTime}>Focused Time</Text>
                    </View>
                    <View style={styles.timeCard}>
                        <Text style={styles.timeValue}>{formatTime(time_analytics.monthly_seconds)}</Text>
                        <Text style={styles.timeLabel}>Monthly</Text>
                        <Text style={styles.focusedTime}>Focused Time</Text>
                    </View>
                </View>

                {/* Total Sessions */}
                <Text style={styles.sectionTitle}>Total Sessions</Text>
                <Text style={styles.sectionSubtitle}>This is your Monthly Session Summary</Text>

                <View style={styles.sessionStatsRow}>
                    <View style={styles.sessionCard}>
                        <Ionicons name="help-circle-outline" size={20} color="#6B7280" style={{ marginBottom: 4 }} />
                        <Text style={styles.sessionValue}>{summary.total_questions}</Text>
                        <Text style={styles.sessionLabel}>Questions</Text>
                    </View>
                    <View style={styles.sessionCard}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" style={{ marginBottom: 4 }} />
                        <Text style={[styles.sessionValue, { color: '#10B981' }]}>{summary.correct_answers}</Text>
                        <Text style={styles.sessionLabel}>Correct</Text>
                    </View>
                    <View style={styles.sessionCard}>
                        <Ionicons name="trending-up-outline" size={20} color="#8B5CF6" style={{ marginBottom: 4 }} />
                        <Text style={[styles.sessionValue, { color: '#8B5CF6' }]}>{improvements}</Text>
                        <Text style={styles.sessionLabel}>Improved</Text>
                    </View>
                </View>

                {/* Concepts Mastered */}
                <Text style={styles.sectionTitle}>Concepts You've Mastered</Text>

                <View style={styles.conceptCard}>
                    <View style={styles.conceptRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                            <Ionicons name="checkmark-done" size={20} color="#4F46E5" />
                        </View>
                        <View style={styles.conceptInfo}>
                            <Text style={styles.conceptTitle}>Understood Well</Text>
                            <Text style={styles.conceptDesc}>Ready for advanced questions</Text>
                        </View>
                        <View style={[styles.countBadge, { backgroundColor: '#8B5CF6' }]}>
                            <Text style={styles.countText}>{concepts_mastery.mastered}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.conceptCard}>
                    <View style={styles.conceptRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                            <Ionicons name="time-outline" size={20} color="#9333EA" />
                        </View>
                        <View style={styles.conceptInfo}>
                            <Text style={styles.conceptTitle}>Still Learning</Text>
                            <Text style={styles.conceptDesc}>Keep practicing these</Text>
                        </View>
                        <View style={[styles.countBadge, { backgroundColor: '#A855F7' }]}>
                            <Text style={styles.countText}>{concepts_mastery.learning}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.conceptCard}>
                    <View style={styles.conceptRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#FAE8FF' }]}>
                            <Ionicons name="refresh-outline" size={20} color="#D946EF" />
                        </View>
                        <View style={styles.conceptInfo}>
                            <Text style={styles.conceptTitle}>Not Started</Text>
                            <Text style={styles.conceptDesc}>New topics ahead</Text>
                        </View>
                        <View style={[styles.countBadge, { backgroundColor: '#C084FC' }]}>
                            <Text style={styles.countText}>{concepts_mastery.not_started}</Text>
                        </View>
                    </View>
                </View>

                {/* Profile of Your Errors */}
                <Text style={styles.sectionTitle}>Profile of Your Errors</Text>
                <View style={styles.errorStatsContainer}>
                    {/* Just mapping top 3 for UI layout */}
                    {[
                        { label: 'Concept Errors', key: 'Conceptual', color: '#8B5CF6' },
                        { label: 'Step Mistakes', key: 'Application', color: '#A855F7' }, // Mapping 'Application' to Step for demo
                        { label: 'Calculation', key: 'Calculation', color: '#D946EF' }
                    ].map((errItem, idx) => {
                        const count = error_analysis.error_types[errItem.key] || 0;
                        const totalErrors = summary.incorrect_answers || 1; // avoid /0
                        const percent = (count / totalErrors) * 100;

                        return (
                            <View key={idx} style={styles.errorCard}>
                                <Text style={styles.errorLabel}>{errItem.label}</Text>
                                <Text style={styles.errorSubLabel}>
                                    {count > 0 ? `${count} mistakes` : 'No errors'}
                                </Text>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: errItem.color }]} />
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Recommended Focus */}
                <Text style={styles.sectionTitle}>Recommended Focus</Text>
                {recommended_focus.length > 0 ? (
                    recommended_focus.slice(0, 2).map((item: any, idx: number) => (
                        <View key={idx} style={[styles.focusCard, idx > 0 && { backgroundColor: '#DDD6FE' }]}>
                            <Text style={styles.focusTitle}>{item.title}</Text>
                            <Text style={styles.focusSubtitle}>Fixing this topic can improve your marks fastest.</Text>

                            <View style={styles.gainRow}>
                                <Text style={styles.gainLabel}>Potential Gain</Text>
                                <Text style={styles.gainValue}>+{item.potential_gain} Marks</Text>
                            </View>

                            <Pressable
                                style={styles.practiceButton}
                                onPress={() => {
                                    // Navigate to chat for this topic
                                    router.push({
                                        pathname: '/chat/topic-chat',
                                        params: {
                                            topicId: item.topic_id,
                                            topicTitle: item.title,
                                            subjectName: subject.name,
                                            chapterTitle: 'Focus Session' // Placeholder
                                        }
                                    } as any);
                                }}
                            >
                                <Text style={styles.practiceButtonText}>Practice Now</Text>
                                <Ionicons name="arrow-forward" size={16} color="#FFF" />
                            </Pressable>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyFocusCard}>
                        <Text style={styles.emptyFocusText}>No weak topics found! Great job!</Text>
                    </View>
                )}

                {/* Topic Reports Section */}
                <Text style={styles.sectionTitle}>Topic Reports</Text>
                <Text style={styles.sectionSubtitle}>Recent performance reports for this subject</Text>

                {topicReports.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportsScroll} contentContainerStyle={{ paddingRight: 20 }}>
                        {topicReports.map((report, index) => (
                            <Pressable
                                key={index}
                                style={[styles.miniReportCard, { backgroundColor: report.score_percent >= 75 ? '#D1FAE5' : report.score_percent >= 50 ? '#FEF3C7' : '#FEE2E2' }]}
                                onPress={() => {
                                    setSelectedReport(report);
                                    setModalVisible(true);
                                }}
                            >
                                <View style={styles.reportHeader}>
                                    <Text style={styles.reportTopicTitle} numberOfLines={2}>{report.topics?.title || 'Unknown Topic'}</Text>
                                    <View style={styles.reportStarContainer}>
                                        <Text style={styles.reportStarText}>{report.star_rating} ⭐</Text>
                                    </View>
                                </View>

                                <View style={styles.reportStats}>
                                    <Text style={styles.reportScore}>{report.score_percent || 0}%</Text>
                                    <Text style={styles.reportLevel}>{report.performance_level}</Text>
                                </View>

                                <View style={styles.viewReportButton}>
                                    <Text style={styles.viewReportText}>View Report</Text>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.emptyFocusCard}>
                        <Text style={styles.emptyFocusText}>No reports yet. Start a session!</Text>
                    </View>
                )}

                {/* Marks Potential */}
                <Text style={styles.sectionTitle}>Marks Potential</Text>
                <View style={styles.marksCard}>
                    <View style={styles.marksBarContainer}>
                        <View style={[styles.marksFill, { width: `${currentScore}%` }]} />
                        <View style={[styles.marksPotentialFill, { left: `${currentScore}%`, width: `${bestPossible - currentScore}%` }]} />
                    </View>
                    <View style={styles.marksLabels}>
                        <Text style={styles.marksLabelText}>Current Level</Text>
                        <Text style={styles.marksLabelText}>Best Possible</Text>
                    </View>
                    <View style={styles.marksValues}>
                        <View style={[styles.valueBadge, { left: `${currentScore - 5}%` }]}>
                            <Text style={styles.valueText}>{currentScore}</Text>
                        </View>
                        <View style={[styles.valueBadge, { left: `${bestPossible - 5}%`, backgroundColor: '#F3E8FF' }]}>
                            <Text style={[styles.valueText, { color: '#8B5CF6' }]}>{bestPossible}</Text>
                        </View>
                    </View>
                </View>

                {/* Alert/AI Recommendation */}
                <View style={styles.aiAlertCard}>
                    <View style={styles.alertHeader}>
                        <Ionicons name="alert-circle-outline" size={24} color="#1F2937" />
                        <Text style={styles.alertTitle}>Are you stuck on a topic?</Text>
                    </View>
                    <Text style={styles.alertText}>
                        Your scores have stayed the same for 3 days. Try going through topic summaries before taking another quiz.
                    </Text>
                    <Pressable style={styles.aiButton}>
                        <Text style={styles.aiButtonText}>AI Tutor Recommendations</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </Pressable>
                </View>

            </ScrollView>

            {/* Bottom Navigation */}
            <BottomNavigation activeTab="statistics" onTabPress={handleTabPress} />

            {/* Report Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Session Report</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {selectedReport && (
                                <SessionSummaryCard summary={selectedReport} />
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: '#9269F0',
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    bellButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#DC2626',
        fontSize: 16
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 20,
    },
    subjectTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E9D5FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 8,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4C1D95',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 16,
    },
    timeStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    timeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        width: '31%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    timeValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#8B5CF6',
        marginBottom: 4,
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    focusedTime: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    sessionStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    sessionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        width: '31%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sessionValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#8B5CF6',
        marginBottom: 2,
    },
    sessionLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    conceptCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    conceptRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    conceptInfo: {
        flex: 1,
    },
    conceptTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    conceptDesc: {
        fontSize: 12,
        color: '#6B7280',
    },
    countBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    countText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    errorStatsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    errorCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        width: '31%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    errorLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    errorSubLabel: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 8,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        width: '100%',
    },
    progressBarFill: {
        height: 4,
        borderRadius: 2,
    },
    focusCard: {
        backgroundColor: '#DDD6FE', // Lighter purple for alternations
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    emptyFocusCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    emptyFocusText: {
        color: '#6B7280',
        fontWeight: '500',
    },
    focusTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4C1D95',
        marginBottom: 4,
    },
    focusSubtitle: {
        fontSize: 12,
        color: '#5B21B6',
        marginBottom: 12,
    },
    gainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    gainLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    gainValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    practiceButton: {
        backgroundColor: '#8B5CF6',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    practiceButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    marksCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    marksBarContainer: {
        height: 24,
        backgroundColor: '#F3E8FF',
        borderRadius: 12,
        marginBottom: 8,
        position: 'relative',
        flexDirection: 'row',
    },
    marksFill: {
        backgroundColor: '#8B5CF6',
        height: '100%',
        borderRadius: 12,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    marksPotentialFill: {
        backgroundColor: '#C084FC',
        height: '100%',
        position: 'absolute',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        opacity: 0.5,
    },
    marksLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    marksLabelText: {
        fontSize: 12,
        color: '#6B7280',
    },
    marksValues: {
        height: 30, // Space for floating badges
        position: 'relative',
        marginTop: 4,
    },
    valueBadge: {
        position: 'absolute',
        backgroundColor: '#8B5CF6',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    valueText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    aiAlertCard: {
        backgroundColor: '#E0E7FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    alertText: {
        fontSize: 12,
        color: '#4B5563',
        marginBottom: 12,
        lineHeight: 18,
    },
    aiButton: {
        backgroundColor: '#818CF8',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 8,
    },
    aiButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    // New Styles for Reports
    reportsScroll: {
        marginBottom: 24,
        marginHorizontal: -16, // To allow full-bleed scrolling
        paddingHorizontal: 16,
    },
    miniReportCard: {
        width: 160,
        borderRadius: 16,
        padding: 12,
        marginRight: 12,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        height: 140, // Fixed height for uniformity
    },
    reportHeader: {
        marginBottom: 8,
    },
    reportTopicTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
        height: 40, // Fixed height for 2 lines
    },
    reportStarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reportStarText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    reportStats: {
        marginBottom: 8,
    },
    reportScore: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
    },
    reportLevel: {
        fontSize: 12,
        color: '#6B7280',
    },
    viewReportButton: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
    },
    viewReportText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        width: '100%',
        maxHeight: '80%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
    },
    modalScroll: {
        maxHeight: '100%',
    },
});
