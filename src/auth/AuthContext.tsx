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
      if (!session) {
        setUser(null);
        setAccessToken(null);
        setSupabaseUserId(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setIsLoading(false);
        return;
      }

      const { user: sessionUser, provider_token } = session;
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const effectiveToken = provider_token || storedToken || null;
      const metadata = sessionUser.user_metadata ?? {};
      const userId = sessionUser.id;

      const providerSub = metadata.sub || metadata.provider_id || userId;
      const storedLocal = localStorage.getItem(`doughhound_userdata_${userId}`) || localStorage.getItem(`doughhound_userdata_${providerSub}`);
      const localSheetId = storedLocal ? JSON.parse(storedLocal).sheetId : undefined;

      let sheetId = localSheetId;
      const remoteSheetId = await fetchProfileSheetId(userId);
      if (remoteSheetId) {
        sheetId = remoteSheetId;
      } else if (localSheetId) {
        await upsertProfileSheetId(userId, localSheetId);
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
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(appUser));
      if (provider_token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, provider_token);
      }
      setIsLoading(false);
    };

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      await applySession(data.session);
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
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setSupabaseUserId(null);
    await supabase.auth.signOut();
  };

  const setSheetId = async (sheetId: string) => {
    if (user) {
      const updatedUser = { ...user, sheetId };
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      // Also save to user-specific storage for persistence across logins
      const resolvedUserId = supabaseUserId ?? await getSupabaseUserId();
      const localUserKey = resolvedUserId ?? user.sub;
      localStorage.setItem(`doughhound_userdata_${localUserKey}`, JSON.stringify({ sheetId }));

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
