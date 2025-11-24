import { UserProfile } from './fetch-profile'
import { API_BASE_URL } from '../../config/api'

export interface UpdateProfilePayload {
  grade_level?: string
  board?: string
  subjects?: string[]
  preferred_language?: string
  study_goal?: string
  avatar_choice?: string
  avatar_url?: string
}

export const updateUserProfile = async (payload: UpdateProfilePayload, opts?: { baseUrl?: string }) => {
  const base = opts?.baseUrl || process.env.BACKEND_URL || API_BASE_URL
  const url = new URL('/api/profile/update', base)

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to update profile')
  }

  const body = await res.json()
  // return the updated user if available
  return body.user as UserProfile
}

