// Database schema types for Supabase tables

// Lead table schema - Updated to match actual step names
export interface DbLead {
  id: string; // phone number as ID
  welcome: string;        // Service type selection
  custom_service: string; // Custom service details
  budget: string;         // Budget range
  timeline: string;       // Project timeline
  details: string;        // Additional details
  name: string;           // Customer name
  phone: string;          // Phone number
  verified: boolean;      // Phone verification status
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