import { API_BASE_URL } from '../../config/api';

interface LoginResponse {
  token?: string;
  user: {
    user_id: number;
    email: string;
    name: string;
  };
}

interface LoginRequest {
  emailOrPhone: string;
}

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

