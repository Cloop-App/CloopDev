import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SessionSummaryCard } from './SessionSummaryCard';

interface MessageBubbleProps {
  message: string;
  messageType?: string;
  options?: string[];
  diffHtml?: string;
  completeAnswer?: string;
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
  options: _options,
  diffHtml,
  completeAnswer,
  fileUrl,
  fileType: _fileType,
  sender,
  timestamp,
  bubbleColor = 'default',
  isCorrect,
  sessionSummary,
  chatId,
  emoji,
  onOptionSelect,
}: MessageBubbleProps) {
  const isUser = sender === 'user';

  const getDynamicBubbleColor = () => {
    if (messageType === 'user_correction' && isUser) {
      return 'transparent'; // Remove outer grey wrapper
    }
    if (bubbleColor === 'green') return '#D1FAE5';
    if (bubbleColor === 'red') return '#FEE2E2';
    if (isUser) return '#E9D5FF';
    return '#F3F4F6';
  };

  const getDynamicTextColor = () => {
    if (bubbleColor === 'green' || bubbleColor === 'red') return '#111827';
    return '#111827';
  };

  const renderDiffHtml = (html: string) => (
    <Text style={[styles.correctionText, { flexShrink: 1 }]}>
      {html.split(/(<del>.*?<\/del>|<ins>.*?<\/ins>)/g).map((part, index) => {
        if (part.startsWith('<del>')) {
          const text = part.replace(/<\/?del>/g, '');
          return (
            <Text key={index} style={styles.deletedText}>
              {text}
            </Text>
          );
        }
        if (part.startsWith('<ins>')) {
          const text = part.replace(/<\/?ins>/g, '');
          return (
            <Text key={index} style={styles.insertedText}>
              {text}
            </Text>
          );
        }
        return (
          <Text key={index} style={styles.correctionText}>
            {part}
          </Text>
        );
      })}
    </Text>
  );

  const renderMessageContent = () => {
    if (messageType === 'session_summary') {
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

      // Fallback if type is session_summary but no metrics found
      return (
        <View style={styles.bubble}>
          <Text style={{ color: 'red', fontWeight: 'bold' }}>Session Summary (Data Missing)</Text>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      );
    }

    if (messageType === 'user_correction') {
      return (
        <View>
          <View style={styles.correctionContainer}>
            {diffHtml ? (
              renderDiffHtml(diffHtml)
            ) : (
              <Text style={[styles.messageText, { color: getDynamicTextColor() }]}>
                {message}
              </Text>
            )}

            {completeAnswer && (
              <Text style={[
                styles.completeAnswerText,
                isCorrect ? styles.correctAnswerText : styles.incorrectAnswerText
              ]}>
                {completeAnswer}
              </Text>
            )}
          </View>
          {emoji && (
            <Text style={styles.emojiBottomRight}>{emoji}</Text>
          )}
        </View>
      );
    }

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
        {/* Timestamp removed as requested */}
        {/* <Text style={[
          styles.timestamp,
          (isUser && bubbleColor === 'default') ? styles.userTimestamp : styles.aiTimestamp
        ]}>
          {new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text> */}
      </View>
    </View>
  );
}

// --- STYLES ---
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
  emojiBottomRight: {
    fontSize: 18,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});