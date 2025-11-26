import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signupUser, getSignupOptions } from '../../src/client/signup/signup';
import { THEME } from '../../src/constants/theme';

const LOGO_IMG = require('../../assets/images/logo.png');

// Initial questions structure - options will be loaded dynamically
const getQuestionsTemplate = () => [
  { key: 'name', bot: 'Welcome! To get started, what is your full name?', required: true, type: 'text' },
  { key: 'email', bot: 'Great, {name}! What is your email address?', required: true, type: 'text' },
  { key: 'phone', bot: 'Got it. You can enter a phone number, or just press send to skip.', required: false, type: 'text' },
  { key: 'grade_level', bot: 'Which class or grade are you in?', required: true, type: 'single-choice', options: [] },
  { key: 'board', bot: 'Which Board are you studying in?', required: true, type: 'single-choice', options: [] },
  { key: 'subjects', bot: 'Select your subjects.', required: false, type: 'multi-choice', options: [] },
  { key: 'preferred_language', bot: 'What is your preferred language?', required: false, type: 'single-choice', options: [] },
  { key: 'study_goal', bot: 'Finally, what is your main study goal?', required: false, type: 'single-choice', options: ['Better scores', 'Better Knowledge', 'Finish Homework'] },
];

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [questions, setQuestions] = useState(getQuestionsTemplate());
  const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: string; type?: string }>>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [optionsData, setOptionsData] = useState<any>(null); // Store options with IDs
  const scrollRef = useRef<ScrollView | null>(null);

  const isLastQuestion = currentQuestionIndex >= questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  // Load signup options on component mount
  useEffect(() => {
    const loadSignupOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const options = await getSignupOptions();
        setOptionsData(options); // Store the full options data

        const updatedQuestions = getQuestionsTemplate();

        // Update grade_level options: backend now returns an array of grade names (strings)
        const gradeIndex = updatedQuestions.findIndex(q => q.key === 'grade_level');
        if (gradeIndex !== -1) {
          // options.grades may be either string[] (new) or object[] (old). Normalize to string[] for display.
          updatedQuestions[gradeIndex].options = (options.grades || []).map((g: any) => {
            if (typeof g === 'string') return g
            // old shape: { id, level, description }
            if (g.name) return g.name
            const levelPart = g.level !== undefined ? String(g.level) : (g.id !== undefined ? String(g.id) : '')
            return `${levelPart}${g.description ? ` - ${g.description}` : ''}`
          })
        }

        // Update board options
        const boardIndex = updatedQuestions.findIndex(q => q.key === 'board');
        if (boardIndex !== -1) {
          updatedQuestions[boardIndex].options = options.boards.map(board => board.name);
        }

        // Update subjects options
        const subjectIndex = updatedQuestions.findIndex(q => q.key === 'subjects');
        if (subjectIndex !== -1) {
          updatedQuestions[subjectIndex].options = options.subjects.map(subject => subject.name);
        }

        // Update preferred_language options
        const languageIndex = updatedQuestions.findIndex(q => q.key === 'preferred_language');
        if (languageIndex !== -1) {
          updatedQuestions[languageIndex].options = options.languages.map(language => language.name);
        }

        setQuestions(updatedQuestions);
        // Add the first message after options are loaded
        setMessages([{ id: 1, text: updatedQuestions[0].bot, sender: 'bot' }]);
      } catch (error) {
        console.error('Failed to load signup options:', error);
        Alert.alert('Error', 'Failed to load signup options. Please try again.');
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadSignupOptions();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Helper functions to convert display names to IDs (boards, languages, subjects)
  // Note: grades are strings now and we send grade name directly in payload.

  const getBoardId = (boardName: string) => {
    if (!optionsData?.boards) return null;
    const board = optionsData.boards.find((b: any) => b.name === boardName);
    return board?.id || null;
  };

  const getLanguageId = (languageName: string) => {
    if (!optionsData?.languages) return null;
    const language = optionsData.languages.find((l: any) => l.name === languageName);
    return language?.id || null;
  };

  const getSubjectIds = (subjectNames: string[]) => {
    if (!optionsData?.subjects) return [];
    return subjectNames.map(name => {
      const subject = optionsData.subjects.find((s: any) => s.name === name);
      return subject?.id;
    }).filter(id => id !== undefined);
  };

  const addMessage = (text: string, sender: string, type = 'normal') => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender, type }]);
  };

  const proceedToNextQuestion = (newData: Record<string, any>) => {
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);

    if (nextIndex < questions.length) {
      let nextQuestionText = questions[nextIndex].bot;
      if (nextQuestionText.includes('{name}')) {
        const firstName = (newData.name || '').split(' ')[0];
        nextQuestionText = nextQuestionText.replace('{name}', firstName);
      }
      addMessage(nextQuestionText, 'bot');
    } else {
      // All questions answered, now submit
      submitForm(newData);
    }
  };

  const submitForm = async (finalFormData: Record<string, any>) => {
    setIsLoading(true);
    addMessage("Thanks! Creating your account now, please wait...", 'bot');
    try {
      // Build payload and only include fields that have values.
      const payload: any = {
        name: finalFormData.name || '',
        email: finalFormData.email || '',
      };
      if (finalFormData.phone) payload.phone = finalFormData.phone;
      // grade_level is the grade name string now — include only if present
      if (finalFormData.grade_level) payload.grade_level = finalFormData.grade_level;
      if (finalFormData.board) payload.board = getBoardId(finalFormData.board);
      if (finalFormData.subjects) payload.subjects = getSubjectIds(finalFormData.subjects);
      if (finalFormData.preferred_language) payload.preferred_language = getLanguageId(finalFormData.preferred_language);
      if (finalFormData.study_goal) payload.study_goal = finalFormData.study_goal;

      await signupUser(payload as any);
      addMessage('Success! Your account has been created. Please sign in to continue...', 'bot');
      setTimeout(() => router.push('/login-sigup/login'), 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      addMessage(`Signup failed: ${errorMessage}`, 'bot', 'error');
      // Optional: Reset to the first question on failure
      // setCurrentQuestionIndex(0);
      // setMessages([{ id: 1, text: questions[0].bot, sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendText = () => {
    if (isLoading || isLastQuestion) return;
    const trimmedInput = input.trim();

    if (currentQuestion.required && !trimmedInput) {
      addMessage('This field is required, please provide an answer.', 'bot', 'error');
      return;
    }
    if (trimmedInput) addMessage(trimmedInput, 'user');

    const newFormData = { ...formData, [currentQuestion.key]: trimmedInput };
    setFormData(newFormData);
    setInput('');
    proceedToNextQuestion(newFormData);
  };

  const handleOptionPress = (option: string) => {
    if (isLoading) return;
    addMessage(option, 'user');
    const newFormData = { ...formData, [currentQuestion.key]: option };
    setFormData(newFormData);
    proceedToNextQuestion(newFormData);
  };

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleSubjectSubmit = () => {
    if (isLoading) return;
    if (selectedSubjects.length === 0 && currentQuestion.required) {
      Alert.alert("Selection Required", "Please select at least one subject.");
      return;
    }
    const subjectsString = selectedSubjects.join(', ');
    addMessage(subjectsString || "Skipped", 'user');
    const newFormData = { ...formData, [currentQuestion.key]: selectedSubjects };
    setFormData(newFormData);
    setSelectedSubjects([]); // Reset for next time
    proceedToNextQuestion(newFormData);
  };

  const renderCurrentOptions = () => {
    if (isLastQuestion || !currentQuestion || messages[messages.length - 1]?.sender === 'user') {
      return null;
    }

    if (currentQuestion.type === 'single-choice') {
      return (
        <View style={styles.optionsContainer}>
          {currentQuestion.options?.map(option => (
            <TouchableOpacity key={option} style={styles.optionButton} onPress={() => handleOptionPress(option)}>
              <Text style={styles.optionButtonText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (currentQuestion.type === 'multi-choice') {
      return (
        <View>
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map(subject => {
              const isSelected = selectedSubjects.includes(subject);
              return (
                <TouchableOpacity
                  key={subject}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => handleSubjectToggle(subject)}
                >
                  <Text style={[styles.optionButtonText, isSelected && styles.optionButtonTextSelected]}>{subject}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubjectSubmit}>
            <Text style={styles.submitButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Image source={LOGO_IMG} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Create Your Account</Text>
      </View>

      {isLoadingOptions ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading signup options...</Text>
        </View>
      ) : (
        <>
          <ScrollView ref={scrollRef} style={styles.chatArea} contentContainerStyle={styles.chatAreaContent}>
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.userMessage : styles.botMessage]}>
                <View style={[
                  styles.messageBubble,
                  msg.sender === 'user' ? styles.userBubble : styles.botBubble,
                  msg.type === 'error' ? styles.errorBubble : null
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.userMessageText : styles.botMessageText
                  ]}>{msg.text}</Text>
                </View>
              </View>
            ))}
            {renderCurrentOptions()}
            {isLoading && <ActivityIndicator style={{ marginTop: 20 }} size="large" color={THEME.colors.primary} />}
          </ScrollView>

          <View style={[styles.inputSection, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {!isLastQuestion && currentQuestion?.type === 'text' && (
              <View style={styles.inputForm}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Type your answer..."
                  placeholderTextColor={THEME.colors.text.secondary}
                  value={input}
                  onChangeText={setInput}
                  editable={!isLoading}
                  returnKeyType="send"
                  onSubmitEditing={handleSendText}
                />
                <TouchableOpacity
                  style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                  onPress={handleSendText}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="arrow-up" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.bottomLinkContainer}>
              <TouchableOpacity onPress={() => router.push('/login-sigup/login')}>
                <Text style={styles.signinLink}>Already have an account? Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  chatArea: { flex: 1 },
  chatAreaContent: { padding: THEME.spacing.m, paddingBottom: 24 },
  messageWrapper: { marginBottom: 12, maxWidth: '85%' },
  userMessage: { alignSelf: 'flex-end' },
  botMessage: { alignSelf: 'flex-start' },
  messageBubble: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20 },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  userBubble: {
    backgroundColor: THEME.colors.primary,
    borderBottomRightRadius: 4
  },
  errorBubble: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  messageText: { fontSize: 16, lineHeight: 24 },
  botMessageText: { color: THEME.colors.text.primary },
  userMessageText: { color: '#FFFFFF' },

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
    fontSize: 16,
    color: THEME.colors.text.primary,
    marginRight: 8,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  signinLink: { color: THEME.colors.primary, fontWeight: '600', fontSize: 14 },

  optionsContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  optionButtonText: {
    color: THEME.colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});