import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables at runtime, not module load time
const getSupabaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: Next.js replaces process.env.NEXT_PUBLIC_* at build time
    return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  }
  // Server-side
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
};

const getSupabaseAnonKey = () => {
  if (typeof window !== 'undefined') {
    // Client-side: Next.js replaces process.env.NEXT_PUBLIC_* at build time
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }
  // Server-side
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
};

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  const isValid = !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.length > 10 &&
    supabaseAnonKey.length > 10 &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your_supabase') &&
    !supabaseUrl.includes('your-project-ref')
  );

  if (!isValid) {
    // Supabase not configured - will use localStorage fallback
  }

  return isValid;
};

// Singleton Supabase client instance
let _supabaseClient: SupabaseClient | null | undefined = undefined;

// Create and export the Supabase client only if properly configured
export function getSupabaseClient(): SupabaseClient | null {
  // Return cached result if already determined
  if (_supabaseClient !== undefined) {
    return _supabaseClient;
  }

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  // Validate configuration
  const isValid = !!(
    url &&
    key &&
    url.length > 10 &&
    key.length > 10 &&
    url.startsWith('http') &&
    !url.includes('placeholder') &&
    !url.includes('your_supabase') &&
    !url.includes('your-project-ref')
  );

  if (!isValid) {
    // Supabase not configured - will use localStorage fallback
    _supabaseClient = null;
    return null;
  }

  try {
    _supabaseClient = createClient(url, key);
    return _supabaseClient;
  } catch (error) {
    // Critical error - keep console.error for debugging
    console.error('[Supabase] Failed to create client:', error);
    _supabaseClient = null;
    return null;
  }
}

// Export as const for backward compatibility
// This will be null if Supabase is not configured
export const supabase = getSupabaseClient();

// Import database types
export type { Lead, VerificationCode } from './database/types';