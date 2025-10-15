import { API_BASE_URL } from '../../config/api';

export interface TopicChatMessage {
  id: number;
  sender: 'user' | 'ai';
  message?: string;
  file_url?: string;
  file_type?: string;
  created_at: string;
}

export interface TopicChatDetails {
  id: number;
  title: string;
  content?: string;
  is_completed: boolean;
  completion_percent: number;
  chapter: {
    id: number;
    title: string;
    subject_id: number;
  };
  subject: {
    id: number;
    name: string;
    code?: string;
  };
}

export interface TopicChatResponse {
  topic: TopicChatDetails;
  messages: TopicChatMessage[];
}

export interface SendMessageResponse {
  userMessage: TopicChatMessage;
  aiMessage: TopicChatMessage;
}

/**
 * Fetch chat messages for a specific topic
 */
export const fetchTopicChatMessages = async (
  topicId: number,
  opts?: { 
    userId?: number; 
    baseUrl?: string; 
    token?: string;
  }
): Promise<TopicChatResponse> => {
  const base = opts?.baseUrl || API_BASE_URL;
  const url = new URL(`/api/topic-chats/${topicId}`, base);
  
  if (opts?.userId) {
    url.searchParams.set('user_id', String(opts.userId));
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (opts?.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Authentication required - please login again');
    }
    throw new Error(error.error || 'Failed to fetch topic chat messages');
  }

  return response.json();
};

/**
 * Send a message in topic chat
 */
export const sendTopicChatMessage = async (
  topicId: number,
  messageData: {
    message?: string;
    file_url?: string;
    file_type?: string;
  },
  opts?: { 
    userId?: number; 
    baseUrl?: string; 
    token?: string;
  }
): Promise<SendMessageResponse> => {
  const base = opts?.baseUrl || API_BASE_URL;
  const url = new URL(`/api/topic-chats/${topicId}/message`, base);
  
  if (opts?.userId) {
    url.searchParams.set('user_id', String(opts.userId));
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (opts?.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(messageData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Authentication required - please login again');
    }
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
};

/**
 * Upload a file (placeholder for actual file upload implementation)
 */
export const uploadFile = async (
  file: any,
  opts?: { 
    baseUrl?: string; 
    token?: string;
  }
): Promise<{ file_url: string; file_type: string }> => {
  // This is a placeholder implementation
  // In a real app, you would upload to a file storage service
  // and return the URL and type
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        file_url: `https://example.com/uploads/${Date.now()}_${file.name}`,
        file_type: file.type || 'image/jpeg'
      });
    }, 1000);
  });
};