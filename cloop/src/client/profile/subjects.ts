import { API_BASE_URL } from '../../config/api';

export interface Subject {
  id: number;
  code: string;
  name: string;
  category: string;
}

export interface UserSubjectResponse {
  id: number;
  subject_id: number;
  total_chapters: number;
  completed_chapters: number;
  completion_percent: number;
  created_at: string;
  subject: Subject;
}

/**
 * Fetch all available subjects
 */
export const fetchAllSubjects = async (opts?: {
  baseUrl?: string;
  token?: string;
}): Promise<Subject[]> => {
  const base = opts?.baseUrl || API_BASE_URL;
  const url = new URL('/api/signup/options', base);

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
    throw new Error(error.error || 'Failed to fetch subjects');
  }

  const data = await response.json();
  return data.subjects;
};

/**
 * Add a new subject to user profile
 */
export const addUserSubject = async (
  subjectId: number,
  opts?: {
    baseUrl?: string;
    token?: string;
    userId?: number;
  }
): Promise<UserSubjectResponse> => {
  const base = opts?.baseUrl || API_BASE_URL;
  const url = new URL('/api/profile/add-subject', base);

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (opts?.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  const body: any = { subject_id: subjectId };
  if (opts?.userId) {
    body.user_id = opts.userId;
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to add subject');
  }

  return response.json();
};

/**
 * Remove a subject from user profile
 */
export const removeUserSubject = async (
  subjectId: number,
  opts?: {
    baseUrl?: string;
    token?: string;
    userId?: number;
  }
): Promise<{ success: boolean }> => {
  const base = opts?.baseUrl || API_BASE_URL;
  const url = new URL('/api/profile/remove-subject', base);

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (opts?.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  const body: any = { subject_id: subjectId };
  if (opts?.userId) {
    body.user_id = opts.userId;
  }

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to remove subject');
  }

  return response.json();
};

/**
 * Get available subjects that user hasn't selected yet
 */
export const getAvailableSubjects = async (
  userSubjects: UserSubjectResponse[],
  opts?: {
    baseUrl?: string;
    token?: string;
  }
): Promise<Subject[]> => {
  const allSubjects = await fetchAllSubjects(opts);
  const userSubjectIds = userSubjects.map(us => us.subject_id);
  
  return allSubjects.filter(subject => !userSubjectIds.includes(subject.id));
};