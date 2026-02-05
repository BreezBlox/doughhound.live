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

    const validateAndLoad = async () => {
      if (savedUser && savedToken) {
        try {
          // Verify token validity
          const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${savedToken}`);

          if (!response.ok) {
            console.warn('Saved token is invalid or expired');
            throw new Error('Token expired');
          }

          setUser(JSON.parse(savedUser));
          setAccessToken(savedToken);
        } catch (e) {
          console.error('Failed to restore session:', e);
          // Clear invalid session
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setUser(null);
          setAccessToken(null);
        }
      }
      setIsLoading(false);
    };

    validateAndLoad();
  }, []);

  const login = async (token: string) => {
    try {
      // With access token (useGoogleLogin), we need to fetch user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userData = await userInfoResponse.json();

      const appUser: AppUser = {
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        sub: userData.id, // Google UserInfo API returns 'id', not 'sub'
        sheetId: undefined,
      };

      // Check if user has a saved sheetId
      const savedUserData = localStorage.getItem(`doughhound_userdata_${appUser.sub}`);
      if (savedUserData) {
        const storedData = JSON.parse(savedUserData);
        appUser.sheetId = storedData.sheetId;
      }

      setUser(appUser);
      setAccessToken(token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(appUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (e) {
      console.error('Login error:', e);
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
