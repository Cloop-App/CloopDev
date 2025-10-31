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
  onOptionSelect
}: MessageBubbleProps) {
  const isUser = sender === 'user';
  
  // --- DYNAMIC COLOR LOGIC ---
  // This correctly sets the bubble color based on feedback
  const getDynamicBubbleColor = () => {
    // Use the same base background for both user and AI messages so bubbles look identical
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
    if (messageType === 'session_summary' && sessionSummary) {
      return <SessionSummaryCard summary={sessionSummary} />;
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
            <Text style={[styles.messageText, { color: getDynamicTextColor() }]}>
              {message}
            </Text>
          ) : (
            // Answer is incorrect (red bubble)
            diffHtml && (
              <View style={styles.correctionContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text style={{ marginLeft: 6, color: '#EF4444', fontSize: 12, fontWeight: '500' }}>
                    Correction Needed
                  </Text>
                </View>
                {/* This maps the <del> and <ins> tags to styled text */}
                <Text style={styles.correctionText}>
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
              </View>
            )
          )}

          {/* Step 2: Show the complete answer (praise or explanation) */}
          {completeAnswer && (
            <Text style={[
              styles.completeAnswerText,
              { marginTop: 12 },
              isCorrect ? styles.correctAnswerText : styles.incorrectAnswerText
            ]}>
              {completeAnswer}
            </Text>
          )}

          {/* Step 3: Show the options (always show two canonical options if none provided) */}
          {localOptions && localOptions.length > 0 && (
            <View style={[styles.optionsContainer, { marginTop: 16 }]}>
              {localOptions.map((option, index) => (
                <Pressable
                  key={index}
                  style={[styles.optionButton, index === 0 ? styles.gotItButton : styles.confusedButton]}
                  onPress={() => onOptionSelect?.(option, chatId)}
                >
                  {index === 0 ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  ) : (
                    <Ionicons name="help-circle" size={20} color="#EF4444" />
                  )}
                  <Text style={[styles.optionText, index === 1 && styles.confusedText]}>{option}</Text>
                </Pressable>
              ))}
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
function SessionSummaryCard({ summary }: { summary: any }) {
  const { 
    total_questions = 0, 
    correct_answers = 0, 
    incorrect_answers = 0,
    star_rating = 0,
    performance_percent = 0
  } = summary;

  const getPerformanceColor = () => {
    if (performance_percent >= 80) return '#10B981';
    if (performance_percent >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>🎓 Session Complete!</Text>
        <View style={styles.starContainer}>
          {[...Array(3)].map((_, i) => (
            <Text key={i} style={styles.starIcon}>
              {i < star_rating ? '⭐' : '☆'}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.performanceSection}>
        <Text style={[styles.performanceText, { color: getPerformanceColor() }]}>
          {performance_percent}% Score
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
      {/* You can add back the 'error_types', 'learning_gaps', etc. here if you need them */}
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
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
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
    maxWidth: 160,
    justifyContent: 'center',
    gap: 8,
  },
  optionText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '600',
  },
  gotItButton: {
    backgroundColor: '#E8FFF5',
  },
  confusedButton: {
    backgroundColor: '#FFF5F5',
    borderColor: '#EF4444',
  },
  confusedText: {
    color: '#EF4444',
  },
  // Styles for user_correction
  correctionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
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
    marginTop: 8,
    marginBottom: 8,
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
    marginBottom: 12,
    textAlign: 'center',
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
    marginBottom: 20,
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
});