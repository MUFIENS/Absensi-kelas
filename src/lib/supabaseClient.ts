import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohllvcwdrxewzfbjhhsr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obGx2Y3dkcnhld3pmYmpoaHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4ODQzMTQsImV4cCI6MjEwMjQ2MDMxNH0.W5s-yq7y4Y7binVqRYKmK1FUq3ndEN_iyUQoHLakNvc';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
