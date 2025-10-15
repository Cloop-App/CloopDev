import { API_BASE_URL } from '../../config/api';

export interface ChatHistoryItem {
  topic_id: number;
  title: string;
  subject: string;
  chapter: string;
  last_activity: string;
}

export interface UserMetrics {
  overview: {
    total_subjects: number;
    completed_subjects: number;
    total_chapters: number;
    completed_chapters: number;
    total_topics_completed: number;
    overall_progress: number;
  };
  subject_progress: Array<{
    subject: {
      id: number;
      name: string;
      code: string;
    };
    total_chapters: number;
    completed_chapters: number;
    completion_percent: number;
    topics_completed: number;
  }>;
  strong_topics: Array<{
    id: number;
    title: string;
    subject: string;
    chapter: string;
    completion_percent: number;
  }>;
  weak_topics: Array<{
    id: number;
    title: string;
    subject: string;
    chapter: string;
    chat_count: number;
  }>;
  activity: {
    total_chat_sessions: number;
    most_active_topics: Array<{
      id: number;
      title: string;
      subject: string;
      chat_count: number;
    }>;
  };
}

class ProgressApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  updateToken(token: string) {
    this.token = token;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getChatHistory(): Promise<{ chatHistory: ChatHistoryItem[] }> {
    return this.makeRequest<{ chatHistory: ChatHistoryItem[] }>('/api/profile/chat-history');
  }

  async getUserMetrics(): Promise<UserMetrics> {
    return this.makeRequest<UserMetrics>('/api/profile/metrics');
  }
}

export const progressApiClient = new ProgressApiClient();