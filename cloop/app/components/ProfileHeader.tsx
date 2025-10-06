import React from 'react'

// No-op profile header to disable the top header across the app.
// Keep this module present so any imports don't break; it intentionally renders nothing.
export function ProfileHeader(_: { name?: string; avatarUrl?: string }) {
  return null
}

export default ProfileHeader