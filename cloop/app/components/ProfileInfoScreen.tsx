import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { updateUserProfile } from '../../src/client/profile/update-profile';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'English', 'Hindi',
  'Computer Science', 'Economics'
];

const AVATARS = [
  { id: 'student1', label: 'Student 1' },
  { id: 'student2', label: 'Student 2' },
  { id: 'teacher1', label: 'Teacher 1' },
  { id: 'scientist1', label: 'Scientist' },
];

export default function ProfileInfoScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    grade_level: '',
    board: '',
    subjects: [] as string[],
    preferred_language: '',
    study_goal: '',
    avatar_choice: '',
  });

  const updateField = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubjectToggle = (subject: string) => {
    setProfileData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (step < 6) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const validateCurrentStep = () => {
    switch (step) {
      case 1:
        if (!profileData.grade_level) {
          Alert.alert('Required', 'Please enter your class/grade');
          return false;
        }
        break;
      case 2:
        if (!profileData.board) {
          Alert.alert('Required', 'Please select your board');
          return false;
        }
        break;
      case 3:
        if (profileData.subjects.length === 0) {
          Alert.alert('Required', 'Please select at least one subject');
          return false;
        }
        break;
      case 4:
        if (!profileData.preferred_language) {
          Alert.alert('Required', 'Please select your preferred language');
          return false;
        }
        break;
      case 5:
        if (!profileData.study_goal) {
          Alert.alert('Required', 'Please enter your study goal');
          return false;
        }
        break;
      case 6:
        if (!profileData.avatar_choice) {
          Alert.alert('Required', 'Please select an avatar');
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      await updateUserProfile(profileData);
      Alert.alert(
        'Profile Complete!',
        `Great! You're in Class ${profileData.grade_level}, ${profileData.board} board, learning ${profileData.subjects.join(', ')}, in ${profileData.preferred_language}, aiming for ${profileData.study_goal}.`,
        [
          {
            text: 'Start Learning',
            onPress: () => router.replace('../home/home')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Which class are you in?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 8th, 9th, 12th"
              value={profileData.grade_level}
              onChangeText={(text) => updateField('grade_level', text)}
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Which board do you follow?</Text>
            {['CBSE', 'ICSE', 'State', 'IB', 'Other'].map((board) => (
              <TouchableOpacity
                key={board}
                style={[
                  styles.optionButton,
                  profileData.board === board && styles.selectedOption
                ]}
                onPress={() => updateField('board', board)}
              >
                <Text style={[
                  styles.optionText,
                  profileData.board === board && styles.selectedOptionText
                ]}>{board}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Which subjects would you like to study?</Text>
            <View style={styles.subjectsGrid}>
              {SUBJECTS.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.subjectChip,
                    profileData.subjects.includes(subject) && styles.selectedOption
                  ]}
                  onPress={() => handleSubjectToggle(subject)}
                >
                  <Text style={[
                    styles.chipText,
                    profileData.subjects.includes(subject) && styles.selectedOptionText
                  ]}>{subject}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What's your preferred language?</Text>
            {['English', 'Hindi', 'Both'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.optionButton,
                  profileData.preferred_language === lang && styles.selectedOption
                ]}
                onPress={() => updateField('preferred_language', lang)}
              >
                <Text style={[
                  styles.optionText,
                  profileData.preferred_language === lang && styles.selectedOptionText
                ]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What's your study goal?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., exam prep, concept clarity, practice"
              value={profileData.study_goal}
              onChangeText={(text) => updateField('study_goal', text)}
              multiline
            />
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Choose your avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    profileData.avatar_choice === avatar.id && styles.selectedAvatar
                  ]}
                  onPress={() => updateField('avatar_choice', avatar.id)}
                >
                  <Text style={styles.avatarText}>{avatar.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container}>
  <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: `${(step / 6) * 100}%` }]} />
        </View>
        <Text style={styles.stepText}>Step {step} of 6</Text>
      </View>

      {renderStep()}

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>
          {step === 6 ? 'Complete Profile' : 'Next'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progress: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  stepText: {
    color: '#6B7280',
    fontSize: 14,
  },
  stepContainer: {
    marginBottom: 30,
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  selectedOption: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  optionText: {
    fontSize: 16,
    color: '#4B5563',
  },
  selectedOptionText: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  subjectChip: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 10,
    margin: 5,
    backgroundColor: '#F9FAFB',
  },
  chipText: {
    fontSize: 14,
    color: '#4B5563',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarOption: {
    width: '48%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  selectedAvatar: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  avatarText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  nextButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});