import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AuthService, { AuthState, User } from '../services/auth';

// Import debug utils in development
if (__DEV__) {
  import('../utils/authDebug');
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const authService = AuthService.getInstance();

  useEffect(() => {
    // Initialize auth state
    const initialize = async () => {
      const initialState = authService.getAuthState();
      setAuthState(initialState);

      // Subscribe to auth state changes
      const unsubscribe = authService.subscribe((newState) => {
        setAuthState(newState);
      });

      // Refresh auth state to load from storage
      await authService.refreshAuthState();
      setIsLoading(false);

      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    
    initialize().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const login = async (token: string, user: User): Promise<void> => {
    await authService.login(token, user);
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
  };

  const refreshAuth = async (): Promise<void> => {
    await authService.refreshAuthState();
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};