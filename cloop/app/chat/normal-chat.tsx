import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  Dimensions,
  Animated,
  TouchableWithoutFeedback
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useAuthErrorHandler } from '../../src/hooks/useAuthErrorHandler';
import {
  fetchNormalChatMessages,
  sendNormalChatMessage,
  clearNormalChatHistory,
  NormalChatMessage
} from '../../src/client/normal-chat/normal-chat';
import { useSpeechRecognition } from '../../src/hooks/useSpeechRecognition';
import { saveChatSession, getChatSessions, deleteChatSession, ChatSession, clearAllSessions } from '../../src/utils/chatHistory';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

export default function NormalChatScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { handleAuthError } = useAuthErrorHandler();

  const [messages, setMessages] = useState<NormalChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [historySessions, setHistorySessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasPermission,
    requestPermission
  } = useSpeechRecognition();

  const [textBeforeSpeech, setTextBeforeSpeech] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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
    if (user && token) {
      loadNormalChat();
    }
  }, [user, token]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Drawer Animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isDrawerOpen ? 0 : -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isDrawerOpen]);

  // Load History on Mount
  useEffect(() => {
    loadHistorySessions();
  }, []);

  const loadHistorySessions = async () => {
    const sessions = await getChatSessions();
    setHistorySessions(sessions);
  };

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
      const wasAuthError = await handleAuthError(error);
      if (!wasAuthError) {
        setError(error.message);
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
    setIsTyping(true);

    // Optimistically add user message
    const tempUserMessage: NormalChatMessage = {
      id: Date.now(), // Temp ID
      user_id: user?.user_id || 0,
      sender: 'user',
      message: messageText,
      message_type: 'text',
      images: [],
      videos: [],
      links: [],
      emoji: undefined,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await sendNormalChatMessage(
        { message: messageText },
        {
          userId: user?.user_id,
          token: token || undefined
        }
      );
      // Replace last message (temp) with real ones, or just append AI message if we want to keep the temp one simple.
      // Better: Remove the temp message and append the real backend responses (which include the user message sanitized/stored)
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempUserMessage.id);
        return [...withoutTemp, response.userMessage, response.aiMessage];
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      const wasAuthError = await handleAuthError(error);
      if (!wasAuthError) {
        Alert.alert('Error', error.message);
        setInputText(messageText); // Restore input
        // Remove temp message on failure
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      }
    } finally {
      setSending(false);
      setIsTyping(false);
    }
  };

  const handleNewChat = async () => {
    // Save current session before clearing if it has messages
    if (messages.length > 0) {
      await saveChatSession(messages);
      await loadHistorySessions(); // Refresh list
    }

    // Immediate new chat
    try {
      setMessages([]);
      setCurrentSessionId(null);
      setIsDrawerOpen(false);
      await clearNormalChatHistory({
        userId: user?.user_id,
        token: token || undefined
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to start new chat');
    }
  };

  const handleLoadSession = async (session: ChatSession) => {
    // If we are currently in a chat with messages, save it first? 
    // For simplicity, let's assume switching sessions keeps the old one saved if it was already saved, 
    // but if it's the *current* unsaved one, we should save it.
    if (!currentSessionId && messages.length > 0) {
      await saveChatSession(messages);
    }

    // We also need to clear the backend context because we are switching context locally
    // but the backend is still on the "active" thread.
    // This is the limitation: switching local history DOES NOT switch backend context.
    // We will silent-clear backend to avoid mixing.
    await clearNormalChatHistory({ userId: user?.user_id, token: token || undefined }).catch(() => { });

    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setIsDrawerOpen(false);

    // Update list to reflect any new saves
    await loadHistorySessions();
  };

  const handleDeleteSession = async (sessionId: string) => {
    // If deleting current session
    if (currentSessionId === sessionId) {
      setMessages([]);
      setCurrentSessionId(null);
      await clearNormalChatHistory({ userId: user?.user_id, token: token || undefined });
    }

    const updated = await deleteChatSession(sessionId);
    setHistorySessions(updated);
  };

  const renderMessage = (message: NormalChatMessage, index: number) => {
    const isUser = message.sender === 'user';
    const isAI = message.sender === 'ai';
    const hasImage = message.images && message.images.length > 0;

    return (
      <View key={`${message.id}-${index}`} style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        {isAI && (
          <View style={styles.aiAvatar}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.aiAvatarImage}
            />
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
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </Pressable>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Cloop AI</Text>
        </View>

        <View style={styles.headerTitleContainer} />

        <View style={styles.headerRight}>
          <Pressable onPress={handleNewChat} style={styles.iconButton}>
            <Ionicons name="add" size={32} color="#FFF" />
          </Pressable>
          <Pressable onPress={() => setIsDrawerOpen(true)} style={styles.iconButton}>
            <Ionicons name="menu" size={28} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Main Chat Area */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.emptyIconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.emptyGreeting}>Hi, {user?.name?.split(' ')[0] || 'there'}!</Text>
              <Text style={styles.emptySubtext}>How can I help you today?</Text>
            </View>
          ) : (
            <>
              {messages.map((msg, index) => renderMessage(msg, index))}
              {isTyping && (
                <View style={styles.typingContainer}>
                  <View style={styles.aiAvatar}>
                    <Image
                      source={require('../../assets/images/logo.png')}
                      style={styles.aiAvatarImage}
                    />
                  </View>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color="#9269F0" />
                    <Text style={styles.typingText}>Cloop AI is typing...</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Minimal Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Message Cloop AI..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={inputText}
              onChangeText={setInputText}
              multiline={true} // Allow multiline but looks like single line
              editable={!sending}
            />

            <View style={styles.inputActions}>
              <Pressable onPress={handleMicPress} style={styles.actionButton}>
                <Ionicons name={isListening ? "mic" : "mic-outline"} size={22} color={isListening ? "#FFD700" : "#FFF"} />
              </Pressable>
              <Pressable
                onPress={handleSendMessage}
                disabled={!inputText.trim() || sending}
                style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#9269F0" />
                ) : (
                  <Ionicons name="arrow-forward" size={18} color="#9269F0" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <TouchableWithoutFeedback onPress={() => setIsDrawerOpen(false)}>
          <View style={styles.drawerOverlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Sidebar Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={styles.drawerContent}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>History</Text>
            <Pressable onPress={() => setIsDrawerOpen(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </Pressable>
          </View>

          <ScrollView style={styles.drawerItems}>
            <Pressable style={styles.periodHeader}>
              <Text style={styles.periodText}>Recent</Text>
            </Pressable>
            {/* Since we don't have multi-threads, we just show 'Current Chat' or similar */}
            {/* Current / New Chat Indicator */}
            <Pressable
              style={[styles.historyItem, !currentSessionId && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
              onPress={() => {
                if (messages.length > 0 && !currentSessionId) return; // Already here
                handleNewChat();
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#9269F0" style={{ marginRight: 10 }} />
              <Text style={[styles.historyText, { color: '#9269F0', fontWeight: 'bold' }]}>
                New Chat
              </Text>
            </Pressable>

            {/* Saved History Items */}
            {historySessions.map((session) => (
              <View key={session.id} style={styles.historyItemWrapper}>
                <Pressable
                  style={[styles.historyItem, currentSessionId === session.id && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
                  onPress={() => handleLoadSession(session)}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#000" style={{ marginRight: 10 }} />
                  <Text style={styles.historyText} numberOfLines={1}>
                    {session.title || "Conversation"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.deleteIcon}
                  onPress={() => handleDeleteSession(session.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          {/* Footer removed as requested */}
        </SafeAreaView>
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16, // Increased padding
    backgroundColor: '#9269F0', // Purple header
    borderBottomWidth: 0,
    elevation: 0,
  },
  headerLeft: {
    width: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    width: 'auto',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF', // White title
  },
  iconButton: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Removed marginTop: -40 to allow true centering
  },
  emptyIconContainer: {
    width: 120, // Increased size for logo
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff', // White bg for logo
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIconImage: {
    width: 70,
    height: 70,
  },
  emptyGreeting: {
    fontSize: 22, // Slightly larger
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
    paddingRight: 32,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    paddingLeft: 32,
  },
  aiAvatar: {
    width: 30,
    height: 30,
    marginRight: 12,
    marginTop: 2,
  },
  aiIconPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10a37f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  messageBubble: {
    borderRadius: 8,
    maxWidth: '100%',
  },
  userMessageBubble: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 16,
    borderTopRightRadius: 4,
  },
  aiMessageBubble: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  userMessageText: {
    color: '#111827',
  },
  aiMessageText: {
    color: '#374151',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingLeft: 16, // Align with messages
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    gap: 8,
  },
  typingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  headerLogo: {
    width: 30,
    height: 30,
    marginRight: 8,
    borderRadius: 15, // Circular
  },
  aiAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    backgroundColor: '#9269F0',
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

  // Drawer Styles
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFF', // White Sidebar
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  drawerContent: {
    flex: 1,
    padding: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  drawerTitle: {
    color: '#000', // Dark title
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawerItems: {
    flex: 1,
  },
  periodHeader: {
    paddingVertical: 8,
    marginTop: 12,
  },
  periodText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  historyItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  deleteIcon: {
    padding: 8,
  },
  historyText: {
    color: '#1f2937', // Dark text
    fontSize: 14,
    flex: 1,
  },
  // Removed footer styles
});
