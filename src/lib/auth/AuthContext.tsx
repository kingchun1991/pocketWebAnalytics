'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  site_id: string;
  permissions: {
    analytics: { read: boolean; write: boolean; delete: boolean };
    users: { read: boolean; write: boolean; delete: boolean };
    settings: { read: boolean; write: boolean };
  };
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    passwordConfirm: string;
    site_id: string;
    role: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      verifyToken(savedToken);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          token: tokenToVerify,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setToken(tokenToVerify);
          localStorage.setItem('auth_token', tokenToVerify);
        } else {
          localStorage.removeItem('auth_token');
        }
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (err) {
      console.error('Token verification failed:', err);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          ...credentials,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setToken(data.token);
        setError(null); // Clear any previous errors
        localStorage.setItem('auth_token', data.token);

        // Log successful login
        console.log(
          'Login successful:',
          data.user.email,
          'Role:',
          data.user.role
        );
      } else {
        setError(data.error || 'Login failed');
        console.error('Login failed:', data.error);
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    passwordConfirm: string;
    site_id: string;
    role: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register',
          ...data,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Auto-login after successful registration
        await login({ email: data.email, password: data.password });
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');

    // Call logout endpoint
    fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'logout',
      }),
    }).catch(console.error);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
