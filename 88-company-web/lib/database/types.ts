// Database schema types for Supabase tables

// Lead table schema - Aligned with current chatbot questions
export interface DbLead {
  // Primary key
  id: string;                     // phone number as ID

  // Chatbot question responses (in order)
  welcome?: string;               // Q1: 예비창업자 여부
  experience?: string;            // Q2: 정부지원사업 경험
  business_idea?: string;         // Q3: 사업 아이템
  region?: string;                // Q4: 지역
  gender?: string;                // Q5: 성별
  age?: string;                   // Q6: 나이
  name: string;                   // Q7: 고객 이름
  phone: string;                  // Q8: 전화번호

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
  experience?: string;
  business_idea?: string;
  region?: string;
  gender?: string;
  age?: string;
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
