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
    console.log('Login request:', { url: `${API_BASE_URL}/api/login`, data });
    
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Login response status:', response.status);
    console.log('Login response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Login error response:', errorText);
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || 'Login failed' };
      }
      
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();
    console.log('Login success:', result);
    return result;
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    throw error;
  }
};

