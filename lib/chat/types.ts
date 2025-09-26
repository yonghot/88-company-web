export type MessageType = 'bot' | 'user';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  options?: string[];
}

export interface ChatStep {
  id: string;
  question: string;
  inputType: 'select' | 'text' | 'email' | 'phone' | 'textarea';
  options?: string[];
  placeholder?: string;
  validation?: (value: string) => boolean;
  nextStep?: (value?: string) => string;
}

export interface ChatState {
  currentStep: string;
  messages: Message[];
  leadData: LeadData;
  isCompleted: boolean;
}

// Lead 데이터는 chat과 다른 곳에서도 사용되므로 별도로 export
// Updated to match actual step names
export interface LeadData {
  id?: string;
  welcome?: string;        // Service type selection (was 'service')
  customService?: string;  // Custom service details (new)
  custom_service?: string; // Alternative naming for compatibility
  budget?: string;         // Budget range
  timeline?: string;       // Project timeline
  details?: string;        // Additional details (was 'message')
  name?: string;           // Customer name
  phone?: string;          // Phone number
  email?: string;          // Email (optional)
  service?: string;        // Legacy support
  message?: string;        // Legacy support
  createdAt?: Date;
  verified?: boolean;
  [key: string]: any;      // Allow dynamic keys for step names
}