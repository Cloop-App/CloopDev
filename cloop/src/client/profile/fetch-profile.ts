export interface UserProfile {
  user_id: number;
  name: string;
  email: string;
  grade_level: string;
  board: string;
  subjects: string[];
  preferred_language: string;
  study_goal: string;
  avatar_choice?: string;
  avatar_url?: string;
  num_chats: number;
  num_lessons: number;
  created_at: string;
}

const DEFAULT_BASE = 'http://localhost:4000'

export const fetchUserProfile = async (opts?: { 
  userId?: number; 
  baseUrl?: string; 
  token?: string;
}): Promise<UserProfile> => {
  const base = opts?.baseUrl || process.env.BACKEND_URL || DEFAULT_BASE
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

