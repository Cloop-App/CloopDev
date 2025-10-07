import { 
  UserProfile, 
  UserBasicInfo, 
  UserAcademicInfo, 
  UserProgressInfo,
  fetchUserProfile,
  fetchUserBasicInfo,
  fetchUserAcademicInfo,
  fetchUserProgressInfo,
  fetchUserBoard,
  fetchUserSubjects,
  fetchUserStudyPreferences
} from './user-info';

export interface ApiClientOptions {
  userId?: number;
  baseUrl?: string;
  token?: string;
}

/**
 * Comprehensive API client for user-related operations
 */
export class UserApiClient {
  private options: ApiClientOptions;

  constructor(options: ApiClientOptions = {}) {
    this.options = options;
  }

  /**
   * Update API client options (useful for setting token after login)
   */
  updateOptions(newOptions: Partial<ApiClientOptions>) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get complete user profile
   */
  async getProfile(): Promise<UserProfile> {
    return fetchUserProfile(this.options);
  }

  /**
   * Get user's basic information
   */
  async getBasicInfo(): Promise<UserBasicInfo> {
    return fetchUserBasicInfo(this.options);
  }

  /**
   * Get user's academic information (board, grade, subjects)
   */
  async getAcademicInfo(): Promise<UserAcademicInfo> {
    return fetchUserAcademicInfo(this.options);
  }

  /**
   * Get user's progress information
   */
  async getProgressInfo(): Promise<UserProgressInfo> {
    return fetchUserProgressInfo(this.options);
  }

  /**
   * Get user's board and grade information
   */
  async getBoardInfo(): Promise<{ board: string; grade_level: string }> {
    return fetchUserBoard(this.options);
  }

  /**
   * Get user's selected subjects
   */
  async getSubjects(): Promise<{ subjects: string[]; preferred_language: string }> {
    return fetchUserSubjects(this.options);
  }

  /**
   * Get user's complete study preferences
   */
  async getStudyPreferences(): Promise<{
    board: string;
    grade_level: string;
    subjects: string[];
    preferred_language: string;
    study_goal: string;
  }> {
    return fetchUserStudyPreferences(this.options);
  }

  /**
   * Get specific user data fields
   */
  async getSpecificFields<T extends keyof UserProfile>(
    fields: T[]
  ): Promise<Pick<UserProfile, T>> {
    const profile = await this.getProfile();
    const result = {} as Pick<UserProfile, T>;
    
    fields.forEach(field => {
      if (field in profile) {
        result[field] = profile[field];
      }
    });
    
    return result;
  }

  /**
   * Check if user has completed their profile setup
   */
  async isProfileComplete(): Promise<{
    isComplete: boolean;
    missingFields: string[];
  }> {
    const profile = await this.getProfile();
    const requiredFields = ['name', 'email', 'grade_level', 'board', 'subjects'];
    const missingFields: string[] = [];

    requiredFields.forEach(field => {
      const value = profile[field as keyof UserProfile];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        missingFields.push(field);
      }
    });

    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Get user's avatar URL with fallback
   */
  async getAvatarUrl(): Promise<string> {
    const basicInfo = await this.getBasicInfo();
    return basicInfo.avatar_url || 
           `https://ui-avatars.com/api/?name=${encodeURIComponent(basicInfo.name)}&background=10B981&color=fff&size=128`;
  }

  /**
   * Get user's display name
   */
  async getDisplayName(): Promise<string> {
    const basicInfo = await this.getBasicInfo();
    return basicInfo.name || 'User';
  }
}

// Export singleton instance
export const userApiClient = new UserApiClient();

// Export all types and functions for direct use
export {
  UserProfile,
  UserBasicInfo,
  UserAcademicInfo,
  UserProgressInfo,
  fetchUserProfile,
  fetchUserBasicInfo,
  fetchUserAcademicInfo,
  fetchUserProgressInfo,
  fetchUserBoard,
  fetchUserSubjects,
  fetchUserStudyPreferences
};