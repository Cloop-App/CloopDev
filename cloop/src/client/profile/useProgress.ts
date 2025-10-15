import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { progressApiClient, ChatHistoryItem, UserMetrics } from './progress-api-client';

export const useChatHistory = () => {
  const { token, isAuthenticated } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChatHistory = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      progressApiClient.updateToken(token);
      const response = await progressApiClient.getChatHistory();
      setChatHistory(response.chatHistory);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chat history';
      setError(errorMessage);
      console.error('Error fetching chat history:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  return {
    chatHistory,
    loading,
    error,
    refetch: fetchChatHistory
  };
};

export const useUserMetrics = () => {
  const { token, isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      progressApiClient.updateToken(token);
      const metricsData = await progressApiClient.getUserMetrics();
      setMetrics(metricsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
      setError(errorMessage);
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics
  };
};