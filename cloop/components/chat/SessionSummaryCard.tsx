import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface SessionSummaryCardProps {
    summary: any;
    onOptionSelect?: (option: string, chatId?: number) => void;
    chatId?: number;
}

export function SessionSummaryCard({ summary, onOptionSelect, chatId }: SessionSummaryCardProps) {
    const {
        total_questions = 0,
        correct_answers = 0,
        incorrect_answers = 0,
        star_rating = 0,
        performance_percent = 0,
        overall_score_percent = 0,
        performance_level = 'Good',
        performance_color = '#10B981',
        top_error_types = [],
        weak_goals = [],
        has_weak_areas = false
    } = summary;

    const scorePercent = overall_score_percent || performance_percent;

    const getPerformanceColor = () => {
        if (performance_color) return performance_color;
        if (scorePercent >= 80) return '#10B981';
        if (scorePercent >= 50) return '#F59E0B';
        return '#EF4444';
    };

    const getCardBackgroundColor = () => {
        if (scorePercent >= 75) return '#D1FAE5'; // Light green
        if (scorePercent >= 50) return '#FEF3C7'; // Light yellow
        return '#FEE2E2'; // Light red
    };

    const getScoreBackgroundColor = () => {
        if (scorePercent >= 75) return '#A7F3D0'; // Medium green
        if (scorePercent >= 50) return '#FDE68A'; // Medium yellow
        return '#FECACA'; // Medium red
    };

    return (
        <View style={[styles.summaryCard, { backgroundColor: getCardBackgroundColor() }]}>
            <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>🎓 Session Complete!</Text>
                <Text style={styles.performanceLevel}>{performance_level}</Text>
                <View style={styles.starContainer}>
                    {[...Array(5)].map((_, i) => (
                        <Text key={i} style={styles.starIcon}>
                            {i < star_rating ? '⭐' : '☆'}
                        </Text>
                    ))}
                </View>
            </View>

            <View style={styles.performanceSection}>
                <View style={[styles.scoreContainer, { backgroundColor: getScoreBackgroundColor() }]}>
                    <Text style={styles.trophyIcon}>🏆</Text>
                    <Text style={[styles.performanceText, { color: getPerformanceColor() }]}>
                        Your Score - {scorePercent}%
                    </Text>
                </View>
                <View style={styles.statsRow}>
                    <View style={[styles.statItem, styles.totalStatItem]}>
                        <Text style={styles.statNumber}>{total_questions}</Text>
                        <Text style={styles.statLabel}>Total
                            Questions</Text>
                    </View>
                    <View style={[styles.statItem, styles.correctStatItem]}>
                        <Text style={[styles.statNumber, styles.correctStatNumber]}>{correct_answers}</Text>
                        <Text style={styles.statLabel}>Correct
                            Answers</Text>
                    </View>
                    <View style={[styles.statItem, styles.incorrectStatItem]}>
                        <Text style={[styles.statNumber, styles.incorrectStatNumber]}>{incorrect_answers}</Text>
                        <Text style={styles.statLabel}>Incorrect
                            Answers</Text>
                    </View>
                </View>
            </View>

            {/* Error Types Section */}
            {top_error_types && top_error_types.length > 0 && (
                <View style={styles.errorSection}>
                    <Text style={styles.sectionTitle}>📊 Common Mistakes</Text>
                    {top_error_types.slice(0, 3).map((error: any, index: number) => (
                        <View key={index} style={styles.errorItem}>
                            <Text style={styles.errorType}>• {error.type}</Text>
                            <Text style={styles.errorCount}>{error.count} times ({error.percent}%)</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Weak Areas Section */}
            {has_weak_areas && weak_goals && weak_goals.length > 0 && (
                <View style={styles.weakSection}>
                    <Text style={styles.sectionTitle}>💡 Areas to Improve</Text>
                    {weak_goals.map((goal: any, index: number) => (
                        <View key={index} style={styles.weakItem}>
                            <Text style={styles.weakGoalTitle}>• {goal.goal_title}</Text>
                            <Text style={styles.weakGoalScore}>{goal.score_percent}%</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Action Buttons */}
            {onOptionSelect && (
                <View style={styles.sessionOptionsContainer}>
                    <Pressable
                        style={[styles.sessionOptionButton, styles.reviseButton]}
                        onPress={() => onOptionSelect?.('Revise Again', chatId)}
                    >
                        <Text style={styles.reviseButtonText}>Revise Again</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.sessionOptionButton, styles.endButton]}
                        onPress={() => onOptionSelect?.('End Session', chatId)}
                    >
                        <Text style={styles.endButtonText}>End session</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    summaryCard: {
        borderRadius: 12,
        padding: 12,
        borderWidth: 2,
        borderColor: '#8B5CF6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        maxWidth: '100%',
    },
    summaryHeader: {
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 12,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    performanceLevel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 8,
    },
    starContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    starIcon: {
        fontSize: 28,
    },
    performanceSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    scoreContainer: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
        width: '100%',
    },
    trophyIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    performanceText: {
        fontSize: 24,
        fontWeight: '800',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 8,
    },
    statItem: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        flex: 1,
    },
    totalStatItem: {
        backgroundColor: '#DDD6FE',
    },
    correctStatItem: {
        backgroundColor: '#D1FAE5',
    },
    incorrectStatItem: {
        backgroundColor: '#DDD6FE',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: '#374151',
        marginBottom: 4,
    },
    correctStatNumber: {
        color: '#059669',
    },
    incorrectStatNumber: {
        color: '#374151',
    },
    statLabel: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 13,
    },
    errorSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    errorItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    errorType: {
        fontSize: 13,
        color: '#4B5563',
        flex: 1,
    },
    errorCount: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    weakSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    weakItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        alignItems: 'center',
    },
    weakGoalTitle: {
        fontSize: 13,
        color: '#4B5563',
        flex: 1,
    },
    weakGoalScore: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '700',
    },
    sessionOptionsContainer: {
        gap: 12,
        marginTop: 16,
    },
    sessionOptionButton: {
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    reviseButton: {
        backgroundColor: '#8B5CF6',
    },
    endButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    reviseButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    endButtonText: {
        color: '#374151',
        fontSize: 15,
        fontWeight: '600',
    },
});
