import { API_BASE_URL } from '../../config/api';

export interface UserBasicInfo {
  user_id: number;
  name: string;
  email: string;
  created_at: string;
  avatar_url?: string;
  avatar_choice?: string;
  phone?: string;
}

export interface UserSubject {
  id: number;
  subject_id: number;
  total_chapters: number;
  completed_chapters: number;
  completion_percent: number;
  created_at: string;
  subject: {
    id: number;
    name: string;
    code?: string;
    category?: string;
  };
}

export interface UserAcademicInfo {
  user_id: number;
  grade_level: string;
  board: string;
  subjects: string[]; // Keep for backward compatibility
  user_subjects: UserSubject[]; // New field for subject details
  preferred_language: string;
  study_goal: string;
}

export interface UserProgressInfo {
  user_id: number;
  num_chats: number;
  num_lessons: number;
}

export interface UserProfile extends UserBasicInfo, UserAcademicInfo, UserProgressInfo {}

/**
 * Fetch complete user profile data
 */
export const fetchUserProfile = async (opts?: { 
  userId?: number; 
  baseUrl?: string; 
  token?: string;
}): Promise<UserProfile> => {
  const base = opts?.baseUrl || API_BASE_URL
  const url = new URL('/api/profile', base)
  if (opts?.userId) url.searchParams.set('user_id', String(opts.userId))

  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (opts?.token) {
    headers.Authorization = `Bearer ${opts.token}`
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch profile')
  }

  return response.json()
}

/**
 * Fetch user's basic information (name, email, avatar, etc.)
 */
export const fetchUserBasicInfo = async (opts?: { 
  userId?: number; 
  baseUrl?: string; 
  token?: string;
}): Promise<UserBasicInfo> => {
  const profile = await fetchUserProfile(opts)
  return {
    user_id: profile.user_id,
    name: profile.name,
    email: profile.email,
    created_at: profile.created_at,
    avatar_url: profile.avatar_url,
    avatar_choice: profile.avatar_choice,
    phone: profile.phone,
  }
}

/**
 * Fetch user's academic information (board, grade, subjects)
 */
export const fetchUserAcademicInfo = async (opts?: { 
  userId?: number; 
  baseUrl?: string; 
  token?: string;
}): Promise<UserAcademicInfo> => {
  const profile = await fetchUserProfile(opts)
  return {
    user_id: profile.user_id,
    grade_level: profile.grade_level,
    board: profile.board,
    subjects: profile.subjects,
    user_subjects: profile.user_subjects || [],
    preferred_language: profile.preferred_language,
    study_goal: profile.study_goal,
  }
}

/**
 * Fetch user's progress information (chats, lessons)
 */
export const fetchUserProgressInfo = async (opts?: { 
  userId?: number; 
  baseUrl?: string; 
  token?: string;
}): Promise<UserProgressInfo> => {
  const profile = await fetchUserProfile(opts)
  return {
    user_id: profile.user_id,
    num_chats: profile.num_chats,
    num_lessons: profile.num_lessons,
  }
}

/**
 * Fetch user's board information
 */
export const fetchUserBoard = async (opts?: { 
  userId?: number; 
  baseUrl?: string; 
  token?: string;
}): Promise<{ board: string; grade_level: string }> => {
  const profile = await fetchUserProfile(opts)
  return {
    board: profile.board,
    grade_level: profile.grade_level,
  }
}

/**
 * Fetch user's selected subjects
 */
export const fetchUserSubjects = async (opts?: { 
  userId?: number; 
  baseUrl?: string; 
  token?: string;
}): Promise<{ subjects: string[]; preferred_language: string; user_subjects: UserSubject[] }> => {
  const profile = await fetchUserProfile(opts)
  return {
    subjects: profile.subjects,
    user_subjects: profile.user_subjects || [],
    preferred_language: profile.preferred_language,
  }
}

/**
 * Fetch user's study preferences
 */
export const fetchUserStudyPreferences = async (opts?: { 
  userId?: number; 
  baseUrl?: string; 
  token?: string;
}): Promise<{ 
  board: string; 
  grade_level: string; 
  subjects: string[]; 
  user_subjects: UserSubject[];
  preferred_language: string; 
  study_goal: string; 
}> => {
  const profile = await fetchUserProfile(opts)
  return {
    board: profile.board,
    grade_level: profile.grade_level,
    subjects: profile.subjects,
    user_subjects: profile.user_subjects || [],
    preferred_language: profile.preferred_language,
    study_goal: profile.study_goal,
  }
}