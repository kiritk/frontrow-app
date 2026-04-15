import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwduncjcpimagkeqoqtl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZHVuY2pjcGltYWdrZXFvcXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjc1NDIsImV4cCI6MjA4ODg0MzU0Mn0.w05rpd5vTPkklrul7KsCRccCs27Vj5LoACrml5qoJRM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export interface SupabaseEvent {
  id: string;
  user_id: string;
  title: string;
  type: string;
  sport?: string | null;
  venue: string;
  venue_location?: string | null;
  date: string;
  latitude?: number | null;
  longitude?: number | null;
  home_team?: { name: string; city: string; fullName: string } | null;
  away_team?: { name: string; city: string; fullName: string } | null;
  created_at: string;
}

export type SupabaseEventInsert = Omit<SupabaseEvent, 'id' | 'created_at'>;
