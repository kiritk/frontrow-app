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

export interface Event {
  id: string;
  user_id: string;
  event_name: string;
  event_type: 'concert' | 'sports' | 'theater' | 'comedy' | 'festival' | 'other';
  venue: string;
  city: string;
  event_date: string;
  section?: string;
  row?: string;
  seat?: string;
  rating?: number;
  notes?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at'>;
export type EventUpdate = Partial<EventInsert>;
