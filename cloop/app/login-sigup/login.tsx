import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Image, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: string }>>([
    { id: 1, text: 'Hi! I\u2019m Cloop. Please enter your email or phone number to sign in.', sender: 'bot' }
  ]);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      try {
        // @ts-ignore
        scrollRef.current.scrollToEnd({ animated: true });
      } catch (e) { }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await loginUser({ emailOrPhone: currentInput });
      const userName = res?.user?.name || '';
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

      setTimeout(() => router.push('/home/home'), 800);
    } catch (err) {
      const errorMessageText = err instanceof Error ? err.message : 'An unknown error occurred.';
      const errorMessage = { id: Date.now() + 1, text: `Oh no! ${errorMessageText}`, sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Image source={LOGO_IMG} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Cloop</Text>
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
    backgroundColor: THEME.colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.m,
    paddingBottom: THEME.spacing.m,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: THEME.spacing.s
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text.primary
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
    backgroundColor: THEME.colors.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  messageText: { fontSize: 16, lineHeight: 24 },
  userMessageText: { color: '#FFFFFF' },
  botMessageText: { color: THEME.colors.text.primary },

  inputSection: {
    padding: THEME.spacing.m,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    backgroundColor: '#FFFFFF'
  },
  inputForm: { flexDirection: 'row', alignItems: 'center' },
  chatInput: {
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
    marginLeft: THEME.spacing.s,
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
  bottomLinkContainer: { marginTop: 16, alignItems: 'center' },
  signupLink: { color: THEME.colors.primary, fontWeight: '600', fontSize: 14 },
});
