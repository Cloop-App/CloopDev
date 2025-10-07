import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { loginUser } from '../../src/client/login/login';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
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
      } catch (e) {}
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}><Text style={styles.logoText}>C</Text></View>
        <Text style={styles.title}>Cloop</Text>
      </View>

      <ScrollView ref={scrollRef} style={styles.chatArea} contentContainerStyle={styles.chatAreaContent}>
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.userMessage : styles.botMessage]}>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>{msg.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputSection}>
        <View style={styles.inputForm}>
          <TextInput
            style={styles.chatInput}
            placeholder="Email or phone..."
            value={input}
            onChangeText={setInput}
            editable={!isLoading}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendIcon}>➤</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.bottomLinkContainer}>
          <TouchableOpacity onPress={() => router.push('/login-sigup/sigup')}>
            <Text style={styles.signupLink}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  logo: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logoText: { color: '#fff', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  chatArea: { flex: 1 },
  chatAreaContent: { padding: 16 },
  messageWrapper: { marginBottom: 12, maxWidth: '80%' },
  userMessage: { alignSelf: 'flex-end' },
  botMessage: { alignSelf: 'flex-start' },
  messageBubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#F3F4F6' },
  messageText: { color: '#111827' },
  inputSection: { padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB' },
  inputForm: { flexDirection: 'row', alignItems: 'center' },
  chatInput: { flex: 1, height: 48, paddingHorizontal: 12, backgroundColor: '#F3F4F6', borderRadius: 999 },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 18, transform: [{ rotate: '90deg' }] },
  bottomLinkContainer: { marginTop: 8, alignItems: 'center' },
  signupLink: { color: '#10B981', fontWeight: '600' },
});
