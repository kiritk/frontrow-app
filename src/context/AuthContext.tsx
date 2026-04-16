import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { migrateGuestEvents } from '../lib/eventService';
import { clearLocalEvents } from '../lib/localStorage';

const PROFILE_STORAGE_KEY = 'frontrow_user_profile';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  migrateLocalEventsToAccount: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  // Log out and wipe the app back to its default/empty state: clear
  // the cached profile (name + avatar) and all locally-stored events
  // (including photos) before ending the Supabase session.
  const signOut = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(PROFILE_STORAGE_KEY),
        clearLocalEvents(),
      ]);
    } catch (error) {
      console.warn('[AuthContext] Failed to clear local data on sign out:', error);
    }
    await supabase.auth.signOut();
  };

  // Migrate local events to user's Supabase account.
  // Local events (including photos) are preserved — only text fields
  // are copied to the cloud.  Local IDs are updated to match Supabase
  // UUIDs so future edits/deletes stay in sync.
  const migrateLocalEventsToAccount = async (): Promise<number> => {
    if (!user) return 0;
    try {
      return await migrateGuestEvents(user.id);
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    isGuest: !user,
    signUp,
    signIn,
    signOut,
    migrateLocalEventsToAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
