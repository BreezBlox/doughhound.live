import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// User type from Google OAuth
export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string; // Google's unique user ID
}

// Extended user with app-specific data
export interface AppUser extends GoogleUser {
  sheetId?: string; // User's linked Google Sheet ID
}

interface AuthContextType {
  user: AppUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (credential: string) => void;
  logout: () => void;
  setSheetId: (sheetId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode JWT token from Google
function decodeJwt(token: string): GoogleUser {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

// Storage keys
const USER_STORAGE_KEY = 'doughhound_user';
const TOKEN_STORAGE_KEY = 'doughhound_token';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setAccessToken(savedToken);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (credential: string) => {
    try {
      const decoded = decodeJwt(credential);
      const appUser: AppUser = {
        ...decoded,
        sheetId: undefined,
      };
      
      // Check if user has a saved sheetId
      const savedUserData = localStorage.getItem(`doughhound_userdata_${decoded.sub}`);
      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        appUser.sheetId = userData.sheetId;
      }
      
      setUser(appUser);
      setAccessToken(credential);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(appUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, credential);
    } catch (e) {
      console.error('Failed to decode credential:', e);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const setSheetId = (sheetId: string) => {
    if (user) {
      const updatedUser = { ...user, sheetId };
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      // Also save to user-specific storage for persistence across logins
      localStorage.setItem(`doughhound_userdata_${user.sub}`, JSON.stringify({ sheetId }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, setSheetId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
