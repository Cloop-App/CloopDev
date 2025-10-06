interface SignupResponse {
  user: {
    user_id: number;
    email: string;
    name: string;
    created_at: string;
    num_chats: number;
    num_lessons: number;
  };
}

interface SignupData {
  name: string;
  email: string;
  phone?: string;
  grade_level?: string;
  board?: string;
  subjects?: string[];
  preferred_language?: string;
  study_goal?: string;
}

export const signupUser = async (userData: SignupData): Promise<SignupResponse> => {
  try {
    const response = await fetch('http://localhost:4000/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

