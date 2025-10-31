import { API_BASE_URL } from '../../config/api';

export interface Chapter {
  id: number;
  title: string;
  content?: string;
  created_at: string;
  total_topics: number;
  completed_topics: number;
  completion_percent: number;
  subject_id: number;
  user_id: number;
}

export interface Subject {
  id: number;
  name: string;
  code?: string;
  category?: string;
}

export interface ChaptersResponse {
  subject: Subject;
  chapters: Chapter[];
}

export interface Topic {
  id: number;
  title: string;
  content?: string;
  created_at: string;
  is_completed: boolean;
  completion_percent: number;
  subject_id: number;
  chapter_id: number;
  user_id: number;
  time_spent_seconds?: number;
}

export interface ChapterDetails {
  id: number;
  title: string;
  content?: string;
  created_at: string;
  total_topics: number;
  completed_topics: number;
  completion_percent: number;
  subject: Subject;
}

export interface TopicsResponse {
  chapter: ChapterDetails;
  topics: Topic[];
}

/**
 * Fetch chapters for a specific subject
 */
export const fetchChapters = async (
  subjectId: number,
  opts?: { 
    userId?: number; 
    baseUrl?: string; 
    token?: string;
  }
): Promise<ChaptersResponse> => {
  const base = opts?.baseUrl || API_BASE_URL;
  const url = new URL(`/api/chapters/${subjectId}`, base);
  
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
    throw new Error(error.error || 'Failed to fetch chapters');
  }

  return response.json();
};

/**
 * Fetch topics for a specific chapter
 */
export const fetchTopics = async (
  chapterId: number,
  opts?: { 
    userId?: number; 
    baseUrl?: string; 
    token?: string;
  }
): Promise<TopicsResponse> => {
  const base = opts?.baseUrl || API_BASE_URL;
  const url = new URL(`/api/topics/${chapterId}`, base);
  
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
    throw new Error(error.error || 'Failed to fetch topics');
  }

  return response.json();
};