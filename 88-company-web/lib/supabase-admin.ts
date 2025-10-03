import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client for Server-Side Operations
 * Uses Service Role Key to bypass RLS policies
 *
 * SECURITY WARNING: Never expose SERVICE_ROLE_KEY to client-side code!
 * This should only be used in API routes and server-side operations.
 */

// Get environment variables
const getSupabaseUrl = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
};

const getSupabaseServiceKey = () => {
  // Try to get service role key first, fallback to anon key
  return process.env.SUPABASE_SERVICE_ROLE_KEY ||
         process.env.SUPABASE_SERVICE_KEY ||
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
};

// Check if Supabase is configured
export const isSupabaseAdminConfigured = () => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseServiceKey();

  return !!(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.length > 10 &&
    supabaseKey.length > 10 &&
    supabaseUrl.startsWith('http')
  );
};

// Singleton Admin client instance
let _adminClient: SupabaseClient | null | undefined = undefined;

// Create Admin client with Service Role Key (bypasses RLS)
export function getSupabaseAdmin(): SupabaseClient | null {
  // Return cached result if already determined
  if (_adminClient !== undefined) {
    return _adminClient;
  }

  const url = getSupabaseUrl();
  const key = getSupabaseServiceKey();

  // Validate configuration
  if (!url || !key || url.length < 10 || key.length < 10) {
    console.warn('[Supabase Admin] Service Role Key not configured, falling back to anon key');
    _adminClient = null;
    return null;
  }

  try {
    // Create client with service role key
    _adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.log('[Supabase Admin] Admin client created (RLS bypassed)');
    return _adminClient;
  } catch (error) {
    console.error('[Supabase Admin] Failed to create admin client:', error);
    _adminClient = null;
    return null;
  }
}

// Export admin client
export const supabaseAdmin = getSupabaseAdmin();