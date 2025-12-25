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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useAuthErrorHandler } from '../../src/hooks/useAuthErrorHandler';
import { API_BASE_URL } from '../../src/config/api';
import { THEME } from '../../src/constants/theme';
import MessageBubble from '../../components/chat/MessageBubble';
import GoalsProgressBar from '../../components/chat/GoalsProgressBar';
import TypingIndicator from '../../components/chat/TypingIndicator';
import {
  fetchTopicChatMessages,
  sendTopicChatMessage,
  TopicChatMessage,
  TopicChatDetails,
  TopicGoal
} from '../../src/client/topic-chat/topic-chat';
import { useSpeechRecognition } from '../../src/hooks/useSpeechRecognition';

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
  const insets = useSafeAreaInsets();

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasPermission,
    requestPermission
  } = useSpeechRecognition();

  // Store text before speech to support appending
  const [textBeforeSpeech, setTextBeforeSpeech] = useState('');

  useEffect(() => {
    if (transcript) {
      setInputText(textBeforeSpeech + (textBeforeSpeech ? ' ' : '') + transcript);
    }
  }, [transcript]);

  const handleMicPress = async () => {
    if (isListening) {
      await stopListening();
    } else {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Microphone permission is needed for voice input.');
          return;
        }
      }
      setTextBeforeSpeech(inputText);
      await startListening();
    }
  };

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
  }, [messages, sending]);

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

  const simulateIncomingMessages = async (msgs: TopicChatMessage[]) => {
    if (!msgs || msgs.length === 0) return;

    for (const msg of msgs) {
      setSending(true);
      // Wait for a bit to simulate typing (1-2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));

      setMessages(prev => {
        // Avoid duplicates if weird race conditions happen
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setSending(false);

      // Small pause between messages
      if (msgs.indexOf(msg) < msgs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

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

      // Logic to determine if we should animate the "fresh" chat experience
      // If messages < 3 and completion is low, treat as fresh to replay the greeting
      const isFreshChat = response.messages.length <= 2 && (response.topic.completion_percent || 0) < 5;

      if (isFreshChat && response.messages.length > 0) {
        // Special case: It's a "fresh" chat but the server already has the greeting stored.
        // We want to REPLAY it for the user to see the "Typing..." effect.
        setMessages([]); // Start empty
        setLoading(false); // Stop main spinner

        // Replay existing messages
        simulateIncomingMessages(response.messages);
      }
      else if (response.messages.length === 0 && response.initialGreeting && response.initialGreeting.length > 0) {
        // Fresh start, no messages in DB yet, but we have initial greeting from server response
        setMessages([]);
        setLoading(false);

        const greetingMessages: TopicChatMessage[] = response.initialGreeting.map((msg, idx) => ({
          id: Date.now() + idx,
          sender: 'ai' as const,
          message: msg.message,
          message_type: msg.message_type,
          options: msg.options,
          created_at: new Date().toISOString()
        }));

        simulateIncomingMessages(greetingMessages);
      } else {
        // Restore history immediately
        setMessages(response.messages);
        setLoading(false);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load chat');
      setLoading(false);

      // Handle authentication errors
      const wasAuthError = await handleAuthError(error);
      if (!wasAuthError) {
        setError(error.message);
        console.error('Error loading topic chat:', err);
      }
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || sending) return;

    setInputText('');
    setSending(true);

    // Initial placeholder message
    const userMessageId = Date.now();
    const userMessage: TopicChatMessage = {
      id: userMessageId,
      message: textToSend,
      sender: 'user',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
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

      // AI messages from response
      const aiMsgs: TopicChatMessage[] = (response as any).messages || (response as any).aiMessages || [];

      // Update goals if returned in response (to sync progress instantly)
      if ((response as any).goals) {
        setGoals((response as any).goals);
      }

      // Add feedback to the feedback map for user message
      const userCorrection = (response as any).userCorrection ?? null;
      const directFeedback = (response as any).feedback ?? null;

      if (userCorrection || directFeedback) {
        setFeedbackMap(prev => {
          const newMap = new Map(prev);
          if (userCorrection) {
            newMap.set(userMessageId, { // Use original ID to map feedback
              ...userCorrection,
              feedback: userCorrection.feedback
            });
          }
          if (directFeedback) {
            newMap.set(userMessageId, directFeedback);
          }
          return newMap;
        });
      }

      // 1. Handle the Core User Message Update ( Server Canonicalization )
      // If the server returned a canonical userMessage, we replace our local one to apply any formatting/diffs
      const serverUserMessage = (response as any).userMessage ?? null;



      let messagesToInject: TopicChatMessage[] = [];

      // Convert raw AI messages to proper objects
      const newAIMessages = aiMsgs.map(m => {
        console.log('Debug: Processing AI message:', {
          type: m.message_type,
          hasSessionMetrics: !!m.session_metrics,
          hasDiffHtml: !!m.diff_html,
          message: m.message
        });

        const msg: any = {
          ...m,
          id: Date.now() + Math.random(),
          emoji: m.emoji || undefined,
          created_at: new Date().toISOString()
        };

        // Priority 1: Direct session_metrics from backend (New format)
        // Check both direct property and via accidental nesting or any cast
        const rawMetrics = m.session_metrics || (m as any).session_metrics;

        // Priority 2: Parse from diff_html if it looks like JSON strings
        let parsedMetrics = null;
        if (!rawMetrics && m.message_type === 'session_summary' && m.diff_html) {
          try {
            // Only try parse if it looks like an object
            if (m.diff_html.trim().startsWith('{')) {
              parsedMetrics = JSON.parse(m.diff_html);
            }
          } catch (e) {
            console.error('Failed to parse session metrics from diff_html:', e);
          }
        }

        if (rawMetrics) {
          console.log('Debug: Using raw session_metrics');
          msg.session_summary = rawMetrics;
          msg.message_type = 'session_summary'; // Force type to render card
        } else if (parsedMetrics) {
          console.log('Debug: Using parsed metrics from diff_html');
          msg.session_summary = parsedMetrics;
          msg.message_type = 'session_summary';
        }

        // Fallback: If message text is "session_complete" but no type set, force it
        if (msg.message === 'session_complete' && msg.message_type !== 'session_summary') {
          msg.message_type = 'session_summary';
        }

        return msg;
      });

      // Special case: Session Summary
      if (response.session_summary) {
        const summaryMessage: TopicChatMessage = {
          id: Date.now() + 1000,
          sender: 'ai',
          message: 'Session Summary',
          message_type: 'session_summary',
          session_summary: response.session_summary,
          created_at: new Date().toISOString()
        };
        newAIMessages.push(summaryMessage);
      }

      // Update the user message in place (instant)
      setMessages(prev => {
        const nextMessages = [...prev];
        const lastIndex = nextMessages.length - 1;

        // Ensure we are updating the correct message (stats matching)
        if (nextMessages[lastIndex].id === userMessageId) {
          if (serverUserMessage) {
            nextMessages[lastIndex] = {
              id: serverUserMessage.id, // Update ID to server ID
              sender: 'user',
              // Guard against replacing user text with AI meta-commentary
              message: (serverUserMessage.message && !serverUserMessage.message.startsWith("The user"))
                ? serverUserMessage.message
                : textToSend,
              message_type: serverUserMessage.message_type || 'text',
              options: serverUserMessage.options || [],
              diff_html: serverUserMessage.diff_html || null,
              emoji: serverUserMessage.emoji || undefined,
              file_url: serverUserMessage.file_url || undefined,
              file_type: serverUserMessage.file_type || undefined,
              created_at: serverUserMessage.created_at || new Date().toISOString()
            };

            // Note: We keep local ID if needed, but here we can stick to server ID as we updated options
            nextMessages[lastIndex].id = userMessageId;
          }
        }
        return nextMessages;
      });

      setSending(false); // Stop "sending" state from the initial request

      // NOW Simulate the AI typing for the response messages
      simulateIncomingMessages(newAIMessages);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setSending(false);

      // Handle authentication errors
      const wasAuthError = await handleAuthError(error);
      if (!wasAuthError) {
        Alert.alert('Error', error.message);
        // Restore input and remove temporary message
        setInputText(textToSend);
        setMessages(prev => prev.filter(m => m.id !== userMessageId));
      }
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

        // Priority 1: Direct session_metrics from backend (New format)
        if (m.session_metrics) {
          msg.session_summary = m.session_metrics;
        }
        // Priority 2: Parse from diff_html (Legacy fallback)
        else if (m.message_type === 'session_summary' && m.diff_html) {
          try {
            msg.session_summary = JSON.parse(m.diff_html);
          } catch (e) {
            console.error('Failed to parse session metrics from option response:', e);
          }
        }

        return msg;
      });

      if (aiMsgs.length > 0) {
        await simulateIncomingMessages(aiMsgs); // Simulate typing for response
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
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerContent}>
          <Image source={LOGO_IMG} style={styles.headerLogo} resizeMode="contain" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{topic?.title || topicTitle}</Text>
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={14} color="#FFFFFF" />
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
            <View style={styles.messageRow}>
              <View style={styles.aiAvatar}>
                <Image source={LOGO_IMG} style={styles.aiAvatarImage} resizeMode="contain" />
              </View>
              <TypingIndicator />
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your answer..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!sending}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onSubmitEditing={() => handleSendMessage()}
            />

            <View style={styles.inputActions}>
              <Pressable
                style={styles.actionButton}
                onPress={handleMicPress}
              >
                <Ionicons
                  name={isListening ? "mic" : "mic-outline"}
                  size={24}
                  color={isListening ? "#FFD700" : "#FFF"}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.sendButton,
                  (!inputText.trim() || sending) && styles.sendButtonDisabled
                ]}
                onPress={() => handleSendMessage()}
                disabled={!inputText.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#9269F0" />
                ) : (
                  <Ionicons name="arrow-up" size={24} color="#9269F0" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
    borderBottomWidth: 0,
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
    borderRadius: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timerText: {
    fontSize: 13,
    color: '#FFFFFF',
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

  inputContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});