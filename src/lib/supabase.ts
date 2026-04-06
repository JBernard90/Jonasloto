import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Jonas Loto Center: Missing Supabase configuration! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel Environment Variables.');
}

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co';

// Ensure we don't pass empty strings if possible, or at least handle the error
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
