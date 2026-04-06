import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Jonas Loto Center: Missing Supabase configuration! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel Environment Variables.');
}

// Ensure we don't pass empty strings if possible, or at least handle the error
// FIX: Disable session persistence - user must login manually each time
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: false, // Don't save session to localStorage
      autoRefreshToken: false, // Don't auto-refresh tokens
      detectSessionInUrl: false // Don't detect session in URL
    }
  }
);
