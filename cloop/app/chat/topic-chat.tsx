import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useAuthErrorHandler } from '../../src/hooks/useAuthErrorHandler';
import { API_BASE_URL } from '../../src/config/api';
import { THEME } from '../../src/constants/theme';
import MessageBubble from '../../components/chat/MessageBubble';
import GoalsProgressBar from '../../components/chat/GoalsProgressBar';
import {
  fetchTopicChatMessages,
  sendTopicChatMessage,
  TopicChatMessage,
  TopicChatDetails,
  TopicGoal
} from '../../src/client/topic-chat/topic-chat';

const LOGO_IMG = require('../../assets/images/logo.png');

export default function TopicChatScreen() {
  const router = useRouter();
  const { topicId, topicTitle, chapterTitle, subjectName } = useLocalSearchParams<{
    topicId: string;
    topicTitle: string;
    chapterTitle: string;
    subjectName: string;
  }>();
  const { user, token } = useAuth();
  const { handleAuthError } = useAuthErrorHandler();

  const [messages, setMessages] = useState<TopicChatMessage[]>([]);
  const [topic, setTopic] = useState<TopicChatDetails | null>(null);
  const [goals, setGoals] = useState<TopicGoal[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Map<number, any>>(new Map()); // Store feedback per message
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [initialTimeSpent, setInitialTimeSpent] = useState<number>(0); // Store initial time from DB
  const [currentSessionTime, setCurrentSessionTime] = useState<number>(0); // Track current session time
  const [elapsedTime, setElapsedTime] = useState<string>('0:00');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (topicId && user && token) {
      loadTopicChat();
    }
  }, [topicId, user, token]);

  useEffect(() => {
    // Auto scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    // Update timer every second
    const interval = setInterval(() => {
      const now = new Date();
      const sessionDiff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
      setCurrentSessionTime(sessionDiff);
      const totalSeconds = initialTimeSpent + sessionDiff;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime, initialTimeSpent]);

  // Save time spent periodically (every 30 seconds) and on unmount
  useEffect(() => {
    const saveTimeSpent = async () => {
      if (currentSessionTime > 0 && topicId && user && token) {
        try {
          // Send a silent update to save time
          await fetch(`${API_BASE_URL}/api/topic-chats/${topicId}/update-time`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              session_time_seconds: currentSessionTime
            })
          });
        } catch (err) {
          console.error('Error saving time spent:', err);
        }
      }
    };

    // Save every 30 seconds
    const saveInterval = setInterval(() => {
      saveTimeSpent();
    }, 30000);

    // Save on unmount/screen leave
    return () => {
      clearInterval(saveInterval);
      saveTimeSpent();
    };
  }, [currentSessionTime, topicId, user, token]);

  const loadTopicChat = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchTopicChatMessages(parseInt(topicId!), {
        userId: user?.user_id,
        token: token || undefined
      });

      setTopic(response.topic);
      setGoals(response.goals || []);

      // Set initial time spent from database
      const timeSpent = response.topic?.time_spent_seconds || 0;
      setInitialTimeSpent(timeSpent);
      setSessionStartTime(new Date()); // Reset session start time

      // If there are no messages but there's an initial greeting, add it
      if (response.messages.length === 0 && response.initialGreeting) {
        const greetingMessages: TopicChatMessage[] = response.initialGreeting.map((msg, idx) => ({
          id: Date.now() + idx,
          sender: 'ai' as const,
          message: msg.message,
          message_type: msg.message_type,
          options: msg.options,
          created_at: new Date().toISOString()
        }));
        setMessages(greetingMessages);
      } else {
        setMessages(response.messages);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load chat');

      // Handle authentication errors
      const wasAuthError = await handleAuthError(error);
      if (!wasAuthError) {
        setError(error.message);
        console.error('Error loading topic chat:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || sending) return;

    setInputText('');
    setSending(true);

    try {
      // Add user message immediately for better UX
      const userMessage: TopicChatMessage = {
        id: Date.now(),
        message: textToSend,
        sender: 'user',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);

      const response = await sendTopicChatMessage(
        parseInt(topicId!),
        {
          message: textToSend,
          session_time_seconds: currentSessionTime
        },
        {
          userId: user?.user_id,
          token: token || undefined
        }
      );

      // aiMessages may be returned as `aiMessages` (new) or `messages` (alias)
      const aiMsgs: TopicChatMessage[] = (response as any).messages || (response as any).aiMessages || [];

      // Add feedback to the feedback map for user message
      // Capture into locals because TypeScript doesn't narrow across closures reliably
      const userCorrection = (response as any).userCorrection ?? null;
      const directFeedback = (response as any).feedback ?? null;

      if (userCorrection || directFeedback) {
        setFeedbackMap(prev => {
          const newMap = new Map(prev);
          if (userCorrection) {
            newMap.set(userMessage.id, {
              ...userCorrection,
              feedback: userCorrection.feedback // Ensure nested feedback is also passed
            });
          }
          if (directFeedback) {
            newMap.set(userMessage.id, directFeedback);
          }
          return newMap;
        });
      }

      // Convert AI messages and add unique IDs
      const newAIMessages = aiMsgs.map(m => {
        const msg: any = {
          ...m,
          id: Date.now() + Math.random(),
          emoji: m.emoji || undefined,
          created_at: new Date().toISOString()
        };

        // If this is a session_summary message, parse metrics from diff_html
        if (m.message_type === 'session_summary' && m.diff_html) {
          try {
            msg.session_summary = JSON.parse(m.diff_html);
          } catch (e) {
            console.error('Failed to parse session metrics from diff_html:', e);
          }
        }

        return msg;
      });

      // If the server returned a canonical userMessage (the admin_chat row), replace the
      // local placeholder message with the server version so that fields like
      // message_type and diff_html are preserved and the bubble renders as a diff.
      const serverUserMessage = (response as any).userMessage ?? null;

      // Build the new messages array by replacing the last local placeholder with the server one
      if (serverUserMessage) {
        const serverMsg: TopicChatMessage = {
          id: serverUserMessage.id,
          sender: 'user',
          message: serverUserMessage.message || textToSend,
          message_type: serverUserMessage.message_type || 'text',
          options: serverUserMessage.options || [],
          diff_html: serverUserMessage.diff_html || null,
          emoji: serverUserMessage.emoji || undefined,
          file_url: serverUserMessage.file_url || undefined,
          file_type: serverUserMessage.file_type || undefined,
          created_at: serverUserMessage.created_at || new Date().toISOString()
        };

        // If there's a session summary, append it after AI messages
        if (response.session_summary) {
          const summaryMessage: TopicChatMessage = {
            id: Date.now() + 1000,
            sender: 'ai',
            message: 'Session Summary',
            message_type: 'session_summary',
            session_summary: response.session_summary,
            created_at: new Date().toISOString()
          };

          setMessages(prev => {
            // remove the temporary placeholder (assumed to be last)
            const withoutLast = prev.slice(0, -1);
            return [...withoutLast, serverMsg, ...newAIMessages, summaryMessage];
          });
          return;
        }

        // No session summary: replace placeholder and append AI messages
        setMessages(prev => {
          const withoutLast = prev.slice(0, -1);
          return [...withoutLast, serverMsg, ...newAIMessages];
        });
      } else {
        // No server userMessage returned; fallback: append AI messages after placeholder
        if (response.session_summary) {
          const summaryMessage: TopicChatMessage = {
            id: Date.now() + 1000,
            sender: 'ai',
            message: 'Session Summary',
            message_type: 'session_summary',
            session_summary: response.session_summary,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, ...newAIMessages, summaryMessage]);
        } else {
          setMessages(prev => [...prev, ...newAIMessages]);
        }
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');

      // Handle authentication errors
      const wasAuthError = await handleAuthError(error);
      if (!wasAuthError) {
        Alert.alert('Error', error.message);
        // Restore input and remove temporary message
        setInputText(textToSend);
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setSending(false);
    }
  };

  const handleOptionSelect = async (option: string, chatId?: number) => {
    // Use dedicated endpoint to record option selection and receive AI response
    if (!topicId || !user || !token) {
      // Fallback: send as normal message
      return handleSendMessage(option);
    }

    setSending(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/topic-chats/${topicId}/option`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chatId, option })
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err || 'Option endpoint failed');
      }

      const data = await resp.json();

      // Append returned AI messages (if any)
      const aiMsgs: TopicChatMessage[] = (data.aiMessages || []).map((m: any) => {
        const msg: any = {
          id: m.id || Date.now() + Math.random(),
          sender: 'ai',
          message: m.message,
          message_type: m.message_type || 'text',
          options: m.options || [],
          emoji: m.emoji || undefined,
          created_at: m.created_at || new Date().toISOString()
        };

        // Parse session_metrics from diff_html if present
        if (m.message_type === 'session_summary' && m.diff_html) {
          try {
            msg.session_summary = JSON.parse(m.diff_html);
          } catch (e) {
            console.error('Failed to parse session metrics from option response:', e);
          }
        }

        return msg;
      });

      if (aiMsgs.length > 0) {
        setMessages(prev => [...prev, ...aiMsgs]);
      }

      // Optionally update feedbackMap if server returned feedback
      if (data.feedback && chatId) {
        setFeedbackMap(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(chatId) || {};
          newMap.set(chatId, { ...existing, ...data.feedback });
          return newMap;
        });
      }

      // If server returned updated goals, refresh the goals state so progress bar updates
      if (data.goals) {
        setGoals(data.goals || []);
      }

    } catch (err) {
      console.error('Error sending option selection:', err);
      // fallback: send option as a normal message
      await handleSendMessage(option);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = (message: TopicChatMessage, index: number) => {
    const isUser = message.sender === 'user';
    const feedback = feedbackMap.get(message.id);

    let bubbleColor: 'green' | 'red' | 'yellow' | 'default' = 'default';
    let isCorrect: boolean | undefined = undefined;
    let emoji: string | undefined = undefined;
    let messageType = message.message_type || 'text';
    let options = message.options || [];
    let diffHtml = message.diff_html;
    let completeAnswer: string | undefined = (message as any).complete_answer;

    if (isUser && feedback) {
      diffHtml = feedback.diff_html || diffHtml;
      options = feedback.options || options;
      bubbleColor = feedback.bubble_color || (feedback.is_correct ? 'green' : 'red');
      isCorrect = feedback.is_correct;
      completeAnswer = feedback.complete_answer || completeAnswer;

      if (feedback.diff_html || feedback.complete_answer) {
        messageType = 'user_correction';
      }
    }

    if (!isUser && message.feedback) {
      bubbleColor = message.feedback.bubble_color || 'default';
      emoji = message.feedback.emoji;
    }

    if (message.emoji && !emoji) {
      emoji = message.emoji;
    }

    return (
      <View key={`${message.id}-${index}`} style={[
        styles.messageRow,
        isUser ? styles.userMessageRow : styles.aiMessageRow
      ]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Image source={LOGO_IMG} style={styles.aiAvatarImage} resizeMode="contain" />
          </View>
        )}

        <View style={[
          styles.bubbleWrapper,
          isUser ? styles.userBubbleWrapper : styles.aiBubbleWrapper
        ]}>
          <MessageBubble
            message={message.message || ''}
            messageType={messageType}
            options={options}
            diffHtml={diffHtml}
            completeAnswer={completeAnswer}
            chatId={message.id}
            fileUrl={message.file_url}
            fileType={message.file_type}
            sender={message.sender}
            timestamp={message.created_at}
            bubbleColor={bubbleColor}
            emoji={emoji}
            isCorrect={isCorrect}
            sessionSummary={message.session_summary}
            onOptionSelect={handleOptionSelect}
          />
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=10B981&color=fff&size=64`
              }}
              style={styles.userAvatarImage}
            />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Starting your learning session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadTopicChat}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={THEME.colors.text.primary} />
        </Pressable>

        <View style={styles.headerContent}>
          <Image source={LOGO_IMG} style={styles.headerLogo} resizeMode="contain" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{topic?.title || topicTitle}</Text>
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={14} color={THEME.colors.text.secondary} />
              <Text style={styles.timerText}>{elapsedTime}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Goals Progress Bar */}
      <GoalsProgressBar goals={goals} forceCollapse={isInputFocused} />

      {/* Topic Context Bar */}
      <View style={styles.contextBar}>
        <Ionicons name="book-outline" size={16} color="#6B7280" />
        <Text style={styles.contextText} numberOfLines={1}>
          {subjectName} → {chapterTitle}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message, index) => renderMessage(message, index))}

          {sending && (
            <View style={styles.typingIndicator}>
              <View style={styles.aiAvatar}>
                <Image source={LOGO_IMG} style={styles.aiAvatarImage} resizeMode="contain" />
              </View>
              <View style={styles.typingBubble}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputForm}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your answer..."
              placeholderTextColor={THEME.colors.text.secondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!sending}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onSubmitEditing={() => handleSendMessage()}
            />

            <Pressable
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={24} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: THEME.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 12,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timerText: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    fontWeight: '500',
    marginLeft: 4,
  },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contextText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  aiMessageRow: {
    justifyContent: 'flex-start',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  bubbleWrapper: {
    maxWidth: '75%',
    flexShrink: 1,
  },
  aiBubbleWrapper: {
    alignItems: 'flex-start',
  },
  userBubbleWrapper: {
    alignItems: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8,
  },
  userAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.text.light,
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputForm: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: THEME.colors.background,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    color: THEME.colors.text.primary,
    fontSize: 16,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: THEME.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  }
});