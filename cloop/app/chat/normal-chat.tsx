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
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { THEME } from '../../src/constants/theme';
import { useAuthErrorHandler } from '../../src/hooks/useAuthErrorHandler';
import {
  fetchNormalChatMessages,
  sendNormalChatMessage,
  clearNormalChatHistory,
  NormalChatMessage
} from '../../src/client/normal-chat/normal-chat';

const LOGO_IMG = require('../../assets/images/logo.png');

export default function NormalChatScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { handleAuthError } = useAuthErrorHandler();

  const [messages, setMessages] = useState<NormalChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (user && token) {
      loadNormalChat();
    }
  }, [user, token]);

  useEffect(() => {
    // Auto scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const loadNormalChat = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchNormalChatMessages({
        userId: user?.user_id,
        token: token || undefined
      });

      setMessages(response.messages);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load chat');

      // Handle authentication errors
      const wasAuthError = await handleAuthError(error);
      if (!wasAuthError) {
        setError(error.message);
        console.error('Error loading normal chat:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const response = await sendNormalChatMessage(
        { message: messageText },
        {
          userId: user?.user_id,
          token: token || undefined
        }
      );

      // Add both user and AI messages to the chat
      setMessages(prev => [...prev, response.userMessage, response.aiMessage]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');

      // Handle authentication errors
      const wasAuthError = await handleAuthError(error);
      if (!wasAuthError) {
        Alert.alert('Error', error.message);
        // Restore the input text if sending failed
        setInputText(messageText);
      }
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all your chat history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearNormalChatHistory({
                userId: user?.user_id,
                token: token || undefined
              });
              setMessages([]);
            } catch (err) {
              const error = err instanceof Error ? err : new Error('Failed to clear chat history');

              // Handle authentication errors
              const wasAuthError = await handleAuthError(error);
              if (!wasAuthError) {
                Alert.alert('Error', error.message);
              }
            }
          }
        }
      ]
    );
  };

  const renderMessage = (message: NormalChatMessage, index: number) => {
    const isUser = message.sender === 'user';
    const isAI = message.sender === 'ai';
    const hasImage = message.images && message.images.length > 0;

    return (
      <View key={`${message.id}-${index}`} style={[
        styles.messageContainer,
        isUser && styles.userMessageContainer
      ]}>
        {isAI && (
          <View style={styles.aiAvatar}>
            <Image source={LOGO_IMG} style={styles.aiAvatarImage} resizeMode="contain" />
          </View>
        )}

        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.aiMessageBubble
        ]}>
          {hasImage && message.images && (
            <Image
              source={{ uri: message.images[0] }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}

          {message.message && (
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.aiMessageText
            ]}>
              {message.message}
            </Text>
          )}

          <Text style={[
            styles.messageTime,
            isUser ? styles.userMessageTime : styles.aiMessageTime
          ]}>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
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
        <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.primary} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadNormalChat}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>

        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Image source={LOGO_IMG} style={styles.headerLogo} resizeMode="contain" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Your Assistant</Text>
              <Text style={styles.headerSubtitle}>Your personal study buddy</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
            <Pressable
              style={styles.clearButton}
              onPress={handleClearChat}
            >
              <Ionicons name="trash-outline" size={20} color="#6B7280" />
            </Pressable>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Image source={LOGO_IMG} style={styles.welcomeLogo} resizeMode="contain" />
              <Text style={styles.welcomeTitle}>Welcome to Cloop AI! 🎓</Text>
              <Text style={styles.welcomeMessage}>
                I'm your personal AI study assistant. I can help you with homework,
                explain concepts, answer questions, and support your learning journey across all subjects!
              </Text>
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Try asking:</Text>
                <Pressable
                  style={styles.suggestionCard}
                  onPress={() => setInputText("Explain photosynthesis in simple terms")}
                >
                  <Text style={styles.suggestionText}>Explain photosynthesis in simple terms</Text>
                </Pressable>
                <Pressable
                  style={styles.suggestionCard}
                  onPress={() => setInputText("Help me solve this math problem")}
                >
                  <Text style={styles.suggestionText}>Help me solve this math problem</Text>
                </Pressable>
                <Pressable
                  style={styles.suggestionCard}
                  onPress={() => setInputText("What's the difference between mitosis and meiosis?")}
                >
                  <Text style={styles.suggestionText}>What's the difference between mitosis and meiosis?</Text>
                </Pressable>
                <Pressable
                  style={styles.suggestionCard}
                  onPress={() => setInputText("Give me study tips for better focus")}
                >
                  <Text style={styles.suggestionText}>Give me study tips for better focus</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            messages.map((message, index) => renderMessage(message, index))
          )}

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
              placeholder="Ask me anything about your studies..."
              placeholderTextColor={THEME.colors.text.secondary}
              value={inputText}
              onChangeText={setInputText}
              multiline={false}
              editable={!sending}
            />

            <Pressable
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={24} color="#fff" />
              )}
            </Pressable>
          </View>

          <Text style={styles.disclaimer}>
            Powered by OpenAI GPT • Always verify important information
          </Text>
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
    justifyContent: 'space-between',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  headerSubtitle: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  clearButton: {
    padding: 8,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  welcomeLogo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  suggestionsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text.primary,
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    fontSize: 14,
    color: THEME.colors.text.primary,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
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
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userMessageBubble: {
    backgroundColor: THEME.colors.primary,
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: THEME.colors.text.primary,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userMessageTime: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  aiMessageTime: {
    color: THEME.colors.text.secondary,
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
  },
  disclaimer: {
    fontSize: 11,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
});