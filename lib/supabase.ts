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

// Type definitions for our database
export interface Lead {
  id: string; // phone number as ID
  service: string;
  budget: string;
  timeline: string;
  message: string;
  name: string;
  phone: string;
  verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface VerificationCode {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  created_at: string;
}