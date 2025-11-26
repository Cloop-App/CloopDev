import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageBubbleProps {
  message: string;
  messageType?: string;
  options?: string[];
  diffHtml?: string;
  completeAnswer?: string; // This prop is essential
  fileUrl?: string;
  fileType?: string;
  sender: 'user' | 'ai';
  timestamp: string;
  bubbleColor?: 'green' | 'red' | 'yellow' | 'default';
  isCorrect?: boolean;
  sessionSummary?: any;
  chatId?: number;
  emoji?: string;
  onOptionSelect?: (option: string, chatId?: number) => void;
}

export default function MessageBubble({
  message,
  messageType = 'text',
  options,
  diffHtml,
  completeAnswer,
  fileUrl,
  fileType,
  sender,
  timestamp,
  bubbleColor = 'default',
  isCorrect,
  sessionSummary,
  chatId,
  emoji,
  onOptionSelect
}: MessageBubbleProps) {
  const isUser = sender === 'user';

  // --- DYNAMIC COLOR LOGIC ---
  // This correctly sets the bubble color based on feedback
  const getDynamicBubbleColor = () => {
    // For user_correction messages, NEVER change the bubble background color
    // Only the text inside (strikethrough/inserts) should be colored
    if (messageType === 'user_correction' && isUser) {
      return '#F3F4F6'; // Always keep neutral gray background for user corrections
    }
    // For AI messages or other message types, apply color if needed
    if (bubbleColor === 'green') return '#bfe4d8ff'; // Correct green
    if (bubbleColor === 'red') return '#fee2e2'; // Incorrect red
    return '#F3F4F6'; // Neutral light gray for both user and AI
  };

  // This correctly sets the text color
  const getDynamicTextColor = () => {
    // Always use dark text for readability on the neutral/light backgrounds
    if (bubbleColor === 'green' || bubbleColor === 'red') return '#111827';
    return '#111827';
  };
  // --- END DYNAMIC COLOR LOGIC ---

  const renderMessageContent = () => {
    // Session Summary Card
    if (messageType === 'session_summary') {
      // Parse session_metrics from diff_html if it exists
      let metrics = sessionSummary;
      if (!metrics && diffHtml) {
        try {
          metrics = JSON.parse(diffHtml);
        } catch (e) {
          console.error('Failed to parse session metrics:', e);
        }
      }

      if (metrics) {
        return <SessionSummaryCard summary={metrics} onOptionSelect={onOptionSelect} chatId={chatId} />;
      }

      // Fallback: show formatted message if no metrics
      return (
        <View>
          <Text style={[styles.messageText, { color: getDynamicTextColor() }]}>
            {message}
          </Text>
        </View>
      );
    }

    // --- THIS IS THE LOGIC THAT FIXES YOUR PROBLEM ---
    if (messageType === 'user_correction') {
      // Ensure there are always two canonical options to display
      const localOptions = (options && options.length > 0) ? options : ['Got it', 'Explain'];

      return (
        <View>
          {/* Step 1: Show original message (if correct) or diff (if incorrect) */}
          {isCorrect ? (
            // Answer is correct (green bubble)
            <View>
              {emoji && (
                <Text style={styles.emojiIcon}>{emoji}</Text>
              )}
              <Text style={[styles.messageText, { color: getDynamicTextColor() }]}>
                {message}
              </Text>
            </View>
          ) : (
            // Answer is incorrect (red bubble)
            diffHtml && (
              <View style={styles.correctionContainer}>
                {/* This maps the <del> and <ins> tags to styled text with emoji at end */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <Text style={[styles.correctionText, { flexShrink: 1 }]}>
                    {diffHtml.split(/(<del>.*?<\/del>|<ins>.*?<\/ins>)/g).map((part, index) => {
                      if (part.startsWith('<del>')) {
                        const text = part.replace(/<\/?del>/g, '');
                        return (
                          <Text key={index} style={styles.deletedText}>{text}</Text>
                        );
                      } else if (part.startsWith('<ins>')) {
                        const text = part.replace(/<\/?ins>/g, '');
                        return (
                          <Text key={index} style={styles.insertedText}>{text}</Text>
                        );
                      }
                      return <Text key={index}>{part}</Text>;
                    })}
                  </Text>
                  {/* Emoji at the right edge of correction box */}
                  {emoji && (
                    <Text style={styles.emojiInline}>{emoji}</Text>
                  )}
                </View>
              </View>
            )
          )}

          {/* Step 2: Show the complete answer (praise or explanation) */}
          {completeAnswer && (
            <Text style={[
              styles.completeAnswerText,
              { marginTop: 6 },
              isCorrect ? styles.correctAnswerText : styles.incorrectAnswerText
            ]}>
              {completeAnswer}
            </Text>
          )}

          {/* Step 3: Show the options without emoji (emoji is in correction box now) */}
          {localOptions && localOptions.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <View style={styles.optionsContainer}>
                {localOptions.map((option, index) => {
                  const isGotIt = option === 'Got it';
                  const isExplain = option === 'Explain' || option === 'Explain more';
                  return (
                    <Pressable
                      key={index}
                      style={[
                        styles.optionButton,
                        isGotIt && styles.gotItButton,
                        isExplain && styles.explainButton
                      ]}
                      onPress={() => onOptionSelect?.(option, chatId)}
                    >
                      {isGotIt ? (
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      ) : (
                        <Ionicons name="bulb" size={16} color="#3B82F6" />
                      )}
                      <Text style={[styles.optionText, isExplain && styles.explainText]}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      );
    }

    // Default: 'text'
    // This is the "normal text bubble" for all other messages
    return (
      <View>
        <Text style={[styles.messageText, { color: getDynamicTextColor() }]}>
          {message}
        </Text>

        {/* Show options if this message has them (for AI explanations) */}
        {options && options.length > 0 && !isUser && (
          <View style={[styles.optionsContainer, { marginTop: 12 }]}>
            {options.map((option, index) => {
              const isGotIt = option === 'Got it';
              const isExplain = option === 'Explain' || option === 'Explain more';
              return (
                <Pressable
                  key={index}
                  style={[
                    styles.optionButton,
                    isGotIt && styles.gotItButton,
                    isExplain && styles.explainButton
                  ]}
                  onPress={() => onOptionSelect?.(option, chatId)}
                >
                  {isGotIt ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  ) : (
                    <Ionicons name="bulb" size={20} color="#3B82F6" />
                  )}
                  <Text style={[styles.optionText, isExplain && styles.explainText]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View>
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.aiBubble,
        { backgroundColor: getDynamicBubbleColor() } // Use dynamic color
      ]}>
        {fileUrl && (
          <Image
            source={{ uri: fileUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        {renderMessageContent()}
        <Text style={[
          styles.timestamp,
          (isUser && bubbleColor === 'default') ? styles.userTimestamp : styles.aiTimestamp
        ]}>
          {new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  );
}

// --- Component for end-of-session summary ---
// This is needed for `messageType: 'session_summary'`
function SessionSummaryCard({ summary, onOptionSelect, chatId }: {
  summary: any;
  onOptionSelect?: (option: string, chatId?: number) => void;
  chatId?: number;
}) {
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

  return (
    <View style={styles.summaryCard}>
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
        <Text style={[styles.performanceText, { color: getPerformanceColor() }]}>
          {scorePercent}% Score
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{total_questions}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{correct_answers}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{incorrect_answers}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
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

      {/* Action Message */}
      <View style={styles.actionMessage}>
        <Text style={styles.actionText}>
          {has_weak_areas
            ? '💪 Want to strengthen your weak areas? Click "Learn More" below!'
            : '🎉 Excellent work! You\'ve mastered all concepts!'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.sessionOptionsContainer}>
        <Pressable
          style={[styles.sessionOptionButton, styles.endSessionButton]}
          onPress={() => onOptionSelect?.('End Session', chatId)}
        >
          <Text style={styles.endSessionText}>✓ End Session</Text>
        </Pressable>

        {has_weak_areas && (
          <Pressable
            style={[styles.sessionOptionButton, styles.learnMoreButton]}
            onPress={() => onOptionSelect?.('Learn More', chatId)}
          >
            <Text style={styles.learnMoreText}>📚 Learn More</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// --- STYLES ---
// These are all the styles needed for the components above
const styles = StyleSheet.create({
  bubble: {
    maxWidth: '100%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
    flexShrink: 1,
  },
  userBubble: {
    // backgroundColor intentionally not set so neutral color from getDynamicBubbleColor applies to both user and AI
  },
  aiBubble: {
    backgroundColor: '#F3F4F6', // Default gray
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: '#6B7280', // Darker text for neutral background
    opacity: 0.9,
  },
  aiTimestamp: {
    color: '#6B7280', // Dark text for gray/feedback bubbles
  },
  messageImage: {
    width: '100%',
    maxWidth: 250,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionsContainer: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    maxWidth: 120,
    justifyContent: 'center',
    gap: 6,
  },
  optionText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  gotItButton: {
    backgroundColor: '#E8FFF5',
  },
  explainButton: {
    backgroundColor: '#FFF5F5',
    borderColor: '#3B82F6',
  },
  explainText: {
    color: '#3B82F6',
  },
  // Styles for user_correction
  correctionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: '100%',
  },
  correctionText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  completeAnswerText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 4,
    fontWeight: '500',
  },
  correctAnswerText: {
    color: '#059669', // Green for praise
  },
  incorrectAnswerText: {
    color: '#4B5563', // Gray for explanation
  },
  deletedText: {
    textDecorationLine: 'line-through',
    color: '#EF4444',
    fontSize: 13,
    flexWrap: 'wrap',
  },
  insertedText: {
    fontWeight: '600',
    color: '#10B981',
    fontSize: 13,
    flexWrap: 'wrap',
  },
  // Session Summary Styles
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
  performanceText: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  // Error Types Section Styles
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
  // Weak Areas Section Styles
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
  // Action Message Styles
  actionMessage: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Session Options Buttons
  sessionOptionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  sessionOptionButton: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    maxWidth: 160,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  endSessionButton: {
    backgroundColor: '#10B981',
  },
  learnMoreButton: {
    backgroundColor: '#3B82F6',
  },
  endSessionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  learnMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emojiIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  emojiIconSmall: {
    fontSize: 20,
    marginRight: 6,
  },
  emojiInline: {
    fontSize: 20,
    marginLeft: 8,
    alignSelf: 'flex-end',
  },
});