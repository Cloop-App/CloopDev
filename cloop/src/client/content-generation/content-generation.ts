/**
 * Content Generation API Client
 * Frontend interface for the AI content generation pipeline
 */

import { API_BASE_URL } from '../../config/api';

export interface GenerationStatus {
  id: number;
  user_id: number;
  subject_id: number;
  grade_level: string;
  board: string;
  chapters_generated: boolean;
  topics_generated: boolean;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationResult {
  success: boolean;
  message: string;
  chaptersCount?: number;
  data?: any;
}

export interface StatusResponse {
  exists: boolean;
  status?: GenerationStatus;
  message?: string;
}

/**
 * Generate content for a single subject
 */
export async function generateContentForSubject(
  userId: number,
  subjectId: number,
  token: string
): Promise<GenerationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/content-generation/generate-subject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, subjectId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate content');
    }

    return data;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}

/**
 * Generate content for all user subjects
 */
export async function generateContentForAllSubjects(
  userId: number,
  token: string
): Promise<GenerationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/content-generation/generate-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to start content generation');
    }

    return data;
  } catch (error) {
    console.error('Error generating content for all subjects:', error);
    throw error;
  }
}

/**
 * Check generation status for a specific subject
 */
export async function checkGenerationStatus(
  userId: number,
  subjectId: number,
  token: string
): Promise<StatusResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/content-generation/status/${userId}/${subjectId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to check status');
    }

    return data;
  } catch (error) {
    console.error('Error checking generation status:', error);
    throw error;
  }
}

/**
 * Get all generation statuses for a user
 */
export async function getAllGenerationStatuses(
  userId: number,
  token: string
): Promise<{ success: boolean; data: GenerationStatus[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/content-generation/status/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch statuses');
    }

    return data;
  } catch (error) {
    console.error('Error fetching all statuses:', error);
    throw error;
  }
}

/**
 * Reset/retry generation for a subject
 */
export async function resetGeneration(
  userId: number,
  subjectId: number,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/content-generation/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, subjectId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset generation');
    }

    return data;
  } catch (error) {
    console.error('Error resetting generation:', error);
    throw error;
  }
}

/**
 * Poll generation status until completion
 * @param userId User ID
 * @param subjectId Subject ID
 * @param token Auth token
 * @param onProgress Callback for progress updates
 * @param interval Poll interval in ms (default: 5000)
 * @param maxAttempts Max polling attempts (default: 60)
 */
export async function pollGenerationStatus(
  userId: number,
  subjectId: number,
  token: string,
  onProgress?: (status: GenerationStatus) => void,
  interval: number = 5000,
  maxAttempts: number = 60
): Promise<GenerationStatus> {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        attempts++;

        if (attempts > maxAttempts) {
          reject(new Error('Max polling attempts reached'));
          return;
        }

        const response = await checkGenerationStatus(userId, subjectId, token);

        if (response.exists && response.status) {
          const status = response.status;

          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed') {
            resolve(status);
            return;
          }

          if (status.status === 'failed') {
            reject(new Error(status.error_message || 'Generation failed'));
            return;
          }

          // Continue polling
          setTimeout(poll, interval);
        } else {
          // Not started yet, continue polling
          setTimeout(poll, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

/**
 * Hook for React components to manage content generation
 */
export function useContentGeneration() {
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<GenerationStatus | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const generateContent = async (userId: number, subjectId: number, token: string) => {
    try {
      setLoading(true);
      setError(null);

      // Start generation
      await generateContentForSubject(userId, subjectId, token);

      // Poll for completion
      const finalStatus = await pollGenerationStatus(
        userId,
        subjectId,
        token,
        (progressStatus) => {
          setStatus(progressStatus);
        }
      );

      setStatus(finalStatus);
      return finalStatus;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = async (userId: number, subjectId: number, token: string) => {
    try {
      setLoading(true);
      setError(null);
      await resetGeneration(userId, subjectId, token);
      setStatus(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    status,
    error,
    generateContent,
    reset,
  };
}

// React import for the hook
import * as React from 'react';
