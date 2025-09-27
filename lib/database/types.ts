// Database schema types for Supabase tables

// Lead table schema - Updated with new column order and additional fields
export interface DbLead {
  // Primary key
  id: string;                     // phone number as ID

  // Core customer information (priority fields)
  name: string;                   // Customer name
  phone: string;                  // Phone number

  // First 4 question responses (user requested priority)
  welcome?: string;               // Q1: Service type selection
  business_status?: string;       // Q2: Business registration status
  pre_startup_package?: string;   // Q3: Pre-startup package awareness
  gov_support_knowledge?: string; // Q4: Government support knowledge level

  // Additional question responses
  budget?: string;                // Budget range
  timeline?: string;              // Project timeline
  details?: string;               // Additional details
  custom_service?: string;        // Custom service details (other inquiries)

  // System fields
  verified: boolean;              // Phone verification status
  created_at: string;             // Record creation timestamp
  updated_at?: string;            // Last update timestamp
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

// Helper type for lead form data (before database insertion)
export interface LeadFormData {
  name?: string;
  phone?: string;
  welcome?: string;
  business_status?: string;
  pre_startup_package?: string;
  gov_support_knowledge?: string;
  budget?: string;
  timeline?: string;
  details?: string;
  custom_service?: string;
  verified?: boolean;
}

// Type for lead summary in admin views
export interface LeadSummary {
  id: string;
  name: string;
  phone: string;
  welcome?: string;
  verified: boolean;
  created_at: string;
}

// Type for question response mapping
export interface QuestionResponse {
  step: string;
  value: string;
}