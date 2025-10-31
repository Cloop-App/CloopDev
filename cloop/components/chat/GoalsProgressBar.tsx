import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TopicGoal {
  id: number;
  title: string;
  description?: string;
  order?: number;
  chat_goal_progress?: Array<{
    score_percent?: number; // optional precomputed percent
    is_completed?: boolean; // completion status
    num_questions?: number;
    num_correct?: number;
  }>;
}

interface GoalsProgressBarProps {
  goals: TopicGoal[];
  forceCollapse?: boolean;
}

export default function GoalsProgressBar({ goals, forceCollapse = false }: GoalsProgressBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [animation] = useState(new Animated.Value(1));

  // Handle force collapse from parent
  useEffect(() => {
    if (forceCollapse !== isCollapsed) {
      setIsCollapsed(forceCollapse);
    }
  }, [forceCollapse]);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isCollapsed ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isCollapsed]);

  if (!goals || goals.length === 0) {
    return null;
  }

  const containerHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 120],
  });

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Animated.View style={[styles.container, { height: containerHeight }]}>
      <Pressable style={styles.header} onPress={toggleCollapse}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy-outline" size={16} color="#6B7280" />
          <Text style={styles.headerText}>Learning Goals</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg']
        }) }] }}>
          <Ionicons name="chevron-up" size={16} color="#6B7280" />
        </Animated.View>
      </Pressable>
      <Animated.ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.goalsContainer}
        style={{ opacity: animation }}
      >
        {goals.map((goal, index) => {
          const progress = goal.chat_goal_progress?.[0];
          // If backend provides num_correct/num_questions, compute percent
          const score = progress?.score_percent ?? (progress && progress.num_questions ? Math.round(((progress.num_correct || 0) / (progress.num_questions || 1)) * 100) : 0);
          const isCompleted = !!progress?.is_completed;
          const isActive = !isCompleted && (index === 0 || !!goals[index - 1]?.chat_goal_progress?.[0]?.is_completed);
          
          return (
            <View 
              key={goal.id} 
              style={[
                styles.goalCard,
                isCompleted && styles.goalCompleted,
                isActive && styles.goalActive
              ]}
            >
              <View style={styles.goalHeader}>
                {isCompleted ? (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                ) : isActive ? (
                  <Ionicons name="radio-button-on" size={20} color="#6366F1" />
                ) : (
                  <Ionicons name="ellipse-outline" size={20} color="#9CA3AF" />
                )}
                <Text 
                  style={[
                    styles.goalNumber,
                    isCompleted && styles.goalNumberCompleted,
                    isActive && styles.goalNumberActive
                  ]}
                  numberOfLines={1}
                >
                  {index + 1}
                </Text>
              </View>
              <Text 
                style={[
                  styles.goalTitle,
                  isCompleted && styles.goalTitleCompleted
                ]} 
                numberOfLines={2}
              >
                {goal.title}
              </Text>
                {progress && score > 0 && (
                <View style={styles.scoreContainer}>
                  <View style={styles.scoreBar}>
                    <View 
                      style={[
                        styles.scoreFill,
                        { width: `${score}%` },
                        isCompleted && styles.scoreFillCompleted
                      ]} 
                    />
                  </View>
                  <Text style={styles.scoreText}>{Math.round(score)}%</Text>
                </View>
              )}
            </View>
          );
        })}
      </Animated.ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    justifyContent: 'space-between',
    height: 40,
    backgroundColor: '#F9FAFB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  goalsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    width: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  goalCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  goalActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  goalNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  goalNumberCompleted: {
    color: '#10B981',
  },
  goalNumberActive: {
    color: '#6366F1',
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 16,
    marginBottom: 4,
  },
  goalTitleCompleted: {
    color: '#059669',
  },
  scoreContainer: {
    marginTop: 4,
  },
  scoreBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  scoreFillCompleted: {
    backgroundColor: '#10B981',
  },
  scoreText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
  },
});
