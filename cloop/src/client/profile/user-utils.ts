import { userApiClient } from './user-api-client';

/**
 * Utility functions for common user data operations
 */

/**
 * Get user data needed for home screen
 */
export const getHomeScreenData = async () => {
  const [profile, academicInfo, progressInfo] = await Promise.all([
    userApiClient.getProfile(),
    userApiClient.getAcademicInfo(),
    userApiClient.getProgressInfo()
  ]);

  return {
    profile,
    academicInfo,
    progressInfo,
    displayName: profile.name || 'User',
    avatarUrl: profile.avatar_url || 
               `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=10B981&color=fff&size=128`,
    hasCompleteAcademicInfo: !!(academicInfo.board && academicInfo.grade_level && academicInfo.subjects?.length > 0)
  };
};

/**
 * Get user data needed for profile screen
 */
export const getProfileScreenData = async () => {
  const [profile, profileCompleteness] = await Promise.all([
    userApiClient.getProfile(),
    userApiClient.isProfileComplete()
  ]);

  return {
    profile,
    isComplete: profileCompleteness.isComplete,
    missingFields: profileCompleteness.missingFields,
    avatarUrl: await userApiClient.getAvatarUrl(),
    displayName: await userApiClient.getDisplayName()
  };
};

/**
 * Get user's academic setup status
 */
export const getAcademicSetupStatus = async () => {
  const academicInfo = await userApiClient.getAcademicInfo();
  
  const hasBoard = !!academicInfo.board;
  const hasGrade = !!academicInfo.grade_level;
  const hasSubjects = academicInfo.subjects?.length > 0;
  const hasLanguage = !!academicInfo.preferred_language;
  const hasGoal = !!academicInfo.study_goal;

  return {
    academicInfo,
    completionStatus: {
      hasBoard,
      hasGrade,
      hasSubjects,
      hasLanguage,
      hasGoal,
      isComplete: hasBoard && hasGrade && hasSubjects,
      completionPercentage: Math.round(
        ([hasBoard, hasGrade, hasSubjects, hasLanguage, hasGoal].filter(Boolean).length / 5) * 100
      )
    }
  };
};

/**
 * Get user's study dashboard data
 */
export const getStudyDashboardData = async () => {
  const [academicInfo, progressInfo] = await Promise.all([
    userApiClient.getAcademicInfo(),
    userApiClient.getProgressInfo()
  ]);

  const subjectProgress = academicInfo.subjects?.map(subject => ({
    name: subject,
    progress: Math.floor(Math.random() * 100), // Replace with actual progress calculation
    lessonsCompleted: Math.floor(Math.random() * 20),
    totalLessons: 20
  })) || [];

  return {
    academicInfo,
    progressInfo,
    subjectProgress,
    totalProgress: {
      chats: progressInfo.num_chats,
      lessons: progressInfo.num_lessons,
      subjects: academicInfo.subjects?.length || 0
    }
  };
};

/**
 * Check if user needs to complete profile setup
 */
export const checkProfileSetupNeeded = async () => {
  const profileCompleteness = await userApiClient.isProfileComplete();
  const academicStatus = await getAcademicSetupStatus();

  return {
    needsBasicProfile: !profileCompleteness.isComplete,
    needsAcademicSetup: !academicStatus.completionStatus.isComplete,
    missingFields: profileCompleteness.missingFields,
    nextStep: !profileCompleteness.isComplete 
      ? 'complete_basic_profile' 
      : !academicStatus.completionStatus.isComplete 
        ? 'complete_academic_setup'
        : 'profile_complete'
  };
};