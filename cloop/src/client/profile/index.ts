// Export all user profile related APIs and hooks
export * from './user-info';
export * from './user-api-client';
export * from './useUserProfile';
export * from './user-utils';

// For backward compatibility, also export from the original fetch-profile
export { fetchUserProfile as fetchUserProfileLegacy, UserProfile as UserProfileLegacy } from './fetch-profile';