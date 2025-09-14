// Database schema types for Supabase tables

// Lead table schema
export interface DbLead {
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

// Verification code table schema
export interface DbVerificationCode {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  created_at: string;
}

// Type aliases for backward compatibility
export type Lead = DbLead;
export type VerificationCode = DbVerificationCode;