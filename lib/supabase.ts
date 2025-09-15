import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseAnonKey &&
         supabaseUrl.startsWith('http') &&
         !supabaseUrl.includes('placeholder') &&
         !supabaseUrl.includes('your_supabase');
};

// Create a single supabase client for interacting with your database
// Only create if properly configured, otherwise create a dummy client
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

// Import database types
export type { Lead, VerificationCode } from './database/types';