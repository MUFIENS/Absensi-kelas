import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohllvcwdrxewzfbjhhsr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obGx2Y3dkcnhld3pmYmpoaHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4ODQzMTQsImV4cCI6MjEwMjQ2MDMxNH0.W5s-yq7y4Y7binVqRYKmK1FUq3ndEN_iyUQoHLakNvc';

export function getSupabaseServerClient() {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
