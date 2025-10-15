import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native';
import {
  generateContentForSubject,
  generateContentForAllSubjects,
  getAllGenerationStatuses,
  checkGenerationStatus,
  resetGeneration,
  GenerationStatus,
} from '../../src/client/content-generation/content-generation';
import { useAuth } from '../../src/context/AuthContext';

interface SubjectStatus {
  subjectId: number;
  subjectName: string;
  status: GenerationStatus | null;
  loading: boolean;
}

export default function ContentGenerationScreen() {
  const { user, token } = useAuth();
  const [statuses, setStatuses] = useState<SubjectStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  useEffect(() => {
    if (user?.user_id && token) {
      loadStatuses();
    }
  }, [user, token]);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      if (!user?.user_id || !token) return;

      const response = await getAllGenerationStatuses(user.user_id, token);
      
      // Map statuses to subjects
      const subjectStatuses: SubjectStatus[] = user.subjects?.map((subjectCode: string) => {
        const status = response.data.find(
          (s) => s.subject_id === getSubjectIdByCode(subjectCode)
        );
        return {
          subjectId: getSubjectIdByCode(subjectCode),
          subjectName: subjectCode,
          status: status || null,
          loading: false,
        };
      }) || [];

      setStatuses(subjectStatuses);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSubject = async (subjectId: number, index: number) => {
    try {
      if (!user?.user_id || !token) return;

      // Update loading state for this subject
      setStatuses((prev) =>
        prev.map((s, i) => (i === index ? { ...s, loading: true } : s))
      );

      await generateContentForSubject(user.user_id, subjectId, token);

      // Poll for status updates
      pollSubjectStatus(subjectId, index);
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setStatuses((prev) =>
        prev.map((s, i) => (i === index ? { ...s, loading: false } : s))
      );
    }
  };

  const pollSubjectStatus = async (subjectId: number, index: number) => {
    if (!user?.user_id || !token) return;

    const interval = setInterval(async () => {
      try {
        const response = await checkGenerationStatus(user.user_id!, subjectId, token!);

        if (response.exists && response.status) {
          setStatuses((prev) =>
            prev.map((s, i) =>
              i === index
                ? {
                    ...s,
                    status: response.status!,
                    loading: response.status!.status === 'in_progress',
                  }
                : s
            )
          );

          if (
            response.status.status === 'completed' ||
            response.status.status === 'failed'
          ) {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(interval);
      }
    }, 5000);

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleGenerateAll = async () => {
    try {
      if (!user?.user_id || !token) return;

      Alert.alert(
        'Generate All Content',
        'This will generate chapters and topics for all your subjects. This may take several minutes. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            onPress: async () => {
              setGeneratingAll(true);
              await generateContentForAllSubjects(user.user_id!, token);
              
              // Start polling for all subjects
              statuses.forEach((_, index) => {
                const subjectId = statuses[index].subjectId;
                pollSubjectStatus(subjectId, index);
              });

              Alert.alert(
                'Success',
                'Content generation started. This will take a few minutes. You can monitor progress here.'
              );
              setGeneratingAll(false);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setGeneratingAll(false);
    }
  };

  const handleReset = async (subjectId: number, index: number) => {
    try {
      if (!user?.user_id || !token) return;

      Alert.alert(
        'Reset Content',
        'This will delete all generated chapters and topics for this subject. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: async () => {
              await resetGeneration(user.user_id!, subjectId, token);
              await loadStatuses();
              Alert.alert('Success', 'Content reset successfully');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓ Completed';
      case 'in_progress':
        return '⏳ In Progress';
      case 'failed':
        return '✗ Failed';
      default:
        return 'Not Started';
    }
  };

  // Helper function (you'll need to implement based on your data structure)
  const getSubjectIdByCode = (code: string): number => {
    // This should query your subjects data
    // For now, returning a placeholder
    return 0;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading content status...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Content Generation</Text>
        <Text style={styles.subtitle}>
          Generate personalized chapters and topics for your subjects
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.generateAllButton, generatingAll && styles.disabledButton]}
        onPress={handleGenerateAll}
        disabled={generatingAll}
      >
        {generatingAll ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.generateAllButtonText}>Generate All Subjects</Text>
        )}
      </TouchableOpacity>

      <View style={styles.subjectsContainer}>
        <Text style={styles.sectionTitle}>Subjects</Text>

        {statuses.map((subject, index) => (
          <View key={index} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{subject.subjectName}</Text>
              {subject.status && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(subject.status.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(subject.status.status)}
                  </Text>
                </View>
              )}
            </View>

            {subject.status && (
              <View style={styles.statusDetails}>
                <Text style={styles.statusDetailText}>
                  Chapters: {subject.status.chapters_generated ? '✓' : '✗'}
                </Text>
                <Text style={styles.statusDetailText}>
                  Topics: {subject.status.topics_generated ? '✓' : '✗'}
                </Text>
              </View>
            )}

            {subject.status?.error_message && (
              <Text style={styles.errorText}>{subject.status.error_message}</Text>
            )}

            <View style={styles.buttonRow}>
              {!subject.status || subject.status.status === 'pending' ? (
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => handleGenerateSubject(subject.subjectId, index)}
                  disabled={subject.loading}
                >
                  {subject.loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Generate</Text>
                  )}
                </TouchableOpacity>
              ) : subject.status.status === 'in_progress' ? (
                <View style={styles.progressContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.progressText}>Generating...</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => handleReset(subject.subjectId, index)}
                  >
                    <Text style={styles.secondaryButtonText}>Reset</Text>
                  </TouchableOpacity>

                  {subject.status.status === 'failed' && (
                    <TouchableOpacity
                      style={[styles.button, styles.primaryButton]}
                      onPress={() => handleGenerateSubject(subject.subjectId, index)}
                    >
                      <Text style={styles.buttonText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  generateAllButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateAllButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subjectsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  subjectCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statusDetails: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 15,
  },
  statusDetailText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#007AFF',
  },
});
