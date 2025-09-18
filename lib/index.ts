// Main library barrel exports

// Re-export types for convenience
export * from './types';

// Re-export all modules
export * from './chat';
export * from './sms';
export * from './database/types';

// Export utility functions
export { cn } from './utils';

// Export Supabase client
export { supabase } from './supabase';
// Export Supabase types
export type { Lead, VerificationCode } from './supabase';