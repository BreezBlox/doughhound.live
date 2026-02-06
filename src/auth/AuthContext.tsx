import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabaseClient';
import { fetchProfileSheetId, getSupabaseUserId, upsertProfileSheetId } from '@/services/profileService';

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
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setSheetId: (sheetId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const USER_STORAGE_KEY = 'doughhound_user';
const TOKEN_STORAGE_KEY = 'doughhound_token';

const safeStorageGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Local storage read failed:', error);
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Local storage write failed:', error);
  }
};

const safeStorageRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Local storage remove failed:', error);
  }
};

const safeJsonParse = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Local storage JSON parse failed:', error);
    return null;
  }
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await new Promise<T>((resolve, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      promise.then(resolve, reject);
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  // Load user from storage on mount
  useEffect(() => {
    const applySession = async (session: Session | null) => {
      try {
        if (!session) {
          setUser(null);
          setAccessToken(null);
          setSupabaseUserId(null);
          safeStorageRemove(USER_STORAGE_KEY);
          safeStorageRemove(TOKEN_STORAGE_KEY);
          return;
        }

        const { user: sessionUser, provider_token } = session;
        const storedToken = safeStorageGet(TOKEN_STORAGE_KEY);
        const effectiveToken = provider_token || storedToken || null;
        const metadata = sessionUser.user_metadata ?? {};
        const userId = sessionUser.id;

        const providerSub = metadata.sub || metadata.provider_id || userId;
        const localKeys = [
          `doughhound_userdata_${userId}`,
          `doughhound_userdata_${providerSub}`,
        ];

        let localSheetId: string | undefined;
        for (const key of localKeys) {
          const storedLocal = safeStorageGet(key);
          if (!storedLocal) continue;
          const parsed = safeJsonParse(storedLocal);
          if (parsed?.sheetId) {
            localSheetId = parsed.sheetId;
            break;
          }
          safeStorageRemove(key);
        }

        let sheetId = localSheetId;
        let remoteSheetId: string | null = null;
        try {
          remoteSheetId = await withTimeout(fetchProfileSheetId(userId), 4000, 'Profile fetch');
        } catch (error) {
          console.warn('Profile fetch failed or timed out:', error);
        }

        if (remoteSheetId) {
          sheetId = remoteSheetId;
        } else if (localSheetId) {
          try {
            await withTimeout(upsertProfileSheetId(userId, localSheetId), 4000, 'Profile upsert');
          } catch (error) {
            console.warn('Profile upsert failed or timed out:', error);
          }
        }

        const appUser: AppUser = {
          email: sessionUser.email || metadata.email || '',
          name: metadata.full_name || metadata.name || sessionUser.email || 'Operator',
          picture: metadata.avatar_url || metadata.picture || '',
          sub: metadata.sub || metadata.provider_id || userId,
          sheetId,
        };

        setSupabaseUserId(userId);
        setUser(appUser);
        setAccessToken(effectiveToken);
        safeStorageSet(USER_STORAGE_KEY, JSON.stringify(appUser));
        if (provider_token) {
          safeStorageSet(TOKEN_STORAGE_KEY, provider_token);
        }
      } catch (error) {
        console.warn('Auth session apply failed:', error);
        setUser(null);
        setAccessToken(null);
        setSupabaseUserId(null);
        safeStorageRemove(USER_STORAGE_KEY);
        safeStorageRemove(TOKEN_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    const init = async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 4000, 'Session load');
        await applySession(data.session);
      } catch (error) {
        console.warn('Supabase session load failed:', error);
        setIsLoading(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session);
    });

    init();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async () => {
    const redirectTo = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'openid email profile https://www.googleapis.com/auth/spreadsheets',
        redirectTo,
      },
    });
  };

  const logout = async () => {
    setUser(null);
    setAccessToken(null);
    safeStorageRemove(USER_STORAGE_KEY);
    safeStorageRemove(TOKEN_STORAGE_KEY);
    setSupabaseUserId(null);
    await supabase.auth.signOut();
  };

  const setSheetId = async (sheetId: string) => {
    if (user) {
      const updatedUser = { ...user, sheetId };
      setUser(updatedUser);
      safeStorageSet(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      // Also save to user-specific storage for persistence across logins
      const resolvedUserId = supabaseUserId ?? await getSupabaseUserId();
      const localUserKey = resolvedUserId ?? user.sub;
      safeStorageSet(`doughhound_userdata_${localUserKey}`, JSON.stringify({ sheetId }));

      const userId = supabaseUserId ?? await getSupabaseUserId();
      if (userId) {
        await upsertProfileSheetId(userId, sheetId);
      } else {
        console.warn('Supabase user not available; sheetId not synced remotely');
      }
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
