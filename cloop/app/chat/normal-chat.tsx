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
import { useAuthErrorHandler } from '../../src/hooks/useAuthErrorHandler';
import {
  fetchNormalChatMessages,
  sendNormalChatMessage,
  clearNormalChatHistory,
  NormalChatMessage
} from '../../src/client/normal-chat/normal-chat';

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

    return (
      <View key={`${message.id}-${index}`} style={[
        styles.messageContainer,
        isUser && styles.userMessageContainer
      ]}>
        {isAI && (
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>C</Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.aiMessageBubble
        ]}>
          {message.file_url && (
            <Image 
              source={{ uri: message.file_url }}
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
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
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
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
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
            <View style={styles.cloopAvatar}>
              <Text style={styles.cloopAvatarText}>C</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Cloop AI Assistant</Text>
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
              <View style={styles.welcomeAvatar}>
                <Text style={styles.welcomeAvatarText}>C</Text>
              </View>
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
                <Text style={styles.aiAvatarText}>C</Text>
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
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask me anything about your studies..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!sending}
            />
            
            <View style={styles.inputActions}>
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
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </Pressable>
            </View>
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#10B981',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  cloopAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cloopAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
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
  welcomeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeAvatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#6B7280',
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
    color: '#374151',
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
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
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  aiAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
    borderRadius: 18,
    padding: 12,
  },
  userMessageBubble: {
    backgroundColor: '#10B981',
  },
  aiMessageBubble: {
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
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
    color: '#6B7280',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    padding: 16,
    paddingHorizontal: 20,
  },
  typingDots: {
    flexDirection: 'row',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
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
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
    paddingVertical: 8,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  disclaimer: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});