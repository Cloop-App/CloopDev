import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Image, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TypingIndicator from '../../components/chat/TypingIndicator';
import { loginUser } from '../../src/client/login/login';
import { useAuth } from '../../src/context/AuthContext';
import { THEME } from '../../src/constants/theme';

const LOGO_IMG = require('../../assets/images/logo.png');

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: string }>>([]);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      setMessages([
        { id: 1, text: 'Hi! I\u2019m Cloop. Please enter your email or phone number to sign in.', sender: 'bot' }
      ]);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      try {
        // @ts-ignore
        scrollRef.current.scrollToEnd({ animated: true });
      } catch (e) { }
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Show typing indicator before bot response
    setIsTyping(true);

    try {
      const res = await loginUser({ emailOrPhone: currentInput });
      const userName = res?.user?.name || '';

      // Simulate typing delay
      setTimeout(async () => {
        setIsTyping(false);
        const successMessage = { id: Date.now() + 1, text: `Great${userName ? `, ${userName}` : ''}! Logging you in...`, sender: 'bot' };
        setMessages(prev => [...prev, successMessage]);

        // Store authentication data - ensure we have a valid token
        if (res.user) {
          const token = res.token || null;
          if (!token) {
            throw new Error('No authentication token received from server');
          }
          await login(token, res.user);
        }

        // Navigate after showing the success message
        setTimeout(() => router.push('/home/home'), 1500);

      }, 1500);

    } catch (err) {
      const errorMessageText = err instanceof Error ? err.message : 'An unknown error occurred.';

      setTimeout(() => {
        setIsTyping(false);
        // Professional error message
        const errorMessage = { id: Date.now() + 1, text: `We encountered a problem: ${errorMessageText}`, sender: 'bot' };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
      }, 1500);
    }
    // Note: isLoading is handled inside the timeouts or after navigation triggers
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Log In</Text>
      </View>

      <ScrollView ref={scrollRef} style={styles.chatArea} contentContainerStyle={styles.chatAreaContent}>
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.userMessage : styles.botMessage]}>
            <View style={[
              styles.messageBubble,
              msg.sender === 'user' ? styles.userBubble : styles.botBubble
            ]}>
              <Text style={[
                styles.messageText,
                msg.sender === 'user' ? styles.userMessageText : styles.botMessageText
              ]}>{msg.text}</Text>
            </View>
          </View>
        ))}
        {isTyping && (
          <View style={[styles.messageWrapper, styles.botMessage]}>
            <TypingIndicator backgroundColor="#d8bff0ff" borderColor="transparent" />
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputSection, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.inputForm}>
          <TextInput
            style={styles.chatInput}
            placeholder="Email or phone..."
            placeholderTextColor={THEME.colors.text.secondary}
            value={input}
            onChangeText={setInput}
            editable={!isLoading}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="arrow-up" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.bottomLinkContainer}>
          <TouchableOpacity onPress={() => router.push('/login-sigup/sigup')}>
            <Text style={styles.signupLink}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.m,
    paddingBottom: THEME.spacing.m,
    backgroundColor: '#8B5CF6',
    borderBottomWidth: 0,
  },
  backButton: {
    marginRight: THEME.spacing.s,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: THEME.spacing.s
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  chatArea: { flex: 1 },
  chatAreaContent: { padding: THEME.spacing.m },
  messageWrapper: { marginBottom: THEME.spacing.m, maxWidth: '80%' },
  userMessage: { alignSelf: 'flex-end' },
  botMessage: { alignSelf: 'flex-start' },
  messageBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20
  },
  userBubble: {
    backgroundColor: '#A78BFA',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#E9D5FF',
    borderBottomLeftRadius: 4,
    borderWidth: 0,
  },
  messageText: { fontSize: 16, lineHeight: 24 },
  userMessageText: { color: '#FFFFFF' },
  botMessageText: { color: '#4A148C' },

  inputSection: {
    padding: THEME.spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF'
  },
  inputForm: { flexDirection: 'row', alignItems: 'center' },
  chatInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#000000',
    fontSize: 16,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: THEME.spacing.s,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  bottomLinkContainer: { marginTop: 16, alignItems: 'center' },
  signupLink: { color: '#8B5CF6', fontWeight: '600', fontSize: 14 },
});
