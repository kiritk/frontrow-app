import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getLocalEvents, clearLocalEvents } from '../lib/localStorage';

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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Migrate local events to user's account
  const migrateLocalEventsToAccount = async (): Promise<number> => {
    if (!user) return 0;

    try {
      const localEvents = await getLocalEvents();
      if (localEvents.length === 0) return 0;

      // Prepare events for Supabase (remove local id, add user_id)
      const eventsToInsert = localEvents.map(event => ({
        user_id: user.id,
        title: event.title,
        type: event.type,
        sport: event.sport || null,
        venue: event.venue,
        venue_location: event.venue_location || null,
        date: event.date,
        photos: event.photos || [],
        latitude: event.latitude || null,
        longitude: event.longitude || null,
        home_team: event.home_team || null,
        away_team: event.away_team || null,
      }));

      const { error } = await supabase.from('events').insert(eventsToInsert);
      
      if (error) {
        console.error('Error migrating events:', error);
        throw error;
      }

      // Clear local events after successful migration
      await clearLocalEvents();
      
      return localEvents.length;
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
