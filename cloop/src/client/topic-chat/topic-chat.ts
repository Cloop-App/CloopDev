import { API_BASE_URL } from '../../config/api';

export interface TopicChatMessage {
  id: number;
  sender: 'user' | 'ai';
  message?: string;
  message_type?: string; // text, options, formula, video, session_summary
  options?: string[];
  diff_html?: string;
  emoji?: string; // NEW: Emoji engagement feedback
  file_url?: string;
  file_type?: string;
  created_at: string;
  // NEW: Feedback fields for error correction
  feedback?: {
    is_correct: boolean;
    emoji?: string;
    bubble_color?: 'green' | 'red' | 'yellow';
    praise?: string;
    corrected_answer?: string;
    diff_html?: string;
    explanation?: string;
    error_type?: string;
    score_percent?: number;
  };
  // NEW: Session summary for end-of-session reports
  session_summary?: {
    total_questions: number;
    correct_answers: number;
    incorrect_answers: number;
    star_rating: number; // 1-3 stars
    error_types: Record<string, number>;
    learning_gaps: string[];
    recommendations: string[];
    performance_percent: number;
  };
  session_metrics?: any; // NEW: Backend sometimes sends this instead of session_summary
}

export interface TopicGoal {
  id: number;
  title: string;
  description?: string;
  order?: number;
  // backend now returns chat_goal_progress
  chat_goal_progress?: Array<{
    score_percent?: number;
    is_completed?: boolean;
    num_questions?: number;
    num_correct?: number;
    created_at?: string;
  }>;
}

export interface TopicChatDetails {
  id: number;
  title: string;
  content?: string;
  is_completed: boolean;
  completion_percent: number;
  time_spent_seconds?: number; // NEW: Track time spent on topic
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
  goals: TopicGoal[];
  rawProcesses?: Array<{
    id: number;
    chat_id: number;
    user_message: string;
    corrected_message?: string | null;
    ai_response?: string | null;
    feedback?: any;
    created_at?: string;
    updated_at?: string;
  }>
  initialGreeting?: Array<{
    message: string;
    message_type: string;
    options?: string[];
  }> | null;
}

export interface SendMessageResponse {
  userMessage: TopicChatMessage;
  aiMessages: TopicChatMessage[];
  // Backwards-compatible alias: some code expects `messages`
  messages?: TopicChatMessage[];
  // NEW: Enhanced feedback with error correction
  feedback?: {
    is_correct: boolean;
    emoji?: string;
    bubble_color?: 'green' | 'red' | 'yellow';
    praise?: string;
    corrected_answer?: string;
    diff_html?: string;
    explanation?: string;
    error_type?: string;
    score_percent?: number;
  } | null;
  // If AI performed an explicit correction to the user's answer
  userCorrection?: {
    message_type?: string;
    diff_html?: string;
    complete_answer?: string;
    options?: string[];
    feedback?: {
      is_correct?: boolean;
      bubble_color?: 'green' | 'red' | 'yellow';
      error_type?: string;
      score_percent?: number;
      explanation?: string;
    } | null;
  } | null;
  // NEW: Session summary when session ends
  session_summary?: {
    total_questions: number;
    correct_answers: number;
    incorrect_answers: number;
    star_rating: number;
    error_types: Record<string, number>;
    learning_gaps: string[];
    recommendations: string[];
    performance_percent: number;
  } | null;
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
    session_time_seconds?: number;
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