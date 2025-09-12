import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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