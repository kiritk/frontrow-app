import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  // Bumps whenever locally-stored events are rewritten out-of-band
  // (e.g. guest events migrated to a new account).  Screens can
  // include this in their fetch-effect deps to stay in sync.
  localEventsVersion: number;
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
  const [localEventsVersion, setLocalEventsVersion] = useState(0);

  // Track the last user id we've already handled so we only migrate
  // once per guest-to-signed-in transition (and not on token refreshes
  // or duplicate INITIAL_SESSION events).
  const migratedForUserIdRef = useRef<string | null>(null);

  // Migrate any local_* guest events to the newly-signed-in account.
  // Safe to call repeatedly — no-ops when there's nothing to migrate.
  const runGuestMigration = async (userId: string) => {
    if (migratedForUserIdRef.current === userId) return;
    migratedForUserIdRef.current = userId;
    try {
      const migrated = await migrateGuestEvents(userId);
      if (migrated > 0) {
        // Storage IDs changed — tell screens to refetch.
        setLocalEventsVersion(v => v + 1);
      }
    } catch (error) {
      console.warn('[AuthContext] Guest event migration failed:', error);
      // Clear the guard so a future auth event can retry.
      migratedForUserIdRef.current = null;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        runGuestMigration(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        runGuestMigration(nextUser.id);
      } else {
        migratedForUserIdRef.current = null;
      }
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
    localEventsVersion,
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
