import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export interface User {
  user_id: number;
  email: string;
  name: string;
  grade_level?: string;
  subjects?: string[];
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

class AuthService {
  private static instance: AuthService;
  private _authState: AuthState = {
    token: null,
    user: null,
    isAuthenticated: false,
  };

  private listeners: Array<(state: AuthState) => void> = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY)
      ]);

      if (token && userData) {
        const user = JSON.parse(userData);
        this._authState = {
          token,
          user,
          isAuthenticated: true,
        };
        this.notifyListeners();
      } else {
        // Ensure state is properly reset if no data found
        this._authState = {
          token: null,
          user: null,
          isAuthenticated: false,
        };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Reset state on error
      this._authState = {
        token: null,
        user: null,
        isAuthenticated: false,
      };
      this.notifyListeners();
      // Clear any corrupted data
      try {
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_KEY]);
      } catch (clearError) {
        console.error('Error clearing corrupted auth data:', clearError);
      }
    }
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this._authState));
  }

  public async login(token: string, user: User): Promise<void> {
    try {
      // Store the actual JWT token, not a placeholder
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      this._authState = {
        token,
        user,
        isAuthenticated: true,
      };

      this.notifyListeners();
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  public async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);

      this._authState = {
        token: null,
        user: null,
        isAuthenticated: false,
      };

      this.notifyListeners();
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  public getAuthState(): AuthState {
    return { ...this._authState };
  }

  public getToken(): string | null {
    return this._authState.token;
  }

  public getUser(): User | null {
    return this._authState.user;
  }

  public isAuthenticated(): boolean {
    return this._authState.isAuthenticated;
  }

  public async refreshAuthState(): Promise<void> {
    await this.initializeAuth();
  }
}

export default AuthService;