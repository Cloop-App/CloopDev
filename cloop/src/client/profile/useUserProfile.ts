import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  UserProfile, 
  UserBasicInfo, 
  UserAcademicInfo, 
  UserProgressInfo,
  userApiClient 
} from './user-api-client';

export interface UseUserProfileResult {
  profile: UserProfile | null;
  academicInfo: UserAcademicInfo | null;
  progressInfo: UserProgressInfo | null;
  basicInfo: UserBasicInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isProfileComplete: boolean;
  missingFields: string[];
}

/**
 * Custom hook for managing user profile data
 */
export const useUserProfile = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [academicInfo, setAcademicInfo] = useState<UserAcademicInfo | null>(null);
  const [progressInfo, setProgressInfo] = useState<UserProgressInfo | null>(null);
  const [basicInfo, setBasicInfo] = useState<UserBasicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const fetchUserData = useCallback(async () => {
    if (!isAuthenticated || !user || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update API client with current user info
      userApiClient.updateOptions({
        userId: user.user_id,
        token: token
      });

      // Fetch all user data in parallel
      const [
        profileData,
        academicData,
        progressData,
        basicData,
        profileCompleteness
      ] = await Promise.all([
        userApiClient.getProfile(),
        userApiClient.getAcademicInfo(),
        userApiClient.getProgressInfo(),
        userApiClient.getBasicInfo(),
        userApiClient.isProfileComplete()
      ]);

      setProfile(profileData);
      setAcademicInfo(academicData);
      setProgressInfo(progressData);
      setBasicInfo(basicData);
      setIsProfileComplete(profileCompleteness.isComplete);
      setMissingFields(profileCompleteness.missingFields);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
      setError(errorMessage);
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, token]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    profile,
    academicInfo,
    progressInfo,
    basicInfo,
    loading,
    error,
    refetch: fetchUserData,
    isProfileComplete,
    missingFields
  };
};

/**
 * Hook for fetching specific user data fields
 */
export const useUserData = <T extends keyof UserProfile>(fields: T[]) => {
  const { user, token, isAuthenticated } = useAuth();
  const [data, setData] = useState<Pick<UserProfile, T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      userApiClient.updateOptions({
        userId: user.user_id,
        token: token
      });

      const result = await userApiClient.getSpecificFields(fields);
      setData(result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
      setError(errorMessage);
      console.error('Error fetching specific user data:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, token, fields]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook for user's academic information only
 */
export const useUserAcademicInfo = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [academicInfo, setAcademicInfo] = useState<UserAcademicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAcademicInfo = useCallback(async () => {
    if (!isAuthenticated || !user || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      userApiClient.updateOptions({
        userId: user.user_id,
        token: token
      });

      const data = await userApiClient.getAcademicInfo();
      setAcademicInfo(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch academic info';
      setError(errorMessage);
      console.error('Error fetching academic info:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, token]);

  useEffect(() => {
    fetchAcademicInfo();
  }, [fetchAcademicInfo]);

  return {
    academicInfo,
    loading,
    error,
    refetch: fetchAcademicInfo
  };
};

/**
 * Hook for user's progress information only
 */
export const useUserProgressInfo = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [progressInfo, setProgressInfo] = useState<UserProgressInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressInfo = useCallback(async () => {
    if (!isAuthenticated || !user || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      userApiClient.updateOptions({
        userId: user.user_id,
        token: token
      });

      const data = await userApiClient.getProgressInfo();
      setProgressInfo(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress info';
      setError(errorMessage);
      console.error('Error fetching progress info:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, token]);

  useEffect(() => {
    fetchProgressInfo();
  }, [fetchProgressInfo]);

  return {
    progressInfo,
    loading,
    error,
    refetch: fetchProgressInfo
  };
};