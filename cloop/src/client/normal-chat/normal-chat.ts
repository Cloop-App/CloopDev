import { API_BASE_URL } from '../../config/api';

export interface NormalChatMessage {
  id: number;
  sender: 'user' | 'ai';
  message?: string;
  file_url?: string;
  file_type?: string;
  created_at: string;
}

export interface NormalChatResponse {
  messages: NormalChatMessage[];
}

export interface SendNormalMessageResponse {
  userMessage: NormalChatMessage;
  aiMessage: NormalChatMessage;
}

/**
 * Fetch normal chat messages for the authenticated user
 */
export const fetchNormalChatMessages = async (
  opts?: { 
    userId?: number; 
    baseUrl?: string; 
    token?: string;
  }
): Promise<NormalChatResponse> => {
  const base = opts?.baseUrl || API_BASE_URL;
  const url = new URL('/api/normal-chat', base);
  
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
    throw new Error(error.error || 'Failed to fetch chat messages');
  }

  return response.json();
};

/**
 * Send a message in normal chat
 */
export const sendNormalChatMessage = async (
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
): Promise<SendNormalMessageResponse> => {
  const base = opts?.baseUrl || API_BASE_URL;
  const url = new URL('/api/normal-chat/message', base);
  
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
 * Clear all normal chat messages for the authenticated user
 */
export const clearNormalChatHistory = async (
  opts?: { 
    userId?: number; 
    baseUrl?: string; 
    token?: string;
  }
): Promise<{ message: string }> => {
  const base = opts?.baseUrl || API_BASE_URL;
  const url = new URL('/api/normal-chat/clear', base);
  
  if (opts?.userId) {
    url.searchParams.set('user_id', String(opts.userId));
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (opts?.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Authentication required - please login again');
    }
    throw new Error(error.error || 'Failed to clear chat history');
  }

  return response.json();
};